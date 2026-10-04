import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import Modal from '../components/Modal';

export default function Login() {
  const [role, setRole] = useState('STUDENT'); // STUDENT or TEACHER
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    if (newRole === 'STUDENT') {
      setEmail('student@example.com');
    } else {
      setEmail('teacher@example.com');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password, role);
      addToast(`Welcome back, ${user.name}!`, 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid login credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111216] flex flex-col justify-center items-center p-4 relative overflow-hidden text-white">
      {/* Glow Orbs background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#9B6CFF]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-gradient-to-br from-[#FF7A30] to-[#9B6CFF] text-white rounded-2xl shadow-glow-orange mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Student Attendance Dashboard
          </h2>
          <p className="text-xs text-[#FF7A30] font-bold mt-1 tracking-wider uppercase flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Attendance Analytics powered by D3.js
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#191B21] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#262933]">
          {/* Role Selection Tabs */}
          <div className="flex bg-[#111216] p-1.5 rounded-2xl mb-6 border border-[#262933]">
            <button
              type="button"
              onClick={() => handleRoleSwitch('STUDENT')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                role === 'STUDENT'
                  ? 'bg-gradient-to-r from-[#FF7A30] to-[#FF7A30]/80 text-white shadow-glow-orange'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Student Login
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('TEACHER')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                role === 'TEACHER'
                  ? 'bg-gradient-to-r from-[#9B6CFF] to-[#9B6CFF]/80 text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Teacher / Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'STUDENT' ? 'student@example.com' : 'teacher@example.com'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111216] border border-[#262933] text-sm font-semibold text-white focus:outline-none focus:border-[#FF7A30] transition"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111216] border border-[#262933] text-sm font-semibold text-white focus:outline-none focus:border-[#FF7A30] transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#FF7A30] focus:ring-[#FF7A30] w-4 h-4 bg-[#111216] border-[#262933]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-[#FF7A30] hover:underline font-bold"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#FF7A30] to-[#FF7A30]/80 hover:to-[#FF7A30] text-white font-black text-sm rounded-xl shadow-glow-orange transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                `Login as ${role === 'STUDENT' ? 'Student' : 'Teacher / Admin'}`
              )}
            </button>
          </form>

          {/* Quick Demo Presets */}
          <div className="mt-6 pt-5 border-t border-[#262933]">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
              Quick Demo Presets:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('STUDENT');
                  setEmail('student@example.com');
                  setPassword('password123');
                }}
                className="p-2.5 text-left bg-[#111216] hover:bg-[#22252E] rounded-xl border border-[#262933] transition"
              >
                <div className="text-xs font-bold text-white">Rahul Kumar (ST001)</div>
                <div className="text-[10px] text-slate-400">student@example.com</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('TEACHER');
                  setEmail('teacher@example.com');
                  setPassword('password123');
                }}
                className="p-2.5 text-left bg-[#111216] hover:bg-[#22252E] rounded-xl border border-[#262933] transition"
              >
                <div className="text-xs font-bold text-[#9B6CFF]">Dr. Ramesh (Faculty)</div>
                <div className="text-[10px] text-slate-400">teacher@example.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Forgot Password"
      >
        <div className="space-y-4 text-white">
          <p className="text-xs text-slate-300">
            Enter your registered email address below to receive password recovery instructions.
          </p>
          <input
            type="email"
            placeholder="your-email@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-[#262933] bg-[#111216] text-xs text-white"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setForgotModalOpen(false);
                addToast('Reset instructions sent to your email.', 'info');
              }}
              className="px-4 py-2 text-xs font-bold bg-[#FF7A30] text-white rounded-xl"
            >
              Send Link
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
