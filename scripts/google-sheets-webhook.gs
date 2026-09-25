const SHEET_NAME = "Survey Responses";

function doPost(event) {
  const payload = JSON.parse(event.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
  const columns = payload.columns;
  if (sheet.getLastRow() === 0) sheet.appendRow(columns);
  sheet.appendRow(payload.row);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
