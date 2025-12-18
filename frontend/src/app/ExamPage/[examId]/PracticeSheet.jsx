"use client"
import { useEffect, useRef, useState } from 'react'
import {
  LocaleType,
  mergeLocales,
  Univer,
  UniverInstanceType,
  ICommandService,
  IUniverInstanceService
} from '@univerjs/core'
import DesignEnUS from '@univerjs/design/locale/en-US'
import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverDocsUIPlugin } from '@univerjs/docs-ui'
import DocsUIEnUS from '@univerjs/docs-ui/locale/en-US'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { UniverSheetsFormulaUIPlugin } from '@univerjs/sheets-formula-ui'
import SheetsFormulaUIEnUS from '@univerjs/sheets-formula-ui/locale/en-US'
import { UniverSheetsNumfmtUIPlugin } from '@univerjs/sheets-numfmt-ui'
import SheetsNumfmtUIEnUS from '@univerjs/sheets-numfmt-ui/locale/en-US'
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'
import SheetsUIEnUS from '@univerjs/sheets-ui/locale/en-US'
import SheetsEnUS from '@univerjs/sheets/locale/en-US'
import { UniverUIPlugin } from '@univerjs/ui'
import UIEnUS from '@univerjs/ui/locale/en-US'
import useExamStore from '../../../store/useExamStore'

import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/docs-ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/sheets-formula-ui/lib/index.css'
import '@univerjs/sheets-numfmt-ui/lib/index.css'

export default function PracticeSheet() {
  const containerRef = useRef(null)
  const univerRef = useRef(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const saveTimeoutRef = useRef(null)
  const cleanupFnsRef = useRef([])

  const currentQuestion = useExamStore(state => state.currentQuestion)
  const saveWorkbookState = useExamStore(state => state.saveWorkbookState)
  const getWorkbookState = useExamStore(state => state.getWorkbookState)

  /** 🔹 Initialize Univer only once */
  useEffect(() => {
    if (!containerRef.current || univerRef.current) return

    const univer = new Univer({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(
          DesignEnUS,
          UIEnUS,
          DocsUIEnUS,
          SheetsEnUS,
          SheetsUIEnUS,
          SheetsFormulaUIEnUS,
          SheetsNumfmtUIEnUS,
        ),
      },
    })

    univerRef.current = univer

    // Register plugins
    univer.registerPlugin(UniverRenderEnginePlugin)
    univer.registerPlugin(UniverFormulaEnginePlugin)
    univer.registerPlugin(UniverUIPlugin, { container: containerRef.current })
    univer.registerPlugin(UniverDocsPlugin)
    univer.registerPlugin(UniverDocsUIPlugin)
    univer.registerPlugin(UniverSheetsPlugin)
    univer.registerPlugin(UniverSheetsUIPlugin)
    univer.registerPlugin(UniverSheetsFormulaUIPlugin)
    univer.registerPlugin(UniverSheetsNumfmtUIPlugin)

    setIsInitialized(true)

    // On unmount → flush all workbook states & dispose
    return () => {
      try {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }

        const injector = univer.__getInjector()
        if (!injector) return

        const instanceService = injector.get(IUniverInstanceService)
        if (!instanceService) return

        // Try different methods to get all workbooks
        let allWorkbooks = []
        try {
          // Method 1: Try getAllUnitsForType (newer API)
          allWorkbooks = instanceService.getAllUnitsForType(UniverInstanceType.UNIVER_SHEET) || []
        } catch (e) {
          try {
            // Method 2: Try getUnitsForType
            allWorkbooks = instanceService.getUnitsForType(UniverInstanceType.UNIVER_SHEET) || []
          } catch (e2) {
            // Method 3: Fallback - manually track workbooks
            console.warn('Could not retrieve workbooks, using fallback')
          }
        }

        allWorkbooks.forEach(workbook => {
          try {
            const worksheet = workbook.getActiveSheet()
            if (worksheet) {
              const cellData = worksheet.getConfig().cellData || {}
              saveWorkbookState(workbook.getId(), {
                cellData: JSON.parse(JSON.stringify(cellData)),
                timestamp: Date.now()
              })
            }
          } catch (err) {
            console.error('Error saving workbook:', err)
          }
        })
      } catch (err) {
        console.error('Error flushing state:', err)
      }

      try {
        univer.dispose()
      } catch (e) {
        console.error('Error disposing univer:', e)
      }
      univerRef.current = null
    }
  }, [saveWorkbookState])

  /** 🔹 Switch workbook on question change */
  useEffect(() => {
    if (!univerRef.current || !isInitialized) return

    // Clean up previous listeners
    cleanupFnsRef.current.forEach(fn => fn())
    cleanupFnsRef.current = []

    const getWorkbookData = () => {
      const savedState = getWorkbookState(currentQuestion)
      if (savedState?.cellData) {
        return {
          id: `workbook-q${currentQuestion}`,
          name: `Question ${currentQuestion} Workbook`,
          sheetOrder: [`sheet-q${currentQuestion}`],
          sheets: {
            [`sheet-q${currentQuestion}`]: {
              id: `sheet-q${currentQuestion}`,
              name: `Q${currentQuestion} Rough Work`,
              cellData: savedState.cellData
            }
          }
        }
      }
      return {
        id: `workbook-q${currentQuestion}`,
        name: `Question ${currentQuestion} Workbook`,
        sheetOrder: [`sheet-q${currentQuestion}`],
        sheets: {
          [`sheet-q${currentQuestion}`]: {
            id: `sheet-q${currentQuestion}`,
            name: `Q${currentQuestion} Rough Work`,
            cellData: {}
          }
        }
      }
    }

    const workbookData = getWorkbookData()
    const instanceService = univerRef.current.__getInjector().get(IUniverInstanceService)

    // Already exists?
    let workbook = instanceService.getUnit(workbookData.id)
    if (!workbook) {
      // Create new workbook & keep alive
      workbook = univerRef.current.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData)
      const cleanup = setupAutoSave(univerRef.current, workbook, workbookData.id)
      cleanupFnsRef.current.push(cleanup)
    }

    // Switch to it
    instanceService.focusUnit(workbookData.id, UniverInstanceType.UNIVER_SHEET)

  }, [currentQuestion, isInitialized, getWorkbookState])

  /** 🔹 Auto-save setup for workbook */
  const setupAutoSave = (univer, workbook, workbookId) => {
    const commandService = univer.__getInjector().get(ICommandService)
    let isEditing = false
    
    const saveCurrentState = () => {
      try {
        const worksheet = workbook.getActiveSheet()
        if (worksheet) {
          const cellData = worksheet.getConfig().cellData || {}
          
          saveWorkbookState(workbookId, {
            cellData: JSON.parse(JSON.stringify(cellData)),
            timestamp: Date.now()
          })
          console.log('✅ Saved state for:', workbookId, cellData)
        }
      } catch (err) {
        console.error('Error auto-saving:', err)
      }
    }

    // Listen to specific command that indicates cell value has been set
    const disposeListener = commandService.onCommandExecuted((command) => {
      // Track editing state
      if (command.id === 'sheet.operation.set-activate-cell-edit') {
        isEditing = command.params?.visible !== false
      }

      // Save immediately after these critical commands
      if (command.id === 'sheet.command.set-range-values' || 
          command.id === 'sheet.mutation.set-range-values') {
        
        // Clear existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }

        // Save with minimal delay to catch the committed data
        saveTimeoutRef.current = setTimeout(() => {
          saveCurrentState()
        }, 50)
      }

      // Also save when cell edit is closed (user leaves the cell)
      if (command.id === 'sheet.operation.set-cell-edit-visible' && 
          command.params?.visible === false) {
        
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        
        // Immediate save when editing ends
        saveTimeoutRef.current = setTimeout(() => {
          saveCurrentState()
        }, 10)
      }
    })

    // Also save on blur/focus events
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveCurrentState()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Return cleanup function
    return () => {
      if (disposeListener && typeof disposeListener.dispose === 'function') {
        disposeListener.dispose()
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  return (
    <div className="editor-container h-full flex flex-col">
      <div className="flex-1 flex flex-col">
        <div ref={containerRef} className="h-full" style={{ minHeight: '400px' }}></div>
      </div>
    </div>
  )
}