import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import {
  reminderRepository,
  reviewTaskRepository,
  notificationSettingsRepository,
} from '../repositories/reminders';
import {
  insertReminderSchema,
  updateReminderSchema,
  insertReviewTaskSchema,
  updateReviewTaskSchema,
  updateNotificationSettingsSchema,
} from '../db/schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateJWT);

// ---- Notification Settings ----

// GET /api/reminders/settings
router.get('/settings', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const settings = await notificationSettingsRepository.findByUserId(userId);
    res.json({ success: true, data: settings || null });
  } catch (error) {
    next(error);
  }
});

// PUT /api/reminders/settings
router.put('/settings', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const validated = updateNotificationSettingsSchema.parse(req.body);
    const settings = await notificationSettingsRepository.upsert(userId, validated);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// ---- Review Tasks ----

// GET /api/reminders/tasks
router.get('/tasks', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const tasks = await reviewTaskRepository.findByUserId(userId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// GET /api/reminders/tasks/exam/:examId
router.get('/tasks/exam/:examId', async (req, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.examId as string;
    const tasks = await reviewTaskRepository.findByExamId(examId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// POST /api/reminders/tasks
router.post('/tasks', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const validated = insertReviewTaskSchema.parse({ ...req.body, userId });
    const task = await reviewTaskRepository.create(validated);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// PUT /api/reminders/tasks/:id
router.put('/tasks/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const taskId = req.params.id as string;
    const validated = updateReviewTaskSchema.parse(req.body);
    const task = await reviewTaskRepository.update(taskId, userId, validated);
    if (!task) throw new AppError('Task not found', 404);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reminders/tasks/:id
router.delete('/tasks/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const taskId = req.params.id as string;
    const deleted = await reviewTaskRepository.delete(taskId, userId);
    if (!deleted) throw new AppError('Task not found', 404);
    res.json({ success: true, data: { message: 'Task deleted' } });
  } catch (error) {
    next(error);
  }
});

// ---- Reminders ----

// GET /api/reminders
router.get('/', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const items = await reminderRepository.findByUserId(userId);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

// POST /api/reminders
router.post('/', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const validated = insertReminderSchema.parse({ ...req.body, userId });
    const reminder = await reminderRepository.create(validated);
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
});

// PUT /api/reminders/:id
router.put('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const reminderId = req.params.id as string;
    const validated = updateReminderSchema.parse(req.body);
    const reminder = await reminderRepository.update(reminderId, userId, validated);
    if (!reminder) throw new AppError('Reminder not found', 404);
    res.json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const reminderId = req.params.id as string;
    const deleted = await reminderRepository.delete(reminderId, userId);
    if (!deleted) throw new AppError('Reminder not found', 404);
    res.json({ success: true, data: { message: 'Reminder deleted' } });
  } catch (error) {
    next(error);
  }
});

export default router;
