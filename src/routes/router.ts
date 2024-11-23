import { BottleneckSimulationController } from 'controller/bottleneck-simulation.controller';
import { Router } from 'express';
import { BottleneckSimulationService } from 'service/bottleneck-simulation.service';

const router = Router();

const spreadsheetId = 'your_spreadsheet_id_here';
const sheetName = 'Copy of FINAL';
const sheetService = new BottleneckSimulationService(spreadsheetId, sheetName);
const sheetController = new BottleneckSimulationController(sheetService);

router.get('/bottleneck-calculator', (_, res) =>
  sheetController.generateTimeSeries(res)
);

export default router;
