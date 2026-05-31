import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, KeyRound, UserRound } from 'lucide-react';

const Login = () => {
  const { user, login, register, loginWithGoogle, isFirebaseConfigured } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = mode === 'login'
      ? await login(email, password)
      : await register(name, email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  // Helper function to quickly load demo credentials
  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setMode('login');
    setError('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-indigo-600/20 mb-4">
            S
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome to SprintFlow</h2>
          <p className="mt-2 text-sm text-slate-400 text-center">
            {mode === 'login'
              ? 'Sign in to manage tasks, sprints, timesheets & support requests'
              : 'Create an account to start managing your SprintFlow workspace'}
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 bg-slate-950/60 shadow-2xl relative">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${mode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Create Account
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <UserRound size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Alex Morgan"
                  />
                </div>
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

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">Password</label>
                {mode === 'login' && (
                  <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder={mode === 'login' ? '••••••••' : 'At least 6 characters'}
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
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider & Google Sign-In */}
          {isFirebaseConfigured && mode === 'login' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-900"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-950 px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setError('');
                  setLoading(true);
                  const res = await loginWithGoogle();
                  if (res.success) {
                    navigate('/');
                  } else {
                    setError(res.message);
                  }
                  setLoading(false);
                }}
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium rounded-lg shadow-sm active:translate-y-px transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.36 6.277-6.36 1.497 0 2.87.525 3.943 1.485l3.056-3.04C18.966 2.21 15.858 1 12.24 1 6.033 1 1 6.012 1 12.2s5.033 11.2 11.24 11.2c5.6 0 10.29-3.937 10.29-9.96 0-.63-.053-1.253-.16-1.855H12.24z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </>
          )}

          {/* Quick Demo logins for reviews */}
          <div className={`${isFirebaseConfigured && mode === 'login' ? 'mt-8' : 'mt-6'} pt-6 border-t border-slate-900`}>
            <div className="flex items-center gap-1.5 justify-center mb-4 text-indigo-400">
              <KeyRound size={14} />
              <span className="text-[10px] uppercase font-bold tracking-wider">Quick Demo Login Toggles</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@sprintflow.com', 'admin123')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold rounded border border-slate-800/80 text-rose-400 hover:border-rose-500/20 transition-all"
              >
                Sarah (Admin)
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('alice@sprintflow.com', 'dev123')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold rounded border border-slate-800/80 text-indigo-400 hover:border-indigo-500/20 transition-all"
              >
                Alice (Dev)
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('acme@client.com', 'client123')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold rounded border border-slate-800/80 text-teal-400 hover:border-teal-500/20 transition-all"
              >
                Jonathan (Client)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
