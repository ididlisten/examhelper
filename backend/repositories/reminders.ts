import { db } from '../db';
import {
  reminders, Reminder, InsertReminder, insertReminderSchema, updateReminderSchema,
  reviewTasks, ReviewTask, InsertReviewTask, insertReviewTaskSchema, updateReviewTaskSchema,
  notificationSettings, NotificationSettings, InsertNotificationSettings, insertNotificationSettingsSchema, updateNotificationSettingsSchema,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

type CreateReminderInput = z.infer<typeof insertReminderSchema>;
type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
type CreateReviewTaskInput = z.infer<typeof insertReviewTaskSchema>;
type UpdateReviewTaskInput = z.infer<typeof updateReviewTaskSchema>;
type CreateNotificationSettingsInput = z.infer<typeof insertNotificationSettingsSchema>;
type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;

export class ReminderRepository {
  async findByUserId(userId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.userId, userId));
  }

  async findByExamId(examId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.examId, examId));
  }

  async create(data: CreateReminderInput): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values(data as InsertReminder).returning();
    return reminder;
  }

  async update(id: string, userId: string, data: UpdateReminderInput): Promise<Reminder | undefined> {
    const [reminder] = await db
      .update(reminders)
      .set({ ...data as Partial<InsertReminder>, updatedAt: new Date() })
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning();
    return reminder;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export class ReviewTaskRepository {
  async findByExamId(examId: string): Promise<ReviewTask[]> {
    return await db.select().from(reviewTasks).where(eq(reviewTasks.examId, examId));
  }

  async findByUserId(userId: string): Promise<ReviewTask[]> {
    return await db.select().from(reviewTasks).where(eq(reviewTasks.userId, userId));
  }

  async create(data: CreateReviewTaskInput): Promise<ReviewTask> {
    const [task] = await db.insert(reviewTasks).values(data as InsertReviewTask).returning();
    return task;
  }

  async update(id: string, userId: string, data: UpdateReviewTaskInput): Promise<ReviewTask | undefined> {
    const [task] = await db
      .update(reviewTasks)
      .set({ ...data as Partial<InsertReviewTask>, updatedAt: new Date() })
      .where(and(eq(reviewTasks.id, id), eq(reviewTasks.userId, userId)))
      .returning();
    return task;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(reviewTasks)
      .where(and(eq(reviewTasks.id, id), eq(reviewTasks.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export class NotificationSettingsRepository {
  async findByUserId(userId: string): Promise<NotificationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    return settings;
  }

  async upsert(userId: string, data: UpdateNotificationSettingsInput): Promise<NotificationSettings> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      const [settings] = await db
        .update(notificationSettings)
        .set({ ...data as Partial<InsertNotificationSettings>, updatedAt: new Date() })
        .where(eq(notificationSettings.userId, userId))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(notificationSettings)
        .values({ userId, ...data } as InsertNotificationSettings)
        .returning();
      return settings;
    }
  }
}

export const reminderRepository = new ReminderRepository();
export const reviewTaskRepository = new ReviewTaskRepository();
export const notificationSettingsRepository = new NotificationSettingsRepository();
