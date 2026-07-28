"use client";
import { useEffect, useRef, useState } from "react";
import {
  LocaleType,
  mergeLocales,
  Univer,
  UniverInstanceType,
  ICommandService,
  IUniverInstanceService,
} from "@univerjs/core";
import DesignEnUS from "@univerjs/design/locale/en-US";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import DocsUIEnUS from "@univerjs/docs-ui/locale/en-US";
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverSheetsFormulaUIPlugin } from "@univerjs/sheets-formula-ui";
import SheetsFormulaUIEnUS from "@univerjs/sheets-formula-ui/locale/en-US";
import { UniverSheetsNumfmtUIPlugin } from "@univerjs/sheets-numfmt-ui";
import SheetsNumfmtUIEnUS from "@univerjs/sheets-numfmt-ui/locale/en-US";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import SheetsUIEnUS from "@univerjs/sheets-ui/locale/en-US";
import SheetsEnUS from "@univerjs/sheets/locale/en-US";
import { UniverUIPlugin } from "@univerjs/ui";
import UIEnUS from "@univerjs/ui/locale/en-US";
import usePracticeStore from "../../../../store/usePracticeStore";
import { applyUniverFixes } from "../../../../utils/univerSheetFixes";

import "@univerjs/design/lib/index.css";
import "@univerjs/ui/lib/index.css";
import "@univerjs/docs-ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";
import "@univerjs/sheets-formula-ui/lib/index.css";
import "@univerjs/sheets-numfmt-ui/lib/index.css";

export default function PracticeSheet() {
  const containerRef = useRef(null);
  const univerRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const fixesCleanupRef = useRef(null);

  const currentQuestion = usePracticeStore((state) => state.currentQuestion);
  const saveWorkbookState = usePracticeStore(
    (state) => state.saveWorkbookState,
  );
  const getWorkbookState = usePracticeStore((state) => state.getWorkbookState);

  useEffect(() => {
    if (!containerRef.current || univerRef.current) return;

    // Delay initialization slightly to ensure CSS is loaded and layout is calculated
    const initTimer = setTimeout(() => {
      if (!containerRef.current || univerRef.current) return;

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
      });

      univerRef.current = univer;

      univer.registerPlugin(UniverRenderEnginePlugin);
      univer.registerPlugin(UniverFormulaEnginePlugin, {});
      univer.registerPlugin(UniverUIPlugin, { container: containerRef.current });
      univer.registerPlugin(UniverDocsPlugin, { hasScroll: false });
      univer.registerPlugin(UniverDocsUIPlugin, {});
      univer.registerPlugin(UniverSheetsPlugin, {});
      univer.registerPlugin(UniverSheetsUIPlugin, {});
      univer.registerPlugin(UniverSheetsFormulaUIPlugin, {});
      univer.registerPlugin(UniverSheetsNumfmtUIPlugin, {});

      // Apply all three spreadsheet fixes (percentage format, formula overlay, paste values)
      try {
        const commandService = univer.__getInjector().get(ICommandService);
        fixesCleanupRef.current = applyUniverFixes(univer, commandService, containerRef.current);
      } catch (err) {
        console.warn("Failed to apply Univer fixes:", err);
      }

      setIsInitialized(true);
    }, 100);

    return () => {
      clearTimeout(initTimer);
      try {
        // Clean up spreadsheet fixes
        if (fixesCleanupRef.current) {
          fixesCleanupRef.current();
          fixesCleanupRef.current = null;
        }
        if (univerRef.current) {
          univerRef.current.dispose();
        }
      } catch (e) {
        console.error("Error disposing univer:", e);
      }
      univerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!univerRef.current || !isInitialized) return;

    const getWorkbookData = () => {
      const savedState = getWorkbookState(currentQuestion);
      const baseSheetId = `sheet-q${currentQuestion}`;
      const baseWorkbookId = `workbook-q${currentQuestion}`;

      if (savedState?.cellData) {
        return {
          id: baseWorkbookId,
          name: `Question ${currentQuestion} Workbook`,
          sheetOrder: [baseSheetId],
          sheets: {
            [baseSheetId]: {
              id: baseSheetId,
              name: `Q${currentQuestion} Rough Work`,
              cellData: savedState.cellData,
            },
          },
        };
      }
      return {
        id: baseWorkbookId,
        name: `Question ${currentQuestion} Workbook`,
        sheetOrder: [baseSheetId],
        sheets: {
          [baseSheetId]: {
            id: baseSheetId,
            name: `Q${currentQuestion} Rough Work`,
            cellData: {},
          },
        },
      };
    };

    const workbookData = getWorkbookData();
    const instanceService = univerRef.current
      .__getInjector()
      .get(IUniverInstanceService);

    let workbook = instanceService.getUnit(workbookData.id);
    if (!workbook) {
      workbook = univerRef.current.createUnit(
        UniverInstanceType.UNIVER_SHEET,
        workbookData,
      );
      setupAutoSave(univerRef.current, workbook, workbookData.id);
    }

    instanceService.focusUnit(workbookData.id, UniverInstanceType.UNIVER_SHEET);
  }, [currentQuestion, isInitialized, getWorkbookState]);

  const setupAutoSave = (univer, workbook, workbookId) => {
    const commandService = univer.__getInjector().get(ICommandService);

    // Simple autosave on commands
    const disposeListener = commandService.onCommandExecuted((command) => {
      if (
        [
          "sheet.command.set-range-values",
          "sheet.mutation.set-range-values",
        ].includes(command.id)
      ) {
        try {
          const worksheet = workbook.getActiveSheet();
          if (worksheet) {
            const cellData = worksheet.getConfig().cellData || {};
            saveWorkbookState(workbookId, {
              cellData: JSON.parse(JSON.stringify(cellData)),
              timestamp: Date.now(),
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    return () => disposeListener.dispose();
  };

  return (
    <div className="editor-container h-full w-full flex flex-col flex-1 relative" style={{ minHeight: 0 }}>
      <div className="flex-1 flex flex-col w-full h-full relative" style={{ minHeight: 0 }}>
        <div ref={containerRef} className="w-full h-full absolute inset-0"></div>
      </div>
    </div>
  );
}
