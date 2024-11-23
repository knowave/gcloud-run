import { Router, Request, Response } from 'express';

const router = Router();

// /long-task 경로에 대한 요청 처리
router.post('/long-task', (req: Request, res: Response) => {
  console.log('Starting a long task...');

  // 20분 동안 대기하는 예시 (setTimeout 사용)
  setTimeout(() => {
    console.log('Long task completed!');
    res.status(200).json({ message: 'Task completed successfully' });
  }, 2 * 60 * 1000);
});

export default router;
