import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
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
      toast.success(`Welcome back, ${data.user.firstName || 'Executive'}!`);
      if (data.user.role === 'CEO') {
        navigate('/dashboard');
      } else {
        navigate('/my-tasks');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 antialiased">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Banner */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 shadow-xl shadow-brand-500/20 border border-brand-400/30 mb-4">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5 leading-none">
            <span className="text-2xl font-black text-white tracking-tight">Task</span>
            <span className="text-2xl font-black text-cyan-400 tracking-tight">Nera</span>
          </div>
          <h2 className="mt-2 text-lg font-bold text-slate-200">
            CEO Command Centre
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Autonomous Organisational Directives & AI Task Allocation Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Executive or Employee Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ceo@tasknera.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Security Password
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 transition-all duration-200 shadow-md shadow-brand-500/25 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>Authorizing Session...</span>
              ) : (
                <>
                  <span>Access Command Centre</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Default Provisioned Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setEmail('ceo@tasknera.com');
                  setPassword('TaskNera@Ceo2026!');
                }}
                className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 hover:border-brand-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> CEO Login
                </div>
                <div className="text-[10px] text-slate-400 truncate">ceo@tasknera.com</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('aarav.sharma@tasknera.com');
                  setPassword('TaskNera@Ceo2026!');
                }}
                className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 hover:border-brand-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                <div className="font-bold text-indigo-300">Staff Login</div>
                <div className="text-[10px] text-slate-400 truncate">aarav.sharma@tasknera.com</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          TaskNera Global Technologies • Standalone Executive Portal
        </p>
      </div>
    </div>
  );
};
