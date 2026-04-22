import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../config/constants';

const Signup = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated === true) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('请填写所有必填项');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6位字符');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await response.json();
      if (data.success && data.data?.token) {
        login(data.data.token);
        toast.success('注册成功', { description: `欢迎加入，${name}！` });
        navigate('/', { replace: true });
      } else {
        setError(data.message || '注册失败，请重试');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'oklch(0.955 0.012 240)',
    border: '1px solid oklch(0.87 0.02 240)',
    color: 'oklch(0.12 0.03 240)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'oklch(0.955 0.012 240)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.28 0.07 240)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.75 0.15 75)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>考试提醒</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.05 240)' }}>智能考试日程管理系统</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border" style={{ borderColor: 'oklch(0.87 0.02 240)' }}>
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: 'oklch(0.28 0.07 240)' }}>创建账户</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'oklch(0.97 0.02 27)', color: 'oklch(0.45 0.22 27)', border: '1px solid oklch(0.88 0.06 27)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>
                姓名 <span style={{ color: 'oklch(0.55 0.22 27)' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入姓名"
                className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'oklch(0.42 0.09 240)'; e.target.style.boxShadow = '0 0 0 2px oklch(0.42 0.09 240 / 0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'oklch(0.87 0.02 240)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>
                邮箱地址 <span style={{ color: 'oklch(0.55 0.22 27)' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'oklch(0.42 0.09 240)'; e.target.style.boxShadow = '0 0 0 2px oklch(0.42 0.09 240 / 0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'oklch(0.87 0.02 240)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>
                密码 <span style={{ color: 'oklch(0.55 0.22 27)' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6位字符"
                className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'oklch(0.42 0.09 240)'; e.target.style.boxShadow = '0 0 0 2px oklch(0.42 0.09 240 / 0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'oklch(0.87 0.02 240)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'oklch(0.12 0.03 240)' }}>
                确认密码 <span style={{ color: 'oklch(0.55 0.22 27)' }}>*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'oklch(0.42 0.09 240)'; e.target.style.boxShadow = '0 0 0 2px oklch(0.42 0.09 240 / 0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'oklch(0.87 0.02 240)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-white"
              style={{ background: loading ? 'oklch(0.48 0.05 240)' : 'oklch(0.28 0.07 240)', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '注册中...' : '创建账户'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'oklch(0.48 0.05 240)' }}>
            已有账户？{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'oklch(0.42 0.09 240)' }}>
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
