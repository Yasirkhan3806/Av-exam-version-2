import xlsx from "xlsx";

/**
 * Blank rough-work spreadsheet template, generated once at module load and
 * reused for every new OnlyOffice document (Practice Room and exam alike).
 * Uses the same `xlsx` (SheetJS) package already used elsewhere in this
 * backend (see services/prcExamService.js) rather than shipping a static
 * binary file in the repo.
 */
function buildBlankSpreadsheetTemplate() {
  const rows = [];
  const worksheet = xlsx.utils.aoa_to_sheet(rows);
  // A real formula cell (xlsx supports this properly, unlike CSV where a
  // leading "=" is just text that happens to get reinterpreted on import).
  worksheet.A2 = { t: "n", f: "SUM(C2:C4)" };

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export const DEFAULT_SPREADSHEET_TEMPLATE = buildBlankSpreadsheetTemplate();

export const SPREADSHEET_FILE_TYPE = "xlsx";
export const SPREADSHEET_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
