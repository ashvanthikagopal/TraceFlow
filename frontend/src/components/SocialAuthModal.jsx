import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Shield, Plus, CheckCircle2, Trash2, Mail, User } from 'lucide-react';

const DEFAULT_GOOGLE_ACCOUNTS = [
  {
    name: 'Alex Rivera',
    email: 'alex.rivera.dev@gmail.com',
    username: 'alex_rivera',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    color: '#4285F4',
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@google.com',
    username: 'sarah_chen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    color: '#EA4335',
  },
];

const DEFAULT_GITHUB_ACCOUNTS = [
  {
    name: 'Octocat Developer',
    email: 'octocat@github.com',
    username: 'octocat_dev',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    bio: 'Java & AST Specialist',
  },
  {
    name: 'Ashu CodeCraft',
    email: 'ashu.coder@traceflow.dev',
    username: 'ashu_coder',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    bio: 'Fullstack & Compiler Engineer',
  },
];

export const SocialAuthModal = ({
  isOpen,
  provider = 'google', // 'google' | 'github'
  onClose,
  onAuthenticate,
  loading = false,
}) => {
  const isGoogle = provider === 'google';
  const storageKey = isGoogle ? 'traceflow_google_accounts' : 'traceflow_github_accounts';

  // Load dynamic accounts from localStorage, with smart fallback to previous session or default list
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Check if there's a stored user from normal login
      const lastUser = localStorage.getItem('traceflow_user');
      if (lastUser) {
        const userObj = JSON.parse(lastUser);
        if (userObj && (userObj.email || userObj.username)) {
          const userEmail = userObj.email || `${userObj.username}@gmail.com`;
          const userName = userObj.username || 'User';
          return [
            {
              name: userName.charAt(0).toUpperCase() + userName.slice(1),
              email: userEmail,
              username: userObj.username || 'user',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
              color: '#4285F4',
            },
            ...(isGoogle ? DEFAULT_GOOGLE_ACCOUNTS.slice(0, 1) : DEFAULT_GITHUB_ACCOUNTS.slice(0, 1)),
          ];
        }
      }
    } catch (e) {
      console.warn('Failed to load accounts from storage', e);
    }
    return isGoogle ? DEFAULT_GOOGLE_ACCOUNTS : DEFAULT_GITHUB_ACCOUNTS;
  });

  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [provider, storageKey]);

  if (!isOpen || !provider) return null;

  const saveAccountsToStorage = (updated) => {
    setAccounts(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist accounts', e);
    }
  };

  const handleSelectAccount = (acc) => {
    onAuthenticate({
      provider,
      email: acc.email,
      username: acc.username || acc.email.split('@')[0],
      fullName: acc.name,
      avatarUrl: acc.avatar,
    });
  };

  const handleRemoveAccount = (e, emailToRemove) => {
    e.stopPropagation();
    const updated = accounts.filter((a) => a.email !== emailToRemove);
    saveAccountsToStorage(updated);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setInputError('');

    const trimmedEmail = customEmail.trim();
    if (!trimmedEmail) {
      setInputError('Please enter a valid email address.');
      return;
    }

    if (isGoogle && !trimmedEmail.includes('@')) {
      setInputError('Please enter a valid Gmail / Google email address.');
      return;
    }

    const derivedUser = trimmedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    const displayName = customName.trim() || derivedUser.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const newAccount = {
      name: displayName,
      email: trimmedEmail,
      username: derivedUser || `${provider}_user`,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
      color: '#4285F4',
    };

    // Add to accounts list if not already present, putting newest at the top
    const filtered = accounts.filter((a) => a.email.toLowerCase() !== trimmedEmail.toLowerCase());
    const updated = [newAccount, ...filtered];
    saveAccountsToStorage(updated);

    // Authenticate immediately
    onAuthenticate({
      provider,
      email: trimmedEmail,
      username: newAccount.username,
      fullName: displayName,
      avatarUrl: newAccount.avatar,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[540px] bg-white rounded-[26px] shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800 text-left animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100/90 flex items-center justify-between bg-gradient-to-b from-slate-50/50 to-white">
          <div className="flex items-center gap-3.5">
            {isGoogle ? (
              <div className="w-10 h-10 rounded-full border border-slate-200/90 bg-white flex items-center justify-center shadow-xs shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
            )}
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 leading-tight">
                {isGoogle ? 'Sign in with Google' : 'Authorize with GitHub'}
              </h3>
              <p className="text-[12.5px] text-slate-500 font-normal leading-snug mt-0.5">
                to continue to <span className="font-semibold text-[#2563eb]">TraceFlow Offline</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 pt-5">
          {!useCustom ? (
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-slate-600 mb-2.5">
                Choose an account to sign in:
              </p>

              {/* Dynamic Account Cards */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-0.5">
                {accounts.map((acc, idx) => {
                  const initial = (acc.name || acc.email || 'U').charAt(0).toUpperCase();
                  return (
                    <div
                      key={acc.email || idx}
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full p-3.5 px-4 rounded-[20px] border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/25 transition-all flex items-center justify-between group cursor-pointer text-left shadow-2xs relative"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        {acc.avatar ? (
                          <img
                            src={acc.avatar}
                            alt={acc.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: acc.avatar ? 'none' : 'flex' }}
                          className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-sm items-center justify-center shrink-0 shadow-xs"
                        >
                          {initial}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <h4 className="text-[13.5px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {acc.name}
                          </h4>
                          <p className="text-[12px] text-slate-500 font-normal truncate mt-0.5">
                            {acc.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveAccount(e, acc.email)}
                            title="Remove account"
                            className="w-7 h-7 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add / Use another account button */}
              <button
                type="button"
                onClick={() => {
                  setCustomEmail('');
                  setCustomName('');
                  setInputError('');
                  setUseCustom(true);
                }}
                className="w-full py-3 px-4 rounded-[16px] border border-dashed border-slate-300 text-[13px] font-semibold text-[#2563eb] hover:bg-blue-50/40 hover:border-blue-400 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <Plus className="w-4 h-4 text-[#2563eb]" />
                <span>Use another {isGoogle ? 'Google' : 'GitHub'} account</span>
              </button>
            </div>
          ) : (
            /* Custom Account Form (Allows entering dynamic Gmail) */
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-700">
                  Enter your {isGoogle ? 'Google / Gmail' : 'GitHub'} Account Details
                </span>
                <span className="text-[11px] text-slate-400">
                  Saved automatically for quick login
                </span>
              </div>

              {inputError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
                  {inputError}
                </div>
              )}

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Ashvanthika"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1.5">
                  Your {isGoogle ? 'Gmail Address' : 'Email / Username'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder={isGoogle ? 'your.name@gmail.com' : 'your_username@github.com'}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUseCustom(false)}
                  className="w-1/3 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 h-10 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Signing in...' : 'Sign In & Save Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Footer Footnote */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[11.5px] font-medium text-slate-600">Offline Token Verification</span>
            </div>
            <span className="text-[11.5px] font-medium text-slate-400">TraceFlow Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialAuthModal;
