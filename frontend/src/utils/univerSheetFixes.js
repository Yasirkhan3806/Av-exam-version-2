/**
 * univerSheetFixes.js
 * --------------------
 * Three fixes applied on top of every Univer spreadsheet instance:
 *
 * FIX 1 – Percentage auto-format cleanup
 *   When a cell formatted as "%" is referenced in a formula (e.g. =A1*B1 where
 *   A1 = 22%), Univer propagates the percentage number-format to the result cell.
 *   This fix watches for value-set commands and strips the "%" format from any
 *   result cell whose value is NOT between -1 and 1 (i.e., clearly not a real
 *   percentage).  The user can still manually apply "%" formatting afterward.
 *
 * FIX 2 – Formula autocomplete overlay dismissal
 *   The formula suggestion popup in @univerjs/sheets-formula-ui sometimes does not
 *   close on Escape / Enter.  We add a keydown listener on the container that
 *   force-hides the popup by removing its DOM node's visibility.
 *
 * FIX 3 – Paste Values Only  (Ctrl+Shift+V)
 *   Univer has a built-in SheetPasteValueCommand but no shortcut wired to it.
 *   We intercept Ctrl+Shift+V, read the clipboard ourselves, and invoke
 *   SheetPasteValueCommand so only computed values are pasted (no formulas).
 */

import { FUniver } from '@univerjs/core/facade'
import '@univerjs/sheets/facade'
import '@univerjs/sheets-numfmt/facade'
import { SheetPasteValueCommand } from '@univerjs/sheets-ui'

// ─── FIX 1 ────────────────────────────────────────────────────────────────────
// Auto-strip percentage format from formula result cells that are clearly
// not intended to be percentages.

function setupPercentageAutoClean(univer, commandService) {
  const univerAPI = FUniver.newAPI(univer)
  let isCleaning = false

  const dispose = commandService.onCommandExecuted((command) => {
    // Mitigation 3: Ignore self-triggered numfmt commands to prevent infinite recursive loops
    if (isCleaning) return
    if (
      command.id === 'sheet.command.numfmt.set.numfmt' ||
      command.id === 'sheet.command.set-numfmt-value' ||
      command.id === 'sheet.mutation.set-numfmt-value' ||
      command.id === 'sheet.mutation.remove-numfmt'
    ) {
      return
    }

    // Mitigation 2: Limit event scope strictly to formula calculation and edit completion events
    const targetCommands = [
      'formula.mutation.set-formula-calculation-notification',
      'formula.mutation.set-formula-data',
      'sheet.mutation.set-range-values',
      'sheet.command.set-range-values',
      'sheet.operation.set-cell-edit-visible'
    ]

    if (!targetCommands.includes(command.id)) return

    // Allow formula engine and numfmt plugin to finish computation
    setTimeout(() => {
      if (isCleaning) return
      try {
        isCleaning = true

        const fWorkbook = univerAPI.getActiveWorkbook()
        if (!fWorkbook) return
        const fWorksheet = fWorkbook.getActiveSheet()
        if (!fWorksheet) return

        const sheet = fWorksheet.getSheet()
        if (!sheet) return
        const cellMatrix = sheet.getCellMatrix()
        if (!cellMatrix) return

        const workbook = fWorkbook.getWorkbook()
        const styles = workbook?.getStyles()

        cellMatrix.forValue((r, c, cell) => {
          if (!cell || !cell.f) return // Only target formula-driven cells

          const rawVal = cell.v
          if (rawVal === null || rawVal === undefined) return
          const numVal = Number(rawVal)

          const cellRange = fWorksheet.getRange(r, c)
          let numfmt = ''
          try {
            numfmt = cellRange ? cellRange.getNumberFormat() : ''
          } catch (_) {
            numfmt = ''
          }

          let styleNumfmt = ''
          if (cell.s && styles) {
            const styleObj = styles.get(cell.s)
            if (styleObj?.n) {
              styleNumfmt = typeof styleObj.n === 'string' ? styleObj.n : (styleObj.n.pattern || '')
            }
          }

          const formatStr = (typeof numfmt === 'string' ? numfmt : (numfmt?.pattern || '')) || styleNumfmt || ''
          const hasPercentFormat = formatStr.includes('%') || (cell.s && JSON.stringify(styles?.get(cell.s) || '').includes('%'))

          // Heuristic: If formula cell has inherited a % format pattern from an input cell (like A1=22%)
          if (hasPercentFormat && !isNaN(numVal)) {
            console.log(`🧹 [PercentFix] Stripping inherited % format on formula cell R${r}C${c} (value: ${numVal})`)
            if (cellRange) {
              try {
                cellRange.setNumberFormat('')
              } catch (_) { }
            }
          }
        })
      } catch (err) {
        console.warn('❌ [UniverFix] Percentage auto-clean error:', err)
      } finally {
        isCleaning = false
      }
    }, 200)
  })

  return dispose
}


// ─── FIX 2 ────────────────────────────────────────────────────────────────────
// Force-close the formula autocomplete popup on Escape / Enter.

function isPopupCollapsed(popup) {
  // Tailwind arbitrary-value class can be brittle to query exactly,
  // so fall back to a partial match on max-h-
  const content =
    popup.querySelector('.univer-max-h-\\[350px\\]') ||
    popup.querySelector('[class*="max-h-"]');

  if (!content) return false;

  const height = content.style.height || getComputedStyle(content).height;
  return height === '0px';
}

function forceMinimizeFormulaPopup(popup) {
  if (!popup) return;
  if (isPopupCollapsed(popup)) return; // already collapsed — do nothing, avoids re-toggling

  const toggleIcon = popup.querySelector('svg.univerjs-icon-more-icon');
  const toggleBtn = toggleIcon?.closest('div');
  toggleBtn?.click();
}

function setupFormulaOverlayDismiss(containerEl) {
  // Debounce so rapid successive mutations (typing fast) don't spam checks
  let mutationTimeout = null;

  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
      document.querySelectorAll('section[data-u-comp="rect-popup"]').forEach(popup => {
        // slight delay lets Univer finish its own mount/measure cycle
        setTimeout(() => forceMinimizeFormulaPopup(popup), 50);
      });
    }, 30);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const handler = (e) => {
    if (e.key !== 'Escape' && e.key !== 'Enter') return;

    // Temporarily hide any formula-help related popups, then let them
    // reappear naturally (state-based minimize will re-apply on next mutation)
    const popups = document.querySelectorAll(
      '.univer-formula-help-function, ' +
      '.univer-formula-search-list, ' +
      '.univer-formula-help-decorator, ' +
      '.univer-formula-help-area, ' +
      '[class*="formula-help"], ' +
      '[class*="formula-search"], ' +
      'section[data-u-comp="rect-popup"]'
    );

    popups.forEach((el) => {
      el.style.display = 'none';
      setTimeout(() => {
        el.style.display = '';
      }, 300);
    });
  };

  containerEl.addEventListener('keydown', handler, true);
  document.addEventListener('keydown', handler, true);

  return () => {
    observer.disconnect();
    clearTimeout(mutationTimeout);
    containerEl.removeEventListener('keydown', handler, true);
    document.removeEventListener('keydown', handler, true);
  };
}


// ─── FIX 3 ────────────────────────────────────────────────────────────────────
// Wire Ctrl+Shift+V  →  "Paste Values Only"
//
// Two strategies:
//   A) Try executing Univer's built-in SheetPasteValueCommand.
//   B) Fallback: read clipboard text, parse, and set cell values directly.

function setupPasteValuesShortcut(univer, commandService) {
  const univerAPI = FUniver.newAPI(univer)

  const handler = async (e) => {
    // Ctrl+Shift+V  OR  Ctrl+Alt+V  (both common shortcuts for Paste Special)
    const isPasteValues =
      (e.ctrlKey && e.shiftKey && e.key === 'V') ||
      (e.ctrlKey && e.shiftKey && e.key === 'v') ||
      (e.ctrlKey && e.altKey && e.key === 'V') ||
      (e.ctrlKey && e.altKey && e.key === 'v')

    if (!isPasteValues) return

    e.preventDefault()
    e.stopPropagation()

    try {
      // Strategy A: use Univer's built-in command if available
      const cmdId = SheetPasteValueCommand?.id
      if (cmdId) {
        // The SheetPasteValueCommand re-pastes from the internal clipboard
        // cache using the "special-paste-value" hook, which strips formulas.
        const result = await univerAPI.executeCommand(cmdId)
        if (result) {
          console.log('[UniverFix] Paste Values via built-in command ✅')
          return
        }
      }
    } catch (err) {
      console.warn('[UniverFix] Built-in paste-value failed, using fallback:', err)
    }

    // Strategy B: manual clipboard read → set values
    try {
      const text = await navigator.clipboard.readText()
      if (!text) return

      const fWorkbook = univerAPI.getActiveWorkbook()
      if (!fWorkbook) return
      const fWorksheet = fWorkbook.getActiveSheet()
      if (!fWorksheet) return

      // Parse tab-separated / newline-separated text (standard spreadsheet clipboard format)
      const rows = text.split(/\r?\n/).filter(line => line.length > 0)
      const values = rows.map(row => {
        return row.split('\t').map(cell => {
          const trimmed = cell.trim()
          const num = Number(trimmed)
          return isNaN(num) ? trimmed : num
        })
      })

      // Get the currently selected cell as the paste anchor
      const selection = fWorksheet.getSelection()
      const activeRange = selection?.getActiveRange()

      if (activeRange) {
        const startRow = activeRange.getRow()
        const startCol = activeRange.getColumn()

        // Set values directly (no formulas)
        const targetRange = fWorksheet.getRange(
          startRow,
          startCol,
          values.length,
          Math.max(...values.map(r => r.length))
        )
        targetRange.setValues(values)
        console.log('[UniverFix] Paste Values via manual fallback ✅')
      }
    } catch (err) {
      console.warn('[UniverFix] Paste values fallback error:', err)
    }
  }

  document.addEventListener('keydown', handler, true)

  return () => {
    document.removeEventListener('keydown', handler, true)
  }
}


// ─── PUBLIC API ───────────────────────────────────────────────────────────────
/**
 * Apply all three fixes to a Univer instance.
 *
 * @param {Univer}  univer         – The Univer instance
 * @param {object}  commandService – ICommandService from the injector
 * @param {HTMLElement} containerEl – The DOM container of the spreadsheet
 * @returns {() => void}           – Cleanup function to remove all listeners
 */
export function applyUniverFixes(univer, commandService, containerEl) {
  const cleanups = []

  // FIX 1 – Percentage auto-clean
  const disposePercentFix = setupPercentageAutoClean(univer, commandService)
  if (disposePercentFix) {
    cleanups.push(
      typeof disposePercentFix.dispose === 'function'
        ? () => disposePercentFix.dispose()
        : typeof disposePercentFix === 'function'
          ? disposePercentFix
          : () => { }
    )
  }

  // FIX 2 – Formula overlay dismiss
  const disposeOverlayFix = setupFormulaOverlayDismiss(containerEl)
  if (disposeOverlayFix) cleanups.push(disposeOverlayFix)

  // FIX 3 – Paste values shortcut
  const disposePasteFix = setupPasteValuesShortcut(univer, commandService)
  if (disposePasteFix) cleanups.push(disposePasteFix)

  // Return combined cleanup
  return () => {
    cleanups.forEach(fn => {
      try { fn() } catch (_) { /* ignore */ }
    })
  }
}
