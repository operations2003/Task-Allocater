import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const LoginPage = () => {
  const [email, setEmail] = useState('ceo@tasknera.com');
  const [password, setPassword] = useState('TaskNera@Ceo2026!');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const data = await login(email, password);
      toast.success(`Welcome back, ${data.user.firstName || 'User'}!`);
      if (data.user.role === 'CEO') {
        navigate('/dashboard');
      } else {
        navigate('/my-tasks');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Banner */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white font-bold text-lg mb-3 shadow-xs">
            TN
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sign in to TaskNera
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Task and team workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
              {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Quick Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('ceo@tasknera.com');
                  setPassword('TaskNera@Ceo2026!');
                }}
                className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 transition-all text-left cursor-pointer"
              >
                <div className="font-semibold text-slate-900 text-xs">CEO Login</div>
                <div className="text-[10px] text-slate-500 truncate">ceo@tasknera.com</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('aarav.sharma@tasknera.com');
                  setPassword('TaskNera@Ceo2026!');
                }}
                className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 transition-all text-left cursor-pointer"
              >
                <div className="font-semibold text-slate-900 text-xs">Staff Login</div>
                <div className="text-[10px] text-slate-500 truncate">aarav.sharma@...</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          TaskNera © 2026
        </p>
      </div>
    </div>
  );
};
