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
    const cells = await sheet.getCellsInRange('C4:C5');

    // C4, C5에서 시간값 가져오기
    const startTimeString = cells[0][0]; // "14:00:00"
    const endTimeString = cells[1][0]; // "20:00:00"

    // 오늘 날짜를 기반으로 시간 문자열을 Date 객체로 변환
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD" 형식

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
    const timeColumn = 5; // E열 (5번째 열)
    const increment = 0.01; // 시간 증가 단위

    const formulasRange = await sheet.getCellsInRange('F12:Y12'); // F12~Y12 범위에서 수식 가져오기
    const valuesRange = await sheet.getCellsInRange('F12:Y12'); // F12~Y12 값 가져오기

    // 총 시간(분) 계산
    const totalTimeMinutes =
      (endTime.getTime() - startTime.getTime()) / (60 * 1000);
    const rowCount = Math.ceil(totalTimeMinutes / increment); // 0.01분 단위로 계산

    // E열 시간 값 및 F~Y열 수식 배열 초기화
    const timeData = Array(rowCount)
      .fill(null)
      .map((_, i) => [((i + 1) * increment).toFixed(2)]);
    const outputData = Array(rowCount)
      .fill(null)
      .map(() => Array(formulasRange[0].length).fill(null));

    // F~Y열 수식 처리 (배치 작업으로 최적화)
    for (let i = 0; i < rowCount; i++) {
      const currentRow = startRow + i;
      for (let col = 0; col < formulasRange[0].length; col++) {
        const formula = formulasRange[0][col]; // 수식 가져오기
        const value = valuesRange[0][col]; // 값 가져오기
        outputData[i][col] = formula
          ? formula.replace(/12/g, currentRow.toString())
          : value;
      }
    }

    // 셀 값 업데이트 (E열 시간 및 F~Y열 수식)
    const updateCellsPromises = [];

    // E열 시간 값 업데이트
    for (let i = 0; i < rowCount; i++) {
      const timeCell = sheet.getCell(i + startRow - 1, timeColumn - 1); // E열
      timeCell.value = timeData[i][0];
    }

    // F~Y열 수식 값 업데이트
    for (let i = 0; i < rowCount; i++) {
      for (let col = 0; col < formulasRange[0].length; col++) {
        const formulaCell = sheet.getCell(i + startRow - 1, col + 5); // F~Y열
        formulaCell.formula = outputData[i][col];
      }
    }

    // 비동기적으로 셀 저장 처리
    updateCellsPromises.push(sheet.saveUpdatedCells());

    // 모든 업데이트가 완료되면 변경된 셀 저장
    await Promise.all(updateCellsPromises);
  }
}
