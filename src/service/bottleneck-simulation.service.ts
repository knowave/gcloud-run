import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import 'dotenv/config';

export class BottleneckSimulationService {
  private doc: GoogleSpreadsheet;
  private sheetName: string;

  constructor(spreadsheetId: string, sheetName: string) {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    this.sheetName = sheetName;
  }

  public async generateTimeSeriesWithFormulas(): Promise<void> {
    await this.doc.loadInfo();
    const sheet = this.doc.sheetsByTitle[this.sheetName];

    // C4, C5에서 시작 시간과 종료 시간 가져오기
    await sheet.loadCells('C4:C5');
    const startTimeCell = sheet.getCellByA1('C4');
    const endTimeCell = sheet.getCellByA1('C5');

    const startTimeString = this.convertNumberToTimeString(
      startTimeCell.value as number
    );
    const endTimeString = this.convertNumberToTimeString(
      endTimeCell.value as number
    );

    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const startTime = new Date(`${today}T${startTimeString}`);
    const endTime = new Date(`${today}T${endTimeString}`);

    // 유효성 검사
    if (
      isNaN(startTime.getTime()) ||
      isNaN(endTime.getTime()) ||
      startTime >= endTime
    ) {
      throw new Error('Invalid start or end time');
    }

    const startRow = 12; // 시작 행
    const timeColumn = 4; // E열 (4번째 열)
    const increment = 0.01; // 시간 증가 단위

    // 총 시간(분) 계산
    const totalTimeMinutes =
      (endTime.getTime() - startTime.getTime()) / (60 * 1000);
    const rowCount = Math.ceil(totalTimeMinutes / increment); // 0.01분 단위로 계산

    const batchSize = 500;

    for (let batchStart = 0; batchStart < rowCount; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, rowCount);
      const rangeStart = startRow + batchStart;
      const rangeEnd = startRow + batchEnd - 1;

      const timeRange = `E${rangeStart}:E${rangeEnd}`;
      const formulaRange = `F${rangeStart}:Y${rangeEnd}`;

      await sheet.loadCells([timeRange, formulaRange]);

      // 시간 값 업데이트
      for (let i = batchStart; i < batchEnd; i++) {
        const row = startRow + i;
        const timeCell = sheet.getCell(row - 1, timeColumn);
        timeCell.value = ((i + 1) * increment).toFixed(2);
      }

      // F~Y열 수식 복사
      for (let i = batchStart; i < batchEnd; i++) {
        const currentRow = startRow + i;
        for (let col = 5; col <= 24; col++) {
          const templateCell = sheet.getCell(startRow - 1, col);
          const targetCell = sheet.getCell(currentRow - 1, col);

          if (templateCell.formula) {
            targetCell.formula = templateCell.formula.replace(
              /\$?12/g,
              `$${currentRow}`
            );
          } else {
            targetCell.value = templateCell.value;
          }
        }
      }

      await sheet.saveUpdatedCells();
      await this.sleep(3000);
      console.log(`success save or update for spreadsheet, ${batchStart}`);
    }
  }

  private convertNumberToTimeString(number: number): string {
    const totalSeconds = Math.round(number * 24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
