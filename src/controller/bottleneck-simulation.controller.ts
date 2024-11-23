import { BottleneckSimulationService } from 'service/bottleneck-simulation.service';
import { Request, Response } from 'express';

export class BottleneckSimulationController {
  private bottleneckSimulationService: BottleneckSimulationService;

  constructor(bottleneckSimulationService: BottleneckSimulationService) {
    this.bottleneckSimulationService = bottleneckSimulationService;
  }

  async generateTimeSeries(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime } =
        await this.bottleneckSimulationService.getStartAndEndTime();
      await this.bottleneckSimulationService.processSheetData(
        startTime,
        endTime
      );

      res.status(200).json({ message: 'Data processed successfully' });
    } catch (err) {
      console.error(`Error: ${err}`);
      res.status(500).json({ error: 'Failed to process data', details: err });
    }
  }
}
