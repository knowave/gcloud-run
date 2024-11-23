import { BottleneckSimulationController } from 'controller/bottleneck-simulation.controller';
import { Router } from 'express';
import { BottleneckSimulationService } from 'service/bottleneck-simulation.service';

const router = Router();

// 서비스 및 컨트롤러 초기화
const spreadsheetId = 'your_spreadsheet_id_here';
const sheetName = 'Copy of FINAL';
const sheetService = new BottleneckSimulationService(spreadsheetId, sheetName);
const sheetController = new BottleneckSimulationController(sheetService);

// 라우팅 설정
router.get('/generate-time-series', (req, res) =>
  sheetController.generateTimeSeries(req, res)
);

export default router;
