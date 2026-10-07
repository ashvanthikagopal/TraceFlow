import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, startAnalysis } from '../services/api';
import filesBg from '../assets/files-bg.png';
import sidebarBg from '../assets/sidebar-bg.png';
import {
  LayoutGrid,
  Folder,
  History,
  Shield,
  Database,
  Settings,
  HelpCircle,
  Info,
  WifiOff,
  UploadCloud,
  Play,
  FileText,
  Lightbulb,
  Bell,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { TraceFlowMark } from '../components/TraceFlowLogo';

const MyFiles = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    try {
      if (user?.id) {
        const projData = await getProjects(user.id).catch(() => []);
        setProjects(projData || []);
      }
    } catch (err) {
      console.error('Failed to load files', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async (projectId) => {
    setAnalyzingId(projectId);
    try {
      const result = await startAnalysis(projectId);
      navigate(`/analysis/${result.id}`);
    } catch (err) {
      alert('Analysis failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const displayName = user?.username || 'ashu';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className="myfiles-root"
      style={{ backgroundImage: `url(${filesBg})` }}
    >
      {/* =========================================================
          LEFT SIDEBAR
          ========================================================= */}
      <aside
        className="dashboard-sidebar"
        style={{ backgroundImage: `url(${sidebarBg})` }}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="dashboard-brand-header">
            <TraceFlowMark className="w-9 h-9 shrink-0" idPrefix="files-logo" />

            <div className="flex flex-col text-left">
              <span className="dashboard-brand-title">
                Trace<span className="text-[#2563eb]">Flow</span>
              </span>
              <span className="dashboard-brand-subtitle">
                Java Execution &amp; Bug Engine
              </span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="dashboard-nav-list">
            <Link
              to="/dashboard"
              className="dashboard-nav-item"
            >
              <LayoutGrid className="w-[18px] h-[18px] shrink-0" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/files"
              className="dashboard-nav-item active"
            >
              <Folder className="w-[18px] h-[18px] shrink-0" />
              <span>My Files</span>
            </Link>

            <Link
              to="/history"
              className="dashboard-nav-item"
            >
              <History className="w-[18px] h-[18px] shrink-0" />
              <span>Analysis History</span>
            </Link>

            <Link
              to="/reports"
              className="dashboard-nav-item"
            >
              <Shield className="w-[18px] h-[18px] shrink-0" />
              <span>Bug Reports</span>
            </Link>

            <Link
              to="/dashboard?tab=settings"
              className="dashboard-nav-item"
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
              <span>Settings</span>
            </Link>

            <Link
              to="/dashboard?tab=help"
              className="dashboard-nav-item"
            >
              <HelpCircle className="w-[18px] h-[18px] shrink-0" />
              <span>Help &amp; Docs</span>
            </Link>

            <Link
              to="/dashboard?tab=about"
              className="dashboard-nav-item"
            >
              <Info className="w-[18px] h-[18px] shrink-0" />
              <span>About</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Offline Mode Badge */}
        <div className="p-2.5 px-3.5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xs flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center shrink-0">
              <WifiOff className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[11.5px] font-bold text-[#0f172a] leading-none">
                Offline Mode
              </span>
              <span className="text-[9.5px] font-bold text-[#7c3aed] leading-none mt-1">
                100% Offline
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center shrink-0 pr-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981] shadow-[0_0_0_2px_rgba(16,185,129,0.25)]"></span>
            </span>
          </div>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT
          ========================================================= */}
      <main className="myfiles-main">
        {/* Top Header Row with Breadcrumbs & Profile */}
        <div className="myfiles-topbar flex items-center justify-between mb-3">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition no-underline"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-900 font-bold">My Files</span>
          </div>

          {/* Top Right Profile & Notifications */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-white/90 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>

            {/* Profile Pill */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white border border-slate-200/90 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-[#3b82f6] text-white flex items-center justify-center font-bold text-xs">
                  {initial}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[10.5px] text-slate-400 font-mono">Offline Local Engine</p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left no-underline"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/files"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left no-underline"
                  >
                    <Folder className="w-3.5 h-3.5 text-blue-600" />
                    <span>My Files</span>
                  </Link>
                  <Link
                    to="/upload"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left no-underline"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload &amp; Analyze</span>
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left no-underline"
                  >
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    <span>Analysis History</span>
                  </Link>
                  <Link
                    to="/reports"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left no-underline"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bug Reports</span>
                  </Link>
                  <Link
                    to="/dashboard?tab=settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left no-underline"
                  >
                    <Settings className="w-3.5 h-3.5 text-blue-600" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            MAIN WHITE CARD CONTAINER (Solid White Card matching image)
            ========================================================= */}
        <div className="myfiles-card">
          {/* Header Row: Title on Left, Upload Button on Right */}
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h1 className="text-[24px] sm:text-[26px] font-black text-[#0f172a] tracking-tight leading-tight">
                All Java Source Files
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-400 font-normal mt-0.5 leading-none">
                Manage uploaded source files and test cases
              </p>
            </div>

            <button
              onClick={() => navigate('/upload')}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#7c3aed] text-white text-xs sm:text-[13px] font-bold shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4.5 h-4.5 stroke-[2.2]" />
              <span>Upload File</span>
            </button>
          </div>

          {/* Center Upload / Empty State Container */}
          <div className="myfiles-dropzone">
            {projects.length === 0 ? (
              <>
                {/* 3D Blue Folder Illustration */}
                <div className="relative w-36 h-28 flex items-center justify-center mb-2">
                  <div className="absolute w-28 h-28 rounded-full bg-blue-100/70 blur-lg pointer-events-none" />
                  <svg width="105" height="90" viewBox="0 0 110 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                    <rect x="22" y="10" width="38" height="18" rx="5" fill="#bfdbfe" />
                    <rect x="30" y="16" width="46" height="52" rx="5" fill="#ffffff" stroke="#93c5fd" strokeWidth="2" />
                    <line x1="38" y1="28" x2="64" y2="28" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="38" y1="36" x2="58" y2="36" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
                    <path
                      d="M10 28C10 22.4772 14.4772 18 20 18H44L54 28H90C95.5228 28 100 32.4772 100 38V76C100 81.5228 95.5228 86 90 86H20C14.4772 86 10 81.5228 10 76V28Z"
                      fill="url(#files-folder-grad)"
                    />
                    <path
                      d="M10 40L24 86H96L100 40H10Z"
                      fill="url(#files-flap-grad)"
                      fillOpacity="0.85"
                    />
                    <defs>
                      <linearGradient id="files-folder-grad" x1="10" y1="18" x2="100" y2="86" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#60a5fa" />
                        <stop offset="1" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="files-flap-grad" x1="10" y1="40" x2="100" y2="86" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#93c5fd" />
                        <stop offset="1" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute right-4 bottom-2 w-9 h-9 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#6366f1] text-white flex items-center justify-center shadow-lg shadow-blue-500/35 border-2 border-white z-20">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                  </div>
                </div>

                <h2 className="text-[19px] font-bold text-[#0f172a] mb-1">
                  No files uploaded yet
                </h2>
                <p className="text-xs sm:text-[13px] text-slate-400 max-w-md mb-5 leading-relaxed">
                  Upload a Java file or choose from built-in test cases to start analyzing your code.
                </p>

                <button
                  onClick={() => navigate('/upload')}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#7c3aed] text-white text-xs sm:text-[13px] font-bold shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_18px_rgba(37,99,235,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 stroke-[2.2]" />
                  <span>Upload Your First Java File</span>
                </button>
              </>
            ) : (
              <div className="w-full text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <FileText className="w-5 h-5 stroke-[2]" />
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            {p.fileSize ? `${Math.round(p.fileSize / 1024)} KB` : 'Java'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-[14.5px] mt-3.5 truncate">
                          {p.name || p.fileName}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {p.linesCount || 0} lines • Created {new Date(p.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => handleRunAnalysis(p.id)}
                          disabled={analyzingId === p.id}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#7c3aed] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:brightness-105 active:scale-[0.99] transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white stroke-none" />
                          <span>{analyzingId === p.id ? 'Analyzing...' : 'Run Analysis'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom 2-Column Info Box */}
          <div className="myfiles-info-box">
            {/* Left: Supported File Types */}
            <div className="flex items-center gap-4 text-left border-r border-slate-200/70 pr-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/70">
                <FileText className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-[13.5px] font-bold text-[#0f172a] leading-tight">
                  Supported File Types
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Upload .java files to analyze execution flow, trace method calls, and detect potential issues.
                </p>
              </div>
            </div>

            {/* Right: Tips */}
            <div className="flex items-start gap-4 text-left pl-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100/70">
                <Lightbulb className="w-5 h-5 stroke-[2] fill-amber-500/20" />
              </div>
              <div>
                <h3 className="text-xs sm:text-[13.5px] font-bold text-[#0f172a] leading-tight">
                  Tips
                </h3>
                <ul className="text-xs text-slate-400 mt-0.5 space-y-0.5">
                  <li>• You can upload multiple files later</li>
                  <li>• Use clean, well-structured Java code for better analysis</li>
                  <li>• Explore our sample files if you're new</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyFiles;
