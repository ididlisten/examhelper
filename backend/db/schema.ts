import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================
// Users Table
// ============================================
export const users = pgTable('Users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateUserSchema = insertUserSchema.partial();

export const loginUserSchema = insertUserSchema.pick({
  email: true,
  password: true,
});

export const signupUserSchema = insertUserSchema
  .extend({
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;

// ============================================
// Uploads Table
// ============================================
export const uploads = pgTable('Uploads', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  s3Key: text('s3_key').notNull(),
  s3Url: text('s3_url').notNull(),
  uploadId: text('upload_id'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUploadSchema = createInsertSchema(uploads, {
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  s3Key: z.string().min(1, 'S3 key is required'),
  s3Url: z.string().url('Invalid S3 URL'),
  uploadId: z.string().optional(),
  status: z.enum(['pending', 'uploading', 'completed', 'failed']).optional(),
});

export const updateUploadSchema = insertUploadSchema.partial();

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

// ============================================
// Exams Table
// ============================================
export const exams = pgTable('Exams', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  courseName: text('course_name'),
  examDate: text('exam_date').notNull(),
  examTime: text('exam_time').notNull(),
  location: text('location'),
  examType: text('exam_type').notNull().default('course'),
  notes: text('notes'),
  color: text('color').notNull().default('#1E3A5F'),
  reviewProgress: integer('review_progress').notNull().default(0),
  status: text('status').notNull().default('upcoming'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertExamSchema = createInsertSchema(exams, {
  name: z.string().min(1, 'Exam name is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  examTime: z.string().min(1, 'Exam time is required'),
  examType: z.enum(['course', 'level', 'qualification']).optional(),
  reviewProgress: z.coerce.number().int().min(0).max(100).optional(),
  status: z.enum(['upcoming', 'completed', 'cancelled']).optional(),
});

export const updateExamSchema = insertExamSchema.partial();

export type Exam = typeof exams.$inferSelect;
export type InsertExam = typeof exams.$inferInsert;

// ============================================
// Reminders Table
// ============================================
export const reminders = pgTable('Reminders', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  examId: text('exam_id').references(() => exams.id, { onDelete: 'cascade' }),
  reminderType: text('reminder_type').notNull().default('system'),
  daysBeforeExam: integer('days_before_exam'),
  hoursBeforeExam: integer('hours_before_exam'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  notifySystem: boolean('notify_system').notNull().default(true),
  notifyPush: boolean('notify_push').notNull().default(true),
  notifyEmail: boolean('notify_email').notNull().default(false),
  remind7Days: boolean('remind_7_days').notNull().default(true),
  remind3Days: boolean('remind_3_days').notNull().default(true),
  remind1Day: boolean('remind_1_day').notNull().default(true),
  remindSameDay: boolean('remind_same_day').notNull().default(true),
  customDays: integer('custom_days'),
  customHours: integer('custom_hours'),
  customUnit: text('custom_unit').default('days'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertReminderSchema = createInsertSchema(reminders, {
  reminderType: z.enum(['system', 'push', 'email']).optional(),
  customUnit: z.enum(['days', 'hours']).optional(),
});

export const updateReminderSchema = insertReminderSchema.partial();

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

// ============================================
// Review Tasks Table
// ============================================
export const reviewTasks = pgTable('ReviewTasks', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  scheduledDate: text('scheduled_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertReviewTaskSchema = createInsertSchema(reviewTasks, {
  title: z.string().min(1, 'Task title is required'),
});

export const updateReviewTaskSchema = insertReviewTaskSchema.partial();

export type ReviewTask = typeof reviewTasks.$inferSelect;
export type InsertReviewTask = typeof reviewTasks.$inferInsert;

// ============================================
// Notification Settings Table
// ============================================
export const notificationSettings = pgTable('NotificationSettings', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  remind7Days: boolean('remind_7_days').notNull().default(true),
  remind3Days: boolean('remind_3_days').notNull().default(true),
  remind1Day: boolean('remind_1_day').notNull().default(true),
  remindSameDay: boolean('remind_same_day').notNull().default(true),
  notifySystem: boolean('notify_system').notNull().default(true),
  notifyPush: boolean('notify_push').notNull().default(true),
  notifyEmail: boolean('notify_email').notNull().default(false),
  customValue: integer('custom_value'),
  customUnit: text('custom_unit').default('days'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings, {
  customUnit: z.enum(['days', 'hours']).optional(),
});

export const updateNotificationSettingsSchema = insertNotificationSettingsSchema.partial();

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;
