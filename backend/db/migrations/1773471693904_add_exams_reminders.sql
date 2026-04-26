-- Migration: Add Exams, Reminders, ReviewTasks, NotificationSettings tables

CREATE TABLE IF NOT EXISTS "Exams" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "course_name" TEXT,
    "exam_date" TEXT NOT NULL,
    "exam_time" TEXT NOT NULL,
    "location" TEXT,
    "exam_type" TEXT NOT NULL DEFAULT 'course',
    "notes" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1E3A5F',
    "review_progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "Reminders" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "exam_id" TEXT REFERENCES "Exams"("id") ON DELETE CASCADE,
    "reminder_type" TEXT NOT NULL DEFAULT 'system',
    "days_before_exam" INTEGER,
    "hours_before_exam" INTEGER,
    "is_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "notify_system" BOOLEAN NOT NULL DEFAULT TRUE,
    "notify_push" BOOLEAN NOT NULL DEFAULT TRUE,
    "notify_email" BOOLEAN NOT NULL DEFAULT FALSE,
    "remind_7_days" BOOLEAN NOT NULL DEFAULT TRUE,
    "remind_3_days" BOOLEAN NOT NULL DEFAULT TRUE,
    "remind_1_day" BOOLEAN NOT NULL DEFAULT TRUE,
    "remind_same_day" BOOLEAN NOT NULL DEFAULT TRUE,
    "custom_days" INTEGER,
    "custom_hours" INTEGER,
    "custom_unit" TEXT DEFAULT 'days',
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ReviewTasks" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "exam_id" TEXT NOT NULL REFERENCES "Exams"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT FALSE,
    "scheduled_date" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "NotificationSettings" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL UNIQUE REFERENCES "Users"("id") ON DELETE CASCADE,
    "remind_7_days" BOOLEAN NOT NULL DEFAULT TRUE,
    "remind_3_days" BOOLEAN NOT NULL DEFAULT TRUE,
    "remind_1_day" BOOLEAN NOT NULL DEFAULT TRUE,
    "remind_same_day" BOOLEAN NOT NULL DEFAULT TRUE,
    "notify_system" BOOLEAN NOT NULL DEFAULT TRUE,
    "notify_push" BOOLEAN NOT NULL DEFAULT TRUE,
    "notify_email" BOOLEAN NOT NULL DEFAULT FALSE,
    "custom_value" INTEGER,
    "custom_unit" TEXT DEFAULT 'days',
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
