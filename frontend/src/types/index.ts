export interface Exam {
  id: string;
  userId: string;
  name: string;
  courseName?: string | null;
  examDate: string;
  examTime: string;
  location?: string | null;
  examType: string;
  notes?: string | null;
  color: string;
  reviewProgress: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewTask {
  id: string;
  examId: string;
  userId: string;
  title: string;
  isCompleted: boolean;
  scheduledDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  remind7Days: boolean;
  remind3Days: boolean;
  remind1Day: boolean;
  remindSameDay: boolean;
  notifySystem: boolean;
  notifyPush: boolean;
  notifyEmail: boolean;
  customValue?: number | null;
  customUnit?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ViewType = 'dashboard' | 'exams' | 'calendar' | 'review' | 'reminders' | 'profile';

export type ExamType = 'course' | 'level' | 'qualification';

export const EXAM_TYPE_LABELS: Record<string, string> = {
  course: '课程考试',
  level: '等级考试',
  qualification: '资格考试',
};

export const EXAM_TYPE_COLORS: Record<string, string> = {
  course: '#1E3A5F',
  level: '#2D6A9F',
  qualification: '#7C3AED',
};

export const EXAM_STATUS_LABELS: Record<string, string> = {
  upcoming: '即将到来',
  completed: '已完成',
  cancelled: '已取消',
};
