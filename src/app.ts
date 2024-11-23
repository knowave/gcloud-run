import express from 'express';
import bottleneckRouter from './routes/router';

export default class App {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));

    this.app.get('/', (req, res) => {
      res.send('Hello from Cloud Run + Express!');
    });

    this.app.use(bottleneckRouter);
  }

  public listen(): void {
    this.app.listen(8080, () => {
      console.log('connected server localhost:8080');
    });
  }
}
