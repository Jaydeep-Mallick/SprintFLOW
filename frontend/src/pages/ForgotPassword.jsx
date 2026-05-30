import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [demoToken, setDemoToken] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDemoToken('');
    setLoading(true);

    const result = await forgotPassword(email);

    if (result.success) {
      setMessage(result.message);
      if (result.token) {
        setDemoToken(result.token);
      }
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-md space-y-8 z-10 animate-fade-in">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-indigo-600/20 mb-4">
            S
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Recover Password</h2>
          <p className="mt-2 text-sm text-slate-400 text-center">
            Enter your email to receive a password reset token
          </p>
        </div>

        <div className="glass-panel p-8 bg-slate-950/60 shadow-2xl relative">
          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-600/20 active:translate-y-px transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send Reset Token'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <KeyRound size={20} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Reset Token Generated</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
              </div>

              {demoToken && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Your Recovery Token</span>
                  <span className="text-xl font-mono font-bold text-slate-100 tracking-widest bg-slate-950 px-4 py-1.5 rounded border border-slate-800/80 inline-block select-all">
                    {demoToken}
                  </span>
                  <p className="text-[10px] text-slate-500">Copy this token and paste it in the reset page.</p>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to={`/reset-password?token=${demoToken}`}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg transition-all inline-block text-sm"
                >
                  Proceed to Reset Password
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
