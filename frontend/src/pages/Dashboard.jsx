import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, getUserAnalyses, startAnalysis } from '../services/api';
import dashboardBg from '../assets/dashboard-bg.png';
import heroBg from '../assets/hero-bg.png';
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
  ArrowRight,
  FileText,
  Clock,
  Bug,
  Zap,
  Lightbulb,
  CheckCircle2,
  FileSearch,
  Bell,
  ChevronDown,
  LogOut,
  Sparkles,
  Code2,
  Terminal,
  Layers,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { TraceFlowMark } from '../components/TraceFlowLogo';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const tabParam = searchParams.get('tab') || 'dashboard';
    if (tabParam === 'files') {
      navigate('/files', { replace: true });
    } else if (tabParam === 'history') {
      navigate('/history', { replace: true });
    } else if (tabParam === 'reports') {
      navigate('/reports', { replace: true });
    } else {
      setActiveTab(tabParam);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    fetchDashboardData();
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

  const fetchDashboardData = async () => {
    try {
      if (user?.id) {
        const [projData, anaData] = await Promise.all([
          getProjects(user.id).catch(() => []),
          getUserAnalyses(user.id).catch(() => []),
        ]);
        setProjects(projData || []);
        setAnalyses(anaData || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
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

  const getBugBadge = (bugType) => {
    switch (bugType) {
      case 'INFINITE_LOOP':
        return <span className="badge badge-loop text-[11px]">Infinite Loop</span>;
      case 'OFF_BY_ONE':
        return <span className="badge badge-warning text-[11px]">Off-By-One</span>;
      case 'NULL_POINTER':
        return <span className="badge badge-null text-[11px]">Null Pointer</span>;
      case 'RECURSION_RISK':
        return <span className="badge badge-recursion text-[11px]">Recursion Risk</span>;
      case 'ARITHMETIC_ERROR':
        return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[11px]">Arithmetic / Div0</span>;
      case 'COMPILATION_ERROR':
        return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">Compile Error</span>;
      case 'TYPE_MISMATCH':
        return <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 font-bold text-[11px]">Type Mismatch</span>;
      case 'RESOURCE_LEAK':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">Resource Leak</span>;
      case 'LOGICAL_BUG':
        return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px]">Logical Bug</span>;
      case 'INDEX_OUT_OF_BOUNDS':
        return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[11px]">Index Out Of Bounds</span>;
      default:
        return <span className="badge badge-normal text-[11px]">Normal Flow</span>;
    }
  };

  const displayName = user?.username || 'ashu';
  const initial = displayName.charAt(0).toUpperCase();

  const totalBugsFound = analyses.filter(
    (a) => a.predictedClass && a.predictedClass !== 'NORMAL'
  ).length;

  return (
    <div
      className="dashboard-root"
      style={{ backgroundImage: `url(${dashboardBg})` }}
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
            <TraceFlowMark className="w-9 h-9 shrink-0" idPrefix="dash-logo" />

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
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`dashboard-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutGrid className="w-[18px] h-[18px] shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/files')}
              className="dashboard-nav-item"
            >
              <Folder className="w-[18px] h-[18px] shrink-0" />
              <span>My Files</span>
            </button>

            <button
              onClick={() => navigate('/history')}
              className="dashboard-nav-item"
            >
              <History className="w-[18px] h-[18px] shrink-0" />
              <span>Analysis History</span>
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="dashboard-nav-item"
            >
              <Shield className="w-[18px] h-[18px] shrink-0" />
              <span>Bug Reports</span>
            </button>

            <button
              onClick={() => handleTabChange('settings')}
              className={`dashboard-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => handleTabChange('help')}
              className={`dashboard-nav-item ${activeTab === 'help' ? 'active' : ''}`}
            >
              <HelpCircle className="w-[18px] h-[18px] shrink-0" />
              <span>Help &amp; Docs</span>
            </button>

            <button
              onClick={() => handleTabChange('about')}
              className={`dashboard-nav-item ${activeTab === 'about' ? 'active' : ''}`}
            >
              <Info className="w-[18px] h-[18px] shrink-0" />
              <span>About</span>
            </button>
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
          MAIN CONTENT AREA
          ========================================================= */}
      <main className="dashboard-main">
        {/* Top Bar with Notifications & Profile */}
        <div className="dashboard-topbar">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/90 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
          </button>

          {/* User Profile Pill */}
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
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleTabChange('dashboard');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/files');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5 text-blue-600" />
                  <span>My Files</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/upload');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload &amp; Analyze</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/history');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>Analysis History</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/reports');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bug Reports</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleTabChange('settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition text-left cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-600" />
                  <span>Settings</span>
                </button>
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

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'dashboard' && (
          <>
            {/* Hero Welcome Banner */}
            <div
              className="dashboard-hero"
              style={{ backgroundImage: `url(${heroBg})` }}
            >
              <div className="flex flex-col max-w-xl text-left z-10">
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0f172a] tracking-tight">
                  Welcome back, <span className="text-[#4f46e5]">{displayName}!</span> 👋
                </h1>
                <p className="text-xs sm:text-[13px] text-[#475569] mt-2 font-normal leading-relaxed max-w-md">
                  Trace runtime execution step-by-step, inspect AST control flows, and classify beginner bugs
                  with offline machine learning.
                </p>
              </div>

              {/* Action Button on the right (heroBg already contains the 3D code illustration) */}
              <div className="shrink-0 z-10">
                <button
                  onClick={() => navigate('/upload')}
                  className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white text-xs sm:text-[13px] font-bold shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_22px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 stroke-[2.2]" />
                  <span>Analyze New File</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Stats Row (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {/* Stat 1 */}
              <div
                onClick={() => navigate('/files')}
                className="dashboard-stat-card cursor-pointer hover:border-blue-300 hover:shadow-xs transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#eef4ff] text-[#2563eb] flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-500 leading-none">
                    Total Files
                  </span>
                  <span className="text-[26px] font-black text-[#0f172a] my-1 leading-none">
                    {projects.length}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 leading-none">
                    {projects.length > 0 ? `${projects.length} files in workspace` : 'No files uploaded yet'}
                  </span>
                </div>
              </div>

              {/* Stat 2 */}
              <div
                onClick={() => navigate('/history')}
                className="dashboard-stat-card cursor-pointer hover:border-purple-300 hover:shadow-xs transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center shrink-0">
                  <Play className="w-6 h-6 stroke-[2] fill-purple-600/20" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-500 leading-none">
                    Analyses Run
                  </span>
                  <span className="text-[26px] font-black text-[#0f172a] my-1 leading-none">
                    {analyses.length}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 leading-none">
                    {analyses.length > 0 ? `${analyses.length} analyses completed` : 'Start your first analysis'}
                  </span>
                </div>
              </div>

              {/* Stat 3 */}
              <div
                onClick={() => navigate('/reports')}
                className="dashboard-stat-card cursor-pointer hover:border-rose-300 hover:shadow-xs transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#fff1f2] text-[#f43f5e] flex items-center justify-center shrink-0">
                  <Bug className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-500 leading-none">
                    Bugs Found
                  </span>
                  <span className="text-[26px] font-black text-[#0f172a] my-1 leading-none">
                    {totalBugsFound}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 leading-none">
                    {totalBugsFound > 0 ? `${totalBugsFound} bug types classified` : 'No bugs detected yet'}
                  </span>
                </div>
              </div>

              {/* Stat 4 */}
              <div
                onClick={() => navigate('/history')}
                className="dashboard-stat-card cursor-pointer hover:border-emerald-300 hover:shadow-xs transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] text-[#10b981] flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-500 leading-none">
                    Recent Analyses
                  </span>
                  <span className="text-[26px] font-black text-[#0f172a] my-1 leading-none">
                    {analyses.slice(0, 5).length}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 leading-none">
                    {analyses.length > 0 ? 'Latest trace timeline ready' : 'Nothing to show'}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Section (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
              {/* Column 1: Your Java Files */}
              <div className="dashboard-section-card text-left flex flex-col justify-between lg:col-span-3">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#eef4ff] text-[#2563eb] flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#0f172a] leading-none">
                          Your Java Files
                        </h2>
                        <p className="text-[11px] font-medium text-slate-400 mt-1 leading-none">
                          Uploaded source files and analysis runs
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/upload')}
                      className="h-8.5 px-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer bg-white whitespace-nowrap shrink-0"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="whitespace-nowrap">Upload File</span>
                    </button>
                  </div>

                  {/* Body */}
                  <div className="pt-3">
                    {projects.length === 0 ? (
                      <div className="w-full flex flex-col items-center justify-center text-center py-6">
                        <div className="w-11 h-11 rounded-xl bg-[#eef4ff] text-[#3b82f6] flex items-center justify-center mb-2.5">
                          <Folder className="w-5.5 h-5.5 stroke-[1.8]" />
                        </div>
                        <h3 className="text-[13.5px] font-bold text-[#0f172a]">
                          No Java files uploaded yet
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                          Upload a .java file or choose from built-in bug presets to visualize execution flow and ML predictions.
                        </p>
                        <button
                          onClick={() => navigate('/upload')}
                          className="mt-3.5 h-9 px-5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <UploadCloud className="w-4 h-4 shrink-0" />
                          <span className="whitespace-nowrap">Upload First Java File</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full divide-y divide-slate-100">
                        {projects.slice(0, 4).map((p) => (
                          <div key={p.id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <div className="text-left">
                                <p className="text-xs font-bold text-slate-800">{p.name || p.fileName}</p>
                                <p className="text-[10px] text-slate-400">{p.linesCount || 0} lines • Java Source</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRunAnalysis(p.id)}
                              disabled={analyzingId === p.id}
                              className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Play className="w-3 h-3" />
                              <span>{analyzingId === p.id ? 'Analyzing...' : 'Analyze'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Recent Analysis */}
              <div className="dashboard-section-card text-left flex flex-col justify-between lg:col-span-2">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#eef4ff] text-[#2563eb] flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#0f172a] leading-none">
                          Recent Analysis
                        </h2>
                        <p className="text-[11px] font-medium text-slate-400 mt-1 leading-none">
                          Your latest file analyses
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/history')}
                      className="text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>View All History</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="pt-3">
                    {analyses.length === 0 ? (
                      <div className="w-full flex flex-col items-center justify-center text-center py-6">
                        <div className="w-11 h-11 rounded-xl bg-[#eef4ff] text-[#3b82f6] flex items-center justify-center mb-2.5">
                          <FileSearch className="w-5.5 h-5.5 stroke-[1.8]" />
                        </div>
                        <h3 className="text-[13.5px] font-bold text-[#0f172a]">
                          No analyses yet
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                          Upload a file and start your first analysis.
                        </p>
                      </div>
                    ) : (
                      <div className="w-full divide-y divide-slate-100">
                        {analyses.slice(0, 4).map((a) => (
                          <div key={a.id} className="py-3 flex items-center justify-between">
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">
                                  {a.project?.name || `Analysis #${a.id}`}
                                </span>
                                {getBugBadge(a.predictedClass)}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {a.totalSteps || 0} steps • {a.status || 'COMPLETED'}
                              </p>
                            </div>
                            <Link
                              to={`/analysis/${a.id}`}
                              className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs flex items-center gap-1 transition no-underline"
                            >
                              <span>View</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section (Quick Actions & Tips) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
              {/* Quick Actions (3 cols span) */}
              <div className="dashboard-section-card lg:col-span-3 text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center shrink-0">
                      <Zap className="w-4.5 h-4.5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0f172a] leading-none">
                        Quick Actions
                      </h2>
                      <p className="text-[10.5px] text-slate-400 leading-none mt-1">
                        Get started quickly
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
                    {/* Action 1: Capsule pill */}
                    <button
                      onClick={() => navigate('/upload')}
                      className="p-2.5 px-3.5 rounded-full bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition flex items-center gap-3 text-left cursor-pointer shadow-2xs group"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <UploadCloud className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#0f172a] leading-tight truncate">
                          Analyze New File
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">
                          Upload and analyze
                        </p>
                      </div>
                    </button>

                    {/* Action 2: Capsule pill */}
                    <button
                      onClick={() => navigate('/upload')}
                      className="p-2.5 px-3.5 rounded-full bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-xs transition flex items-center gap-3 text-left cursor-pointer shadow-2xs group"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#0f172a] leading-tight truncate">
                          View Sample Files
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">
                          Try example files
                        </p>
                      </div>
                    </button>

                    {/* Action 3: Capsule pill */}
                    <button
                      onClick={() => navigate('/history')}
                      className="p-2.5 px-3.5 rounded-full bg-white border border-slate-200/80 hover:border-cyan-300 hover:shadow-xs transition flex items-center gap-3 text-left cursor-pointer shadow-2xs group"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#ecfeff] text-[#0284c7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <History className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#0f172a] leading-tight truncate">
                          Analysis History
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">
                          Explore stored traces
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips Section (2 cols span) */}
              <div className="dashboard-section-card lg:col-span-2 text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#fefce8] text-[#ca8a04] flex items-center justify-center shrink-0">
                      <Lightbulb className="w-4.5 h-4.5 fill-amber-500/20" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0f172a] leading-none">
                        Tips
                      </h2>
                      <p className="text-[10.5px] text-slate-400 leading-none mt-1">
                        Make the most of TraceFlow
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-2 text-[11.5px] text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                      <span>Upload a Java file to start analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                      <span>Use sample files to explore features</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                      <span>View execution flow and control structures</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                      <span>Detect and learn from common bugs offline</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Analysis History */}
        {activeTab === 'history' && (
          <div className="dashboard-section-card text-left">
            <div className="pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-black text-[#0f172a]">Analysis History</h2>
              <p className="text-xs text-slate-500 mt-1">Complete record of your JDI execution traces &amp; ML classifications</p>
            </div>

            {analyses.length === 0 ? (
              <div className="py-16 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700">No analysis runs recorded yet</h3>
                <p className="text-xs text-slate-400 mt-1">Run an analysis on any Java file to start tracking timeline history.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Analysis ID</th>
                      <th className="py-3 px-4">Program</th>
                      <th className="py-3 px-4">ML Prediction</th>
                      <th className="py-3 px-4">Traced Steps</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analyses.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">#{a.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{a.project?.name || 'Java Program'}</td>
                        <td className="py-3 px-4">{getBugBadge(a.predictedClass)}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{a.totalSteps || 0} steps</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(a.createdAt || Date.now()).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/analysis/${a.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition no-underline"
                          >
                            <span>View Studio</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Bug Reports */}
        {activeTab === 'reports' && (
          <div className="dashboard-section-card text-left">
            <div className="pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-black text-[#0f172a]">Bug Classification Catalog</h2>
              <p className="text-xs text-slate-500 mt-1">Supported offline detection models and pattern categories</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50">
                <span className="badge badge-loop text-[11px] mb-2">INFINITE_LOOP</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Infinite Loop Safeguard</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Detected when loop condition variable is not properly mutated, exceeding the 500 runtime step safeguard threshold.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50">
                <span className="badge badge-warning text-[11px] mb-2">OFF_BY_ONE</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Off-By-One Boundary Error</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Triggers on boundary condition bugs (e.g. `i &lt;= array.length`) throwing `ArrayIndexOutOfBoundsException`.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50">
                <span className="badge badge-null text-[11px] mb-2">NULL_POINTER</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Null Pointer Dereference</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Identified when invoking methods or accessing fields on uninitialized references throwing `NullPointerException`.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50">
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[11px] mb-2 inline-block">ARITHMETIC_ERROR</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Division by Zero</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Identified statically or at runtime when dividing or modulo by zero / zero variables, throwing `ArithmeticException`.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-cyan-200 bg-cyan-50/50">
                <span className="badge badge-recursion text-[11px] mb-2">RECURSION_RISK</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Unbounded Recursion</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Flagged when stack depth exceeds 20 frames without hitting a terminating base condition.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-red-300 bg-red-100/50">
                <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-bold text-[11px] mb-2 inline-block">COMPILATION_ERROR</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Syntax &amp; Compiler Error</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Detected by `javax.tools.JavaCompiler` and AST parse errors before runtime execution.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/50">
                <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 font-bold text-[11px] mb-2 inline-block">TYPE_MISMATCH</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Type Mismatch / Incompatible Types</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Detected when types cannot be implicitly converted or Scanner methods mismatch token types.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-amber-300 bg-amber-100/40">
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[11px] mb-2 inline-block">RESOURCE_LEAK</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Unclosed Resource Leak</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Identified when `AutoCloseable` streams, Scanners, or Readers are opened without `close()` or try-with-resources.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50/50">
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] mb-2 inline-block">LOGICAL_BUG</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Logical / Semantic Flaw</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Detected when conditions are always false/true, unreachable statements occur, or incorrect operators are used.
                </p>
              </div>
            </div>
          </div>
        )}



        {/* Tab 5: Settings */}
        {activeTab === 'settings' && (
          <div className="dashboard-section-card text-left max-w-2xl">
            <div className="pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-black text-[#0f172a]">TraceFlow Settings</h2>
              <p className="text-xs text-slate-500 mt-1">Local execution sandbox and model configurations</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Tracer Max Step Limit</h4>
                  <p className="text-slate-500 mt-0.5">Maximum instruction steps before triggering loop safeguard</p>
                </div>
                <span className="font-mono font-bold text-indigo-600 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200">
                  500 steps
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Execution Timeout</h4>
                  <p className="text-slate-500 mt-0.5">Safety cutoff timeout for single-stepping runtime</p>
                </div>
                <span className="font-mono font-bold text-indigo-600 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200">
                  5000 ms
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Weka Classifier Model</h4>
                  <p className="text-slate-500 mt-0.5">Decision Tree with 10-fold cross validation</p>
                </div>
                <span className="font-mono font-bold text-emerald-600 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                  J48 (97.37% Acc)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Help & Docs */}
        {activeTab === 'help' && (
          <div className="dashboard-section-card text-left max-w-3xl">
            <div className="pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-black text-[#0f172a]">Offline Architecture &amp; Documentation</h2>
              <p className="text-xs text-slate-500 mt-1">How TraceFlow analyzes and debugs Java code without the cloud</p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  1. JavaParser AST &amp; Control Flow Graph
                </h4>
                <p>
                  TraceFlow parses Java source files using JavaParser, extracting Abstract Syntax Tree nodes,
                  identifying control flow branches (if/else, loops, recursion), and calculating cyclomatic complexity.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  2. Java Debug Interface (JDI) Dynamic Tracer
                </h4>
                <p>
                  Launches a monitored JVM process via `com.sun.jdi.CommandLineLaunch`, single-stepping through bytecode,
                  capturing method entry/exit events, inspecting stack frames, and recording variable mutation history.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  3. Weka ML Classification Engine
                </h4>
                <p>
                  Extracts 10 dynamic and static behavioral features, classifying execution into Normal, Infinite Loop,
                  Off-By-One, Null Pointer, or Recursion Risk categories with beginner-friendly explanations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: About */}
        {activeTab === 'about' && (
          <div className="dashboard-section-card text-left max-w-2xl">
            <div className="pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-black text-[#0f172a]">About TraceFlow</h2>
              <p className="text-xs text-slate-500 mt-1">Platform overview and environment runtime info</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Version</span>
                <span className="font-bold text-slate-800">1.0.0 (Release)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Backend Framework</span>
                <span className="font-bold text-slate-800">Spring Boot 3.3.5 / Java 26</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Frontend</span>
                <span className="font-bold text-slate-800">React 18 + Vite 5 + TailwindCSS</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Machine Learning</span>
                <span className="font-bold text-slate-800">Weka 3.8.6 (J48 Decision Tree)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Operation Mode</span>
                <span className="font-bold text-emerald-600">100% Offline &amp; Local</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
