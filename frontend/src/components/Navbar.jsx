import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UploadCloud,
  ChevronDown,
  LogOut,
  FileCode,
} from 'lucide-react';
import { TraceFlowLogoBadge } from './TraceFlowLogo';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const displayName = user?.username || 'ashu';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-[64px] px-6 bg-[#080b14] border-b border-slate-800/80 flex items-center justify-between shrink-0 select-none z-40 relative">
      {/* Left: Brand Logo & Subtitle */}
      <div className="flex items-center gap-8">
        <Link to="/dashboard" className="flex items-center gap-3 no-underline group">
          <TraceFlowLogoBadge size="sm" idPrefix="nav-logo" className="group-hover:scale-105 transition-transform" />

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 leading-none">
              <span className="font-extrabold text-base tracking-tight text-white">
                Trace<span className="text-[#3b82f6]">Flow</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30">
                OFFLINE AI
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal mt-1 leading-none">
              Java Execution &amp; Bug Engine
            </span>
          </div>
        </Link>

        {/* Center-left: Tab-style navigation */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-2 pl-4">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                isActive('/dashboard')
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/upload"
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                isActive('/upload')
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <span>Analyze Source</span>
            </Link>
          </nav>
        )}
      </div>

      {/* Right: User Profile & Dropdown */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-800/50 transition cursor-pointer text-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/30">
                {initial}
              </div>
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0d101e] border border-slate-800 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="font-bold text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Offline Local Engine</p>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/15 transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/upload"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/15 transition"
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Analyze Source</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition mt-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
