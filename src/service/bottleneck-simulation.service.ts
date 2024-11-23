import { GetStartAndEndTimeResponseDto } from 'dto/get-start-and-end-time-response.dto';
import { google } from 'googleapis';

export class BottleneckSimulationService {
  private sheets: any;
  private spreadsheetId: string;
  private sheetName: string;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadSheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = '';
    this.sheetName = 'Copy of FINAL';
  }

  public async processSheetData(startTime: Date, endTime: Date): Promise<void> {
    const increment = 0.01;
    const startRow = 12;
    const timeColumn = 'E';
    const formulasRange = `${this.sheetName}!F12:Y12`;

    const formulaResponse = await this.sheets.spreadSheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: formulasRange,
    });
    const formulas = formulaResponse.data.values?.[0] || [];

    const totalTimeMinutes =
      (endTime.getTime() - startTime.getTime()) / (60 * 1000);
    const rowCount = Math.ceil(totalTimeMinutes / increment);

    const timeData = Array.from({ length: rowCount }, (_, i) => [
      ((i + 1) * increment).toFixed(2),
    ]);
    const outputData = Array.from({ length: rowCount }, (_, i) =>
      formulas.map((formula: string) =>
        formula.replace(/12/g, (startRow + i).toString())
      )
    );

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!${timeColumn}${startRow}:${timeColumn}${
        startRow + rowCount - 1
      }`,
      valueInputOption: 'RAW',
      requestBody: { values: timeData },
    });

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!F${startRow}:Y${startRow + rowCount - 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: outputData },
    });
  }

  public async getStartAndEndTime(): Promise<GetStartAndEndTimeResponseDto> {
    const range = `${this.sheetName}!C4:C5`;
    const response = await this.sheets.spreadSheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
    });

    const [start, end] = response.data.values || [];
    const startTime = new Date(start[0]);
    const endTime = new Date(end[0]);

    if (
      isNaN(startTime.getTime()) ||
      isNaN(endTime.getTime()) ||
      startTime >= endTime
    ) {
      throw new Error('Invalid start or end time');
    }

    return { startTime, endTime };
  }
}
