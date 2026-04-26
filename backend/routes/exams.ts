import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { examRepository } from '../repositories/exams';
import { insertExamSchema, updateExamSchema } from '../db/schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// GET /api/exams - Get all exams for current user
router.get('/', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const exams = await examRepository.findByUserId(userId);
    res.json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
});

// GET /api/exams/:id - Get single exam
router.get('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const examId = req.params.id as string;
    const exam = await examRepository.findById(examId);
    if (!exam || exam.userId !== userId) {
      throw new AppError('Exam not found', 404);
    }
    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
});

// POST /api/exams - Create new exam
router.post('/', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const validated = insertExamSchema.parse({ ...req.body, userId });
    const exam = await examRepository.create(validated);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
});

// PUT /api/exams/:id - Update exam
router.put('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const examId = req.params.id as string;
    const validated = updateExamSchema.parse(req.body);
    const exam = await examRepository.update(examId, userId, validated);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/exams/:id/progress - Update review progress
router.patch('/:id/progress', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const examId = req.params.id as string;
    const { progress } = req.body as { progress: number };
    const exam = await examRepository.updateProgress(examId, userId, progress);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/exams/:id - Delete exam
router.delete('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).user!.id;
    const examId = req.params.id as string;
    const deleted = await examRepository.delete(examId, userId);
    if (!deleted) {
      throw new AppError('Exam not found', 404);
    }
    res.json({ success: true, data: { message: 'Exam deleted successfully' } });
  } catch (error) {
    next(error);
  }
});

export default router;
