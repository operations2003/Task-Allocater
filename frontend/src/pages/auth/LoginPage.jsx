import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
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
      toast.show('Welcome back', `Signed in as ${data.user.firstName || 'User'}`);
      if (data.user.role === 'CEO' || data.user.role === 'admin') {
        navigate('/');
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
    <div className="relative min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 text-foreground overflow-hidden">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-signal/[0.05] blur-3xl" />

      <div className="w-full max-w-sm space-y-6 relative z-10 fade-up">
        {/* Brand Banner */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-signal text-primary-foreground font-bold text-xl mb-3 shadow-lg shadow-signal/20">
            T
          </div>
          <h1 className="font-display text-3xl tracking-wide text-foreground">
            TaskNera
          </h1>
          <p className="mt-1 text-xs text-muted-foreground uppercase tracking-[0.18em]">
            CEO Command Centre
          </p>
        </div>

        {/* Login Card */}
        <div className="panel p-6 sm:p-7 backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="eyebrow block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="field pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="eyebrow block mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="field pl-9 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-primary-foreground bg-signal hover:bg-signal/90 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying Credentials…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <span className="eyebrow block mb-2.5 text-center">
              Quick Switch Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('ceo@tasknera.com');
                  setPassword('TaskNera@Ceo2026!');
                }}
                className="p-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:border-signal/40 hover:bg-white/[0.05] transition text-left cursor-pointer"
              >
                <div className="font-medium text-foreground text-xs flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                  CEO Access
                </div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">Sheetal Bedi</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('aarav.sharma@tasknera.com');
                  setPassword('TaskNera@Ceo2026!');
                }}
                className="p-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] transition text-left cursor-pointer"
              >
                <div className="font-medium text-foreground text-xs flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                  Staff Access
                </div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">Aarav Sharma</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/60">
          TaskNera — CEO Command Centre · 2026
        </p>
      </div>
    </div>
  );
};
