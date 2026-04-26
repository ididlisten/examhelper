import { API_BASE_URL } from '../config/constants';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

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

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ---- Exams ----
export const getExams = async (): Promise<ApiResponse<Exam[]>> => {
  const res = await fetch(`${API_BASE_URL}/api/exams`, { headers: getAuthHeaders() });
  return res.json() as Promise<ApiResponse<Exam[]>>;
};

export const createExam = async (data: Partial<Exam>): Promise<ApiResponse<Exam>> => {
  const res = await fetch(`${API_BASE_URL}/api/exams`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<ApiResponse<Exam>>;
};

export const updateExam = async (id: string, data: Partial<Exam>): Promise<ApiResponse<Exam>> => {
  const res = await fetch(`${API_BASE_URL}/api/exams/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<ApiResponse<Exam>>;
};

export const updateExamProgress = async (id: string, progress: number): Promise<ApiResponse<Exam>> => {
  const res = await fetch(`${API_BASE_URL}/api/exams/${id}/progress`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ progress }),
  });
  return res.json() as Promise<ApiResponse<Exam>>;
};

export const deleteExam = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const res = await fetch(`${API_BASE_URL}/api/exams/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return res.json() as Promise<ApiResponse<{ message: string }>>;
};

// ---- Review Tasks ----
export const getReviewTasks = async (): Promise<ApiResponse<ReviewTask[]>> => {
  const res = await fetch(`${API_BASE_URL}/api/reminders/tasks`, { headers: getAuthHeaders() });
  return res.json() as Promise<ApiResponse<ReviewTask[]>>;
};

export const createReviewTask = async (data: Partial<ReviewTask>): Promise<ApiResponse<ReviewTask>> => {
  const res = await fetch(`${API_BASE_URL}/api/reminders/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<ApiResponse<ReviewTask>>;
};

export const updateReviewTask = async (id: string, data: Partial<ReviewTask>): Promise<ApiResponse<ReviewTask>> => {
  const res = await fetch(`${API_BASE_URL}/api/reminders/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<ApiResponse<ReviewTask>>;
};

export const deleteReviewTask = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const res = await fetch(`${API_BASE_URL}/api/reminders/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return res.json() as Promise<ApiResponse<{ message: string }>>;
};

// ---- Notification Settings ----
export const getNotificationSettings = async (): Promise<ApiResponse<NotificationSettings | null>> => {
  const res = await fetch(`${API_BASE_URL}/api/reminders/settings`, { headers: getAuthHeaders() });
  return res.json() as Promise<ApiResponse<NotificationSettings | null>>;
};

export const updateNotificationSettings = async (data: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> => {
  const res = await fetch(`${API_BASE_URL}/api/reminders/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<ApiResponse<NotificationSettings>>;
};

// ---- Auth ----
export const getCurrentUser = async (): Promise<ApiResponse<{ user: { id: string; name: string; email: string } }>> => {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: getAuthHeaders() });
  return res.json() as Promise<ApiResponse<{ user: { id: string; name: string; email: string } }>>;
};
