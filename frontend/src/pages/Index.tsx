import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Toaster } from '../components/ui/sonner';
import { toast } from 'sonner';
import OmniflowBadge from '../components/custom/OmniflowBadge';
import {
  getExams, createExam, updateExam, deleteExam, updateExamProgress,
  getReviewTasks, createReviewTask, updateReviewTask, deleteReviewTask,
  getNotificationSettings, updateNotificationSettings, getCurrentUser,
} from '../lib/api';
import type { Exam, ReviewTask, NotificationSettings } from '../types';
import { EXAM_TYPE_LABELS, EXAM_TYPE_COLORS } from '../types';

type ViewType = 'dashboard' | 'exams' | 'calendar' | 'review' | 'reminders' | 'profile';

// ---- Helpers ----
const getDaysUntil = (dateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(dateStr);
  examDate.setHours(0, 0, 0, 0);
  return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateStr: string): { month: string; day: string } => {
  const d = new Date(dateStr);
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  return { month: months[d.getMonth()], day: String(d.getDate()) };
};

const getDaysLabel = (days: number): { label: string; color: string; bg: string } => {
  if (days < 0) return { label: '已过期', color: '#6B7280', bg: '#F3F4F6' };
  if (days === 0) return { label: '今天', color: '#DC2626', bg: '#FEE2E2' };
  if (days <= 3) return { label: `${days}天后`, color: '#DC2626', bg: '#FEE2E2' };
  if (days <= 7) return { label: `${days}天后`, color: '#D97706', bg: '#FEF3C7' };
  return { label: `${days}天后`, color: '#6B7280', bg: '#F3F4F6' };
};

const getExamTypeColor = (type: string): string => EXAM_TYPE_COLORS[type] || '#1E3A5F';

// ---- Exam Form Modal ----
interface ExamFormProps {
  exam?: Exam | null;
  onSave: (data: Partial<Exam>) => Promise<void>;
  onClose: () => void;
}

const ExamForm = ({ exam, onSave, onClose }: ExamFormProps) => {
  const [form, setForm] = useState({
    name: exam?.name || '',
    courseName: exam?.courseName || '',
    examDate: exam?.examDate || '',
    examTime: exam?.examTime || '',
    location: exam?.location || '',
    examType: exam?.examType || 'course',
    notes: exam?.notes || '',
    color: exam?.color || '#1E3A5F',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.examDate || !form.examTime) {
      toast.error('请填写必填项');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200';
  const inputStyle = { background: 'oklch(0.955 0.012 240)', border: '1px solid oklch(0.87 0.02 240)', color: 'oklch(0.12 0.03 240)' };
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = 'oklch(0.42 0.09 240)';
      e.target.style.boxShadow = '0 0 0 2px oklch(0.42 0.09 240 / 0.2)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = 'oklch(0.87 0.02 240)';
      e.target.style.boxShadow = 'none';
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,31,51,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'oklch(0.87 0.02 240)' }}>
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>
            {exam ? '编辑考试' : '添加新考试'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>
              考试名称 <span style={{ color: 'oklch(0.55 0.22 27)' }}>*</span>
            </label>
            <input type="text" className={inputCls} style={inputStyle} {...focusHandlers}
              value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="例：高等数学期末考试" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>课程名称</label>
            <input type="text" className={inputCls} style={inputStyle} {...focusHandlers}
              value={form.courseName} onChange={(e) => setForm(f => ({ ...f, courseName: e.target.value }))}
              placeholder="例：高等数学（下）" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>
                考试日期 <span style={{ color: 'oklch(0.55 0.22 27)' }}>*</span>
              </label>
              <input type="date" className={inputCls} style={inputStyle} {...focusHandlers}
                value={form.examDate} onChange={(e) => setForm(f => ({ ...f, examDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>
                考试时间 <span style={{ color: 'oklch(0.55 0.22 27)' }}>*</span>
              </label>
              <input type="time" className={inputCls} style={inputStyle} {...focusHandlers}
                value={form.examTime} onChange={(e) => setForm(f => ({ ...f, examTime: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>考试地点</label>
            <input type="text" className={inputCls} style={inputStyle} {...focusHandlers}
              value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="例：第一教学楼 A301" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>考试类型</label>
            <select className={inputCls} style={inputStyle} {...focusHandlers}
              value={form.examType} onChange={(e) => setForm(f => ({ ...f, examType: e.target.value, color: getExamTypeColor(e.target.value) }))}>
              <option value="course">课程考试</option>
              <option value="level">等级考试</option>
              <option value="qualification">资格考试</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>备注</label>
            <textarea className={inputCls} style={inputStyle} rows={2}
              onFocus={(e) => { e.target.style.borderColor = 'oklch(0.42 0.09 240)'; e.target.style.boxShadow = '0 0 0 2px oklch(0.42 0.09 240 / 0.2)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'oklch(0.87 0.02 240)'; e.target.style.boxShadow = 'none'; }}
              value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="考试注意事项、携带证件等..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium text-sm border transition-all duration-200"
              style={{ borderColor: 'oklch(0.87 0.02 240)', color: 'oklch(0.48 0.05 240)' }}>
              取消
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200"
              style={{ background: saving ? 'oklch(0.48 0.05 240)' : 'oklch(0.28 0.07 240)' }}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Main Index Component ----
const Index = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskExamId, setNewTaskExamId] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [examsRes, tasksRes, settingsRes, userRes] = await Promise.all([
        getExams(),
        getReviewTasks(),
        getNotificationSettings(),
        getCurrentUser(),
      ]);
      if (examsRes.success) setExams(examsRes.data);
      if (tasksRes.success) setTasks(tasksRes.data);
      if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data);
      if (userRes.success) {
        setUserName(userRes.data.user.name);
        setProfileForm(f => ({ ...f, name: userRes.data.user.name, email: userRes.data.user.email }));
      }
    } catch {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSaveExam = async (data: Partial<Exam>) => {
    if (editingExam) {
      const res = await updateExam(editingExam.id, data);
      if (res.success) {
        setExams(prev => prev.map(e => e.id === editingExam.id ? res.data : e));
        toast.success('考试信息已更新');
      } else {
        toast.error('更新失败');
      }
    } else {
      const res = await createExam(data);
      if (res.success) {
        setExams(prev => [...prev, res.data]);
        toast.success('考试已添加');
      } else {
        toast.error('添加失败');
      }
    }
    setEditingExam(null);
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('确定要删除这个考试吗？')) return;
    const res = await deleteExam(id);
    if (res.success) {
      setExams(prev => prev.filter(e => e.id !== id));
      toast.success('考试已删除');
    } else {
      toast.error('删除失败');
    }
  };

  const handleProgressUpdate = async (id: string, progress: number) => {
    const res = await updateExamProgress(id, progress);
    if (res.success) {
      setExams(prev => prev.map(e => e.id === id ? { ...e, reviewProgress: progress } : e));
    }
  };

  const handleToggleTask = async (task: ReviewTask) => {
    const res = await updateReviewTask(task.id, { isCompleted: !task.isCompleted });
    if (res.success) {
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskExamId) {
      toast.error('请填写任务名称并选择考试');
      return;
    }
    const res = await createReviewTask({ title: newTaskTitle.trim(), examId: newTaskExamId, scheduledDate: new Date().toISOString().split('T')[0] });
    if (res.success) {
      setTasks(prev => [...prev, res.data]);
      setNewTaskTitle('');
      toast.success('任务已添加');
    }
  };

  const handleDeleteTask = async (id: string) => {
    const res = await deleteReviewTask(id);
    if (res.success) {
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('任务已删除');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    const res = await updateNotificationSettings(settings);
    if (res.success) {
      setSettings(res.data);
      toast.success('提醒设置已保存');
    } else {
      toast.error('保存失败');
    }
  };

  const defaultSettings: NotificationSettings = {
    id: '', userId: '', remind7Days: true, remind3Days: true, remind1Day: true, remindSameDay: true,
    notifySystem: true, notifyPush: true, notifyEmail: false, customValue: null, customUnit: 'days',
    createdAt: '', updatedAt: '',
  };
  const currentSettings = settings || defaultSettings;

  const upcomingExams = exams
    .filter(e => e.status === 'upcoming' && getDaysUntil(e.examDate) >= 0)
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  const completedExams = exams.filter(e => e.status === 'completed' || getDaysUntil(e.examDate) < 0);

  const todayTasks = tasks.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return !t.scheduledDate || t.scheduledDate === today;
  });

  // Calendar helpers
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const today = new Date();

  const getExamsOnDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return exams.filter(e => e.examDate === dateStr);
  };

  const navItems: { key: ViewType; label: string }[] = [
    { key: 'dashboard', label: '仪表盘' },
    { key: 'exams', label: '我的考试' },
    { key: 'calendar', label: '日历视图' },
    { key: 'review', label: '复习计划' },
    { key: 'reminders', label: '提醒设置' },
  ];

  // ---- Render Views ----

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '本学期', value: exams.length, sub: '场考试安排', color: 'oklch(0.42 0.09 240)', bg: '#EFF6FF', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          )},
          { label: '即将到来', value: upcomingExams.length, sub: '场待备考', color: 'oklch(0.65 0.15 75)', bg: '#FFFBEB', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )},
          { label: '已完成', value: completedExams.length, sub: '场已通过', color: '#16A34A', bg: '#F0FDF4', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )},
          { label: '今日任务', value: todayTasks.length, sub: `已完成 ${todayTasks.filter(t => t.isCompleted).length} 项`, color: '#7C3AED', bg: '#F5F3FF', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          )},
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
              <span className="text-xs uppercase tracking-wide font-medium" style={{ color: 'oklch(0.48 0.05 240)' }}>{stat.label}</span>
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: stat.color }}>{stat.value}</p>
            <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming exams */}
        <div className="lg:col-span-2 bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
          <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'oklch(0.87 0.02 240)' }}>
            <div>
              <h2 className="font-bold text-lg" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>即将到来的考试</h2>
              <p className="text-sm mt-0.5" style={{ color: 'oklch(0.48 0.05 240)' }}>按时间排序，最近优先</p>
            </div>
            <button onClick={() => setView('exams')} className="text-sm font-medium hover:underline" style={{ color: 'oklch(0.42 0.09 240)' }}>查看全部 →</button>
          </div>
          {upcomingExams.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'oklch(0.955 0.012 240)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'oklch(0.48 0.05 240)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-medium" style={{ color: 'oklch(0.28 0.07 240)' }}>暂无即将到来的考试</p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>点击「添加考试」开始管理你的考试日程</p>
              <button onClick={() => { setEditingExam(null); setShowExamForm(true); }}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: 'oklch(0.28 0.07 240)' }}>添加考试</button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'oklch(0.87 0.02 240)' }}>
              {upcomingExams.slice(0, 5).map(exam => {
                const days = getDaysUntil(exam.examDate);
                const daysInfo = getDaysLabel(days);
                const dateInfo = formatDate(exam.examDate);
                return (
                  <div key={exam.id} className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors duration-200">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white"
                      style={{ background: exam.color || getExamTypeColor(exam.examType) }}>
                      <span className="text-xs font-medium opacity-70">{dateInfo.month}</span>
                      <span className="text-xl font-bold leading-none" style={{ fontFamily: 'Georgia, serif' }}>{dateInfo.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: daysInfo.bg, color: daysInfo.color }}>{daysInfo.label}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#EFF6FF', color: 'oklch(0.42 0.09 240)' }}>{EXAM_TYPE_LABELS[exam.examType] || exam.examType}</span>
                      </div>
                      <h3 className="font-semibold truncate" style={{ color: 'oklch(0.12 0.03 240)' }}>{exam.name}</h3>
                      <p className="text-sm mt-0.5" style={{ color: 'oklch(0.48 0.05 240)' }}>
                        {exam.location && `📍 ${exam.location} · `}{exam.examTime}
                      </p>
                    </div>
                    <div className="flex-shrink-0 hidden sm:block text-right">
                      <p className="text-xs" style={{ color: 'oklch(0.48 0.05 240)' }}>复习进度</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.87 0.02 240)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${exam.reviewProgress}%`, background: exam.color || getExamTypeColor(exam.examType) }} />
                        </div>
                        <span className="text-xs" style={{ color: 'oklch(0.48 0.05 240)' }}>{exam.reviewProgress}%</span>
                      </div>
                    </div>
                    <button onClick={() => { setEditingExam(exam); setShowExamForm(true); }}
                      className="flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
                      style={{ color: 'oklch(0.48 0.05 240)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Mini calendar */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>
                {calYear}年{monthNames[calMonth]}
              </h2>
              <div className="flex gap-1">
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'oklch(0.48 0.05 240)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'oklch(0.48 0.05 240)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日','一','二','三','四','五','六'].map(d => (
                <span key={d} className="text-center text-xs font-medium py-1" style={{ color: 'oklch(0.48 0.05 240)' }}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                const dayExams = getExamsOnDay(day);
                const hasExam = dayExams.length > 0;
                return (
                  <div key={day}
                    onClick={() => { setSelectedCalendarDay(day); setView('calendar'); }}
                    className="aspect-square flex flex-col items-center justify-center relative rounded-lg cursor-pointer transition-colors"
                    style={{
                      background: isToday ? 'oklch(0.28 0.07 240)' : hasExam ? 'oklch(0.93 0.02 240)' : 'transparent',
                      color: isToday ? 'white' : hasExam ? 'oklch(0.28 0.07 240)' : 'oklch(0.48 0.05 240)',
                    }}>
                    <span className="text-xs font-medium">{day}</span>
                    {hasExam && !isToday && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: dayExams[0].color || getExamTypeColor(dayExams[0].examType) }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t flex-wrap" style={{ borderColor: 'oklch(0.87 0.02 240)' }}>
              {Object.entries(EXAM_TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs" style={{ color: 'oklch(0.48 0.05 240)' }}>{EXAM_TYPE_LABELS[type]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today reminder */}
          {upcomingExams.length > 0 && (() => {
            const nextExam = upcomingExams[0];
            const days = getDaysUntil(nextExam.examDate);
            return (
              <div className="rounded-2xl p-5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'oklch(0.75 0.15 75)' }}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#92400E' }}>今日提醒</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: '#B45309' }}>
                      <strong>{nextExam.name}</strong>还有 <strong>{days}天</strong>，请提前做好复习准备。
                    </p>
                    <button onClick={() => setView('review')} className="mt-2 text-xs font-semibold hover:underline" style={{ color: '#B45309' }}>
                      查看复习计划 →
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Today tasks quick view */}
      {todayTasks.length > 0 && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>今日复习任务</h2>
            <button onClick={() => setView('review')} className="text-sm font-medium hover:underline" style={{ color: 'oklch(0.42 0.09 240)' }}>查看全部 →</button>
          </div>
          <div className="space-y-2">
            {todayTasks.slice(0, 5).map(task => (
              <label key={task.id} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={task.isCompleted}
                  onChange={() => handleToggleTask(task)}
                  className="w-4 h-4 rounded" style={{ accentColor: 'oklch(0.28 0.07 240)' }} />
                <span className={`text-sm ${task.isCompleted ? 'line-through' : ''}`}
                  style={{ color: task.isCompleted ? 'oklch(0.48 0.05 240)' : 'oklch(0.12 0.03 240)' }}>
                  {task.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderExams = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>我的考试</h2>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>管理所有考试安排</p>
        </div>
        <button onClick={() => { setEditingExam(null); setShowExamForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02]"
          style={{ background: 'oklch(0.28 0.07 240)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加考试
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: 'oklch(0.87 0.02 240)' }}>
          <p className="font-medium" style={{ color: 'oklch(0.28 0.07 240)' }}>暂无考试记录</p>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>点击上方按钮添加你的第一个考试</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {exams.map(exam => {
            const days = getDaysUntil(exam.examDate);
            const daysInfo = getDaysLabel(days);
            const dateInfo = formatDate(exam.examDate);
            return (
              <div key={exam.id} className="bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
                style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
                <div className="h-2" style={{ background: exam.color || getExamTypeColor(exam.examType) }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: daysInfo.bg, color: daysInfo.color }}>{daysInfo.label}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#EFF6FF', color: 'oklch(0.42 0.09 240)' }}>{EXAM_TYPE_LABELS[exam.examType] || exam.examType}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingExam(exam); setShowExamForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'oklch(0.48 0.05 240)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteExam(exam.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: 'oklch(0.55 0.22 27)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-base mb-1" style={{ color: 'oklch(0.12 0.03 240)' }}>{exam.name}</h3>
                  {exam.courseName && <p className="text-sm mb-2" style={{ color: 'oklch(0.48 0.05 240)' }}>{exam.courseName}</p>}
                  <div className="space-y-1 text-sm" style={{ color: 'oklch(0.48 0.05 240)' }}>
                    <p>📅 {exam.examDate} {exam.examTime}</p>
                    {exam.location && <p>📍 {exam.location}</p>}
                    {exam.notes && <p>📝 {exam.notes}</p>}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: 'oklch(0.48 0.05 240)' }}>复习进度</span>
                      <span className="text-xs font-bold" style={{ color: exam.color || getExamTypeColor(exam.examType) }}>{exam.reviewProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.87 0.02 240)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${exam.reviewProgress}%`, background: exam.color || getExamTypeColor(exam.examType) }} />
                    </div>
                    <input type="range" min={0} max={100} value={exam.reviewProgress}
                      onChange={(e) => handleProgressUpdate(exam.id, Number(e.target.value))}
                      className="w-full mt-2 h-1 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: exam.color || getExamTypeColor(exam.examType) }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCalendar = () => {
    const selectedDayExams = selectedCalendarDay ? getExamsOnDay(selectedCalendarDay) : [];
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>日历视图</h2>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>查看考试日期分布情况</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Full calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl border p-6" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>
                {calYear}年{monthNames[calMonth]}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
                  style={{ borderColor: 'oklch(0.87 0.02 240)', color: 'oklch(0.48 0.05 240)' }}>上一月</button>
                <button onClick={() => setCalendarDate(new Date())}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-white"
                  style={{ background: 'oklch(0.28 0.07 240)' }}>今天</button>
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
                  style={{ borderColor: 'oklch(0.87 0.02 240)', color: 'oklch(0.48 0.05 240)' }}>下一月</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日','一','二','三','四','五','六'].map(d => (
                <div key={d} className="text-center text-sm font-semibold py-2" style={{ color: 'oklch(0.48 0.05 240)' }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                const isSelected = selectedCalendarDay === day;
                const dayExams = getExamsOnDay(day);
                return (
                  <div key={day}
                    onClick={() => setSelectedCalendarDay(isSelected ? null : day)}
                    className="aspect-square flex flex-col items-start justify-start p-1 rounded-lg cursor-pointer transition-all duration-200 min-h-[48px]"
                    style={{
                      background: isSelected ? 'oklch(0.93 0.02 240)' : isToday ? 'oklch(0.28 0.07 240)' : 'transparent',
                      border: isSelected ? '2px solid oklch(0.42 0.09 240)' : '2px solid transparent',
                    }}>
                    <span className="text-xs font-medium" style={{ color: isToday ? 'white' : 'oklch(0.12 0.03 240)' }}>{day}</span>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {dayExams.slice(0, 2).map(e => (
                        <span key={e.id} className="w-2 h-2 rounded-full" style={{ background: e.color || getExamTypeColor(e.examType) }} />
                      ))}
                      {dayExams.length > 2 && <span className="text-xs" style={{ color: 'oklch(0.48 0.05 240)' }}>+{dayExams.length - 2}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-6 pt-4 border-t flex-wrap" style={{ borderColor: 'oklch(0.87 0.02 240)' }}>
              {Object.entries(EXAM_TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                  <span className="text-sm" style={{ color: 'oklch(0.48 0.05 240)' }}>{EXAM_TYPE_LABELS[type]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day detail */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
            <h3 className="font-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>
              {selectedCalendarDay
                ? `${calYear}年${monthNames[calMonth]}${selectedCalendarDay}日`
                : '点击日期查看详情'}
            </h3>
            {selectedCalendarDay ? (
              selectedDayExams.length === 0 ? (
                <p className="text-sm" style={{ color: 'oklch(0.48 0.05 240)' }}>当天没有考试安排</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayExams.map(exam => (
                    <div key={exam.id} className="p-3 rounded-xl" style={{ background: 'oklch(0.955 0.012 240)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full" style={{ background: exam.color || getExamTypeColor(exam.examType) }} />
                        <span className="text-xs font-medium" style={{ color: 'oklch(0.42 0.09 240)' }}>{EXAM_TYPE_LABELS[exam.examType]}</span>
                      </div>
                      <p className="font-semibold text-sm" style={{ color: 'oklch(0.12 0.03 240)' }}>{exam.name}</p>
                      <p className="text-xs mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>{exam.examTime}</p>
                      {exam.location && <p className="text-xs" style={{ color: 'oklch(0.48 0.05 240)' }}>📍 {exam.location}</p>}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'oklch(0.48 0.05 240)' }}>本月考试概览：</p>
                {exams.filter(e => {
                  const d = new Date(e.examDate);
                  return d.getFullYear() === calYear && d.getMonth() === calMonth;
                }).map(exam => (
                  <div key={exam.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'oklch(0.955 0.012 240)' }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: exam.color || getExamTypeColor(exam.examType) }} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'oklch(0.12 0.03 240)' }}>{exam.name}</p>
                      <p className="text-xs" style={{ color: 'oklch(0.48 0.05 240)' }}>{exam.examDate}</p>
                    </div>
                  </div>
                ))}
                {exams.filter(e => { const d = new Date(e.examDate); return d.getFullYear() === calYear && d.getMonth() === calMonth; }).length === 0 && (
                  <p className="text-sm" style={{ color: 'oklch(0.48 0.05 240)' }}>本月暂无考试</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>复习计划</h2>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>追踪复习进度，管理备考任务</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress tracking */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>复习进度追踪</h3>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-sm" style={{ color: 'oklch(0.48 0.05 240)' }}>暂无即将到来的考试</p>
          ) : (
            <div className="space-y-5">
              {upcomingExams.map(exam => {
                const days = getDaysUntil(exam.examDate);
                return (
                  <div key={exam.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: exam.color || getExamTypeColor(exam.examType) }} />
                        <span className="text-sm font-medium" style={{ color: 'oklch(0.12 0.03 240)' }}>{exam.name}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: exam.color || getExamTypeColor(exam.examType) }}>{exam.reviewProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.87 0.02 240)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${exam.reviewProgress}%`, background: exam.color || getExamTypeColor(exam.examType) }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs" style={{ color: 'oklch(0.48 0.05 240)' }}>距考试 {days} 天</p>
                      <input type="range" min={0} max={100} value={exam.reviewProgress}
                        onChange={(e) => handleProgressUpdate(exam.id, Number(e.target.value))}
                        className="w-24 h-1 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: exam.color || getExamTypeColor(exam.examType) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add task form */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
          <h3 className="font-bold text-lg mb-5" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>添加复习任务</h3>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>任务名称</label>
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="例：复习第5-7章积分应用"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: 'oklch(0.955 0.012 240)', border: '1px solid oklch(0.87 0.02 240)', color: 'oklch(0.12 0.03 240)' }}
                onFocus={(e) => { e.target.style.borderColor = 'oklch(0.42 0.09 240)'; e.target.style.boxShadow = '0 0 0 2px oklch(0.42 0.09 240 / 0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'oklch(0.87 0.02 240)'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>关联考试</label>
              <select value={newTaskExamId} onChange={(e) => setNewTaskExamId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: 'oklch(0.955 0.012 240)', border: '1px solid oklch(0.87 0.02 240)', color: 'oklch(0.12 0.03 240)' }}
                onFocus={(e) => { e.target.style.borderColor = 'oklch(0.42 0.09 240)'; e.target.style.boxShadow = '0 0 0 2px oklch(0.42 0.09 240 / 0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'oklch(0.87 0.02 240)'; e.target.style.boxShadow = 'none'; }}>
                <option value="">选择考试</option>
                {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <button type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200"
              style={{ background: 'oklch(0.28 0.07 240)' }}>添加任务</button>
          </form>
        </div>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
        <h3 className="font-bold text-lg mb-5" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>所有复习任务</h3>
        {tasks.length === 0 ? (
          <p className="text-sm" style={{ color: 'oklch(0.48 0.05 240)' }}>暂无复习任务，请在上方添加</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => {
              const exam = exams.find(e => e.id === task.examId);
              return (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50">
                  <input type="checkbox" checked={task.isCompleted}
                    onChange={() => handleToggleTask(task)}
                    className="w-4 h-4 rounded flex-shrink-0" style={{ accentColor: 'oklch(0.28 0.07 240)' }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.isCompleted ? 'line-through' : ''}`}
                      style={{ color: task.isCompleted ? 'oklch(0.48 0.05 240)' : 'oklch(0.12 0.03 240)' }}>
                      {task.title}
                    </p>
                    {exam && (
                      <p className="text-xs mt-0.5" style={{ color: 'oklch(0.48 0.05 240)' }}>
                        <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: exam.color || getExamTypeColor(exam.examType) }} />
                        {exam.name}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0" style={{ color: 'oklch(0.55 0.22 27)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderReminders = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>提醒设置</h2>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>自定义考试提醒方式和时间</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reminder toggles */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
          <h3 className="font-bold text-lg mb-5" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>提醒时间</h3>
          <div className="space-y-1">
            {[
              { key: 'remind7Days' as const, label: '提前 7 天提醒', desc: '考试前一周发送提醒' },
              { key: 'remind3Days' as const, label: '提前 3 天提醒', desc: '考试前三天发送提醒' },
              { key: 'remind1Day' as const, label: '提前 1 天提醒', desc: '考试前一天发送提醒' },
              { key: 'remindSameDay' as const, label: '考试当天提醒', desc: '考试当天早晨发送提醒' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'oklch(0.87 0.02 240)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'oklch(0.12 0.03 240)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'oklch(0.48 0.05 240)' }}>{item.desc}</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...(s || defaultSettings), [item.key]: !(s || defaultSettings)[item.key] }))}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                  style={{ background: currentSettings[item.key] ? 'oklch(0.28 0.07 240)' : 'oklch(0.87 0.02 240)' }}>
                  <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ left: currentSettings[item.key] ? '22px' : '2px' }} />
                </button>
              </div>
            ))}
          </div>

          {/* Custom reminder */}
          <div className="mt-4 pt-4">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'oklch(0.12 0.03 240)' }}>自定义提醒时间</label>
            <div className="flex gap-2">
              <input type="number" min={1} max={30}
                value={currentSettings.customValue || ''}
                onChange={(e) => setSettings(s => ({ ...(s || defaultSettings), customValue: Number(e.target.value) }))}
                placeholder="2"
                className="w-20 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'oklch(0.955 0.012 240)', border: '1px solid oklch(0.87 0.02 240)', color: 'oklch(0.12 0.03 240)' }} />
              <select
                value={currentSettings.customUnit || 'days'}
                onChange={(e) => setSettings(s => ({ ...(s || defaultSettings), customUnit: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'oklch(0.955 0.012 240)', border: '1px solid oklch(0.87 0.02 240)', color: 'oklch(0.12 0.03 240)' }}>
                <option value="days">天前提醒</option>
                <option value="hours">小时前提醒</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification channels */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
          <h3 className="font-bold text-lg mb-5" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>提醒方式</h3>
          <div className="space-y-4">
            {[
              { key: 'notifySystem' as const, label: '系统消息通知', desc: '应用内系统消息提醒', icon: '🔔' },
              { key: 'notifyPush' as const, label: '手机推送通知', desc: '手机浏览器推送通知', icon: '📱' },
              { key: 'notifyEmail' as const, label: '邮件提醒（可选）', desc: '通过邮件发送提醒', icon: '📧' },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={currentSettings[item.key]}
                  onChange={(e) => setSettings(s => ({ ...(s || defaultSettings), [item.key]: e.target.checked }))}
                  className="w-4 h-4 rounded" style={{ accentColor: 'oklch(0.28 0.07 240)' }} />
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'oklch(0.12 0.03 240)' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: 'oklch(0.48 0.05 240)' }}>{item.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Upcoming reminders preview */}
          {upcomingExams.length > 0 && (
            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'oklch(0.87 0.02 240)' }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'oklch(0.12 0.03 240)' }}>即将触发的提醒</h4>
              <div className="space-y-2">
                {upcomingExams.slice(0, 3).map(exam => {
                  const days = getDaysUntil(exam.examDate);
                  const triggers = [];
                  if (currentSettings.remind7Days && days <= 7 && days > 3) triggers.push('7天提醒');
                  if (currentSettings.remind3Days && days <= 3 && days > 1) triggers.push('3天提醒');
                  if (currentSettings.remind1Day && days === 1) triggers.push('1天提醒');
                  if (currentSettings.remindSameDay && days === 0) triggers.push('当天提醒');
                  return triggers.length > 0 ? (
                    <div key={exam.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#FFFBEB' }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'oklch(0.75 0.15 75)' }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#92400E' }}>{exam.name}</p>
                        <p className="text-xs" style={{ color: '#B45309' }}>{triggers.join('、')}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <button onClick={handleSaveSettings}
        className="w-full md:w-auto px-8 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.01]"
        style={{ background: 'oklch(0.75 0.15 75)' }}>保存提醒设置</button>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>个人资料</h2>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>管理你的账户信息</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
          <h3 className="font-bold text-lg mb-5" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>基本信息</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: 'oklch(0.42 0.09 240)' }}>
              {userName.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: 'oklch(0.12 0.03 240)' }}>{userName}</p>
              <p className="text-sm" style={{ color: 'oklch(0.48 0.05 240)' }}>{profileForm.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>姓名</label>
              <input type="text" value={profileForm.name}
                onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'oklch(0.955 0.012 240)', border: '1px solid oklch(0.87 0.02 240)', color: 'oklch(0.12 0.03 240)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>邮箱</label>
              <input type="email" value={profileForm.email} disabled
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'oklch(0.93 0.01 240)', border: '1px solid oklch(0.87 0.02 240)', color: 'oklch(0.48 0.05 240)', cursor: 'not-allowed' }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'oklch(0.87 0.02 240)', boxShadow: '0 4px 12px -1px rgb(30 58 95 / 0.12)' }}>
          <h3 className="font-bold text-lg mb-5" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>修改密码</h3>
          <div className="space-y-4">
            {[
              { key: 'currentPassword', label: '当前密码' },
              { key: 'newPassword', label: '新密码' },
              { key: 'confirmNewPassword', label: '确认新密码' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>{field.label}</label>
                <input type="password"
                  value={profileForm[field.key as keyof typeof profileForm]}
                  onChange={(e) => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'oklch(0.955 0.012 240)', border: '1px solid oklch(0.87 0.02 240)', color: 'oklch(0.12 0.03 240)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          disabled={profileSaving}
          onClick={async () => {
            setProfileSaving(true);
            await new Promise(r => setTimeout(r, 500));
            setUserName(profileForm.name);
            toast.success('个人信息已更新');
            setProfileSaving(false);
          }}
          className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200"
          style={{ background: 'oklch(0.28 0.07 240)' }}>
          {profileSaving ? '保存中...' : '保存修改'}
        </button>
        <button onClick={handleLogout}
          className="px-6 py-3 rounded-xl font-semibold text-sm border transition-all duration-200"
          style={{ borderColor: 'oklch(0.55 0.22 27)', color: 'oklch(0.55 0.22 27)' }}>
          退出登录
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
              style={{ borderColor: 'oklch(0.28 0.07 240)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'oklch(0.48 0.05 240)' }}>加载中...</p>
          </div>
        </div>
      );
    }
    switch (view) {
      case 'dashboard': return renderDashboard();
      case 'exams': return renderExams();
      case 'calendar': return renderCalendar();
      case 'review': return renderReview();
      case 'reminders': return renderReminders();
      case 'profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  const firstLetter = userName.charAt(0) || 'U';

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.955 0.012 240)' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40 shadow-lg" style={{ background: 'oklch(0.28 0.07 240)' }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.75 0.15 75)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-bold text-xl text-white" style={{ fontFamily: 'Georgia, serif' }}>考试提醒</span>
              <span className="hidden sm:inline text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>智能日程管理系统</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button key={item.key} onClick={() => setView(item.key)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    color: view === item.key ? 'white' : 'rgba(255,255,255,0.7)',
                    background: view === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                  }}>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <button onClick={() => { setEditingExam(null); setShowExamForm(true); }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{ background: 'oklch(0.75 0.15 75)', color: 'white' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加考试
              </button>
              <button onClick={() => setView('profile')}
                className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ background: 'oklch(0.42 0.09 240)' }}>
                  {firstLetter}
                </div>
                <span className="hidden sm:block text-sm font-medium text-white">{userName}</span>
              </button>
              {/* Mobile menu button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.8)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'oklch(0.25 0.07 240)' }}>
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => (
                <button key={item.key}
                  onClick={() => { setView(item.key); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    color: view === item.key ? 'white' : 'rgba(255,255,255,0.7)',
                    background: view === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                  }}>
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { setEditingExam(null); setShowExamForm(true); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{ color: 'oklch(0.75 0.15 75)' }}>
                + 添加考试
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero banner */}
      <div className="pb-10 pt-8" style={{ background: 'oklch(0.28 0.07 240)' }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'oklch(0.75 0.15 75)' }}>2026年春季学期</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                你好，{userName} 👋
              </h1>
              <p className="mt-2 text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {upcomingExams.length > 0
                  ? <span>你有 <span className="font-bold" style={{ color: 'oklch(0.75 0.15 75)' }}>{upcomingExams.length}</span> 场考试即将到来，保持专注，稳步备考。</span>
                  : '暂无即将到来的考试，点击添加考试开始管理。'}
              </p>
            </div>
            <button onClick={() => { setEditingExam(null); setShowExamForm(true); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] self-start sm:self-auto"
              style={{ background: 'oklch(0.75 0.15 75)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加考试
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-12">
        {renderContent()}
      </div>

      {/* Footer */}
      <footer style={{ background: 'oklch(0.28 0.07 240)' }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.75 0.15 75)' }}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>考试提醒</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>专为高校学生设计的智能考试日程管理平台，帮助你不错过每一场重要考试。</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 uppercase tracking-wide text-white">功能模块</h4>
              <ul className="space-y-2">
                {navItems.map(item => (
                  <li key={item.key}>
                    <button onClick={() => setView(item.key)} className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 uppercase tracking-wide text-white">账户</h4>
              <ul className="space-y-2">
                <li><button onClick={() => setView('profile')} className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>个人信息</button></li>
                <li><button onClick={() => setView('reminders')} className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>通知偏好</button></li>
                <li><button onClick={handleLogout} className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>退出登录</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 考试日程智能提醒系统 · 为高校学生打造</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>提醒触达率 97% · 月活用户 3,200+</p>
          </div>
        </div>
      </footer>

      {/* Exam form modal */}
      {showExamForm && (
        <ExamForm
          exam={editingExam}
          onSave={handleSaveExam}
          onClose={() => { setShowExamForm(false); setEditingExam(null); }}
        />
      )}

      <OmniflowBadge />
      <Toaster />
    </div>
  );
};

export default Index;
