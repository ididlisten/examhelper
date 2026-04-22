import { db } from '../db';
import { exams, Exam, InsertExam, insertExamSchema, updateExamSchema } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

type CreateExamInput = z.infer<typeof insertExamSchema>;
type UpdateExamInput = z.infer<typeof updateExamSchema>;

export class ExamRepository {
  async create(data: CreateExamInput): Promise<Exam> {
    const [exam] = await db
      .insert(exams)
      .values(data as InsertExam)
      .returning();
    return exam;
  }

  async findByUserId(userId: string): Promise<Exam[]> {
    return await db
      .select()
      .from(exams)
      .where(eq(exams.userId, userId))
      .orderBy(desc(exams.examDate));
  }

  async findById(id: string): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async update(id: string, userId: string, data: UpdateExamInput): Promise<Exam | undefined> {
    const [exam] = await db
      .update(exams)
      .set({ ...data as Partial<InsertExam>, updatedAt: new Date() })
      .where(and(eq(exams.id, id), eq(exams.userId, userId)))
      .returning();
    return exam;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(exams)
      .where(and(eq(exams.id, id), eq(exams.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async updateProgress(id: string, userId: string, progress: number): Promise<Exam | undefined> {
    const [exam] = await db
      .update(exams)
      .set({ reviewProgress: progress, updatedAt: new Date() })
      .where(and(eq(exams.id, id), eq(exams.userId, userId)))
      .returning();
    return exam;
  }
}

export const examRepository = new ExamRepository();
