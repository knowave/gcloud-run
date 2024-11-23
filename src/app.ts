import express from "express";
import longTaskRouter from "./routes/router";

export default class App {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));

    // 기본 경로에서 응답
    this.app.get("/", (req, res) => {
      res.send("Hello from Cloud Run + Express!");
    });

    // long-task 라우터 사용
    this.app.use(longTaskRouter);
  }

  public listen(): void {
    this.app.listen(8080, () => {
      console.log("connected server localhost:8080");
    });
  }
}
