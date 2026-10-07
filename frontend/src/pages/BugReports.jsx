import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserAnalyses } from '../services/api';
import bugReportsBg from '../assets/bug-reports-bg.png';
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
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Download,
  Eye,
  MoreVertical,
  Home,
  Plus,
  Bug,
  AlertOctagon,
  AlertTriangle,
} from 'lucide-react';
import { TraceFlowMark } from '../components/TraceFlowLogo';

const BugReports = () => {
  const { user, logout } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All Severity');
  const [severityDropdownOpen, setSeverityDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const dropdownRef = useRef(null);
  const severityRef = useRef(null);
  const exportRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBugs();
  }, [user]);

  const fetchBugs = async () => {
    setLoading(true);
    try {
      const analyses = await getUserAnalyses(user?.id || 0).catch(() => []);
      if (Array.isArray(analyses) && analyses.length > 0) {
        const bugList = [];
        let count = 1;
        analyses.forEach((a) => {
          const dt = new Date(a.startedAt || a.createdAt || Date.now());
          const fn = a.project?.name || a.project?.fileName || (a.sourceCode ? 'Program.java' : `Analysis #${a.id}`);

          if (a.predictedClass && a.predictedClass !== 'NORMAL') {
            const prettyTitle = a.predictedClass.replace(/_/g, ' ');
            const isCritical = a.predictedClass === 'NULL_POINTER' || a.predictedClass === 'INFINITE_LOOP' || a.predictedClass === 'COMPILATION_ERROR';
            const isMajor = a.predictedClass === 'OFF_BY_ONE' || a.predictedClass === 'INDEX_OUT_OF_BOUNDS' || a.predictedClass === 'RECURSION_RISK';
            bugList.push({
              id: count++,
              analysisId: a.id,
              title: `${prettyTitle} in ${fn}`,
              fileName: fn,
              type: isCritical ? 'Runtime' : 'Logical',
              severity: isCritical ? 'Critical' : (isMajor ? 'Major' : 'Minor'),
              status: 'Open',
              date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            });
          }

          if (Array.isArray(a.staticIssues)) {
            a.staticIssues.forEach((issue) => {
              bugList.push({
                id: count++,
                analysisId: a.id,
                title: issue.message || issue.description || 'Static Rule Finding',
                fileName: fn,
                type: 'Code Smell',
                severity: issue.severity === 'HIGH' ? 'Critical' : (issue.severity === 'MEDIUM' ? 'Major' : 'Minor'),
                status: 'Open',
                date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              });
            });
          }
        });
        setBugs(bugList);
      } else {
        setBugs([]);
      }
    } catch (e) {
      console.error('Failed to load bug reports', e);
      setBugs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (severityRef.current && !severityRef.current.contains(event.target)) {
        setSeverityDropdownOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
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

  const displayName = user?.username || 'ashu';
  const initial = displayName.charAt(0).toUpperCase();

  // Filter items
  const filteredBugs = bugs.filter((bug) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      bug.title.toLowerCase().includes(q) ||
      bug.fileName.toLowerCase().includes(q) ||
      bug.status.toLowerCase().includes(q) ||
      bug.type.toLowerCase().includes(q) ||
      bug.severity.toLowerCase().includes(q);

    const matchesSeverity =
      severityFilter === 'All Severity' || bug.severity.toLowerCase() === severityFilter.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const totalPages = Math.ceil(filteredBugs.length / itemsPerPage) || 1;
  const displayedBugs = filteredBugs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const criticalCount = bugs.filter((b) => b.severity === 'Critical').length;
  const majorCount = bugs.filter((b) => b.severity === 'Major').length;
  const minorCount = bugs.filter((b) => b.severity === 'Minor').length;

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'Runtime':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f3e8ff] text-[#9333ea] border border-purple-200/60 text-[11px] font-semibold">
            Runtime
          </span>
        );
      case 'Resource':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] border border-emerald-200/60 text-[11px] font-semibold">
            Resource
          </span>
        );
      case 'Code Smell':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0284c7] border border-sky-200/60 text-[11px] font-semibold">
            Code Smell
          </span>
        );
      case 'Logical':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#e0e7ff] text-[#4f46e5] border border-indigo-200/60 text-[11px] font-semibold">
            Logical
          </span>
        );
    }
  };

  const renderSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#ef4444] border border-rose-200/60 text-[11px] font-semibold">
            Critical
          </span>
        );
      case 'Major':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#d97706] border border-amber-200/60 text-[11px] font-semibold">
            Major
          </span>
        );
      case 'Minor':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0284c7] border border-sky-200/60 text-[11px] font-semibold">
            Minor
          </span>
        );
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#ef4444] border border-rose-200/60 text-[11px] font-semibold">
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#eff6ff] text-[#2563eb] border border-blue-200/60 text-[11px] font-semibold">
            In Progress
          </span>
        );
      case 'Fixed':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] border border-emerald-200/60 text-[11px] font-semibold">
            Fixed
          </span>
        );
    }
  };

  return (
    <div
      className="bugreports-root"
      style={{ backgroundImage: `url(${bugReportsBg})` }}
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
            <TraceFlowMark className="w-9 h-9 shrink-0" idPrefix="bugs-logo" />

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
            <Link to="/dashboard" className="dashboard-nav-item">
              <LayoutGrid className="w-[18px] h-[18px] shrink-0" />
              <span>Dashboard</span>
            </Link>

            <Link to="/files" className="dashboard-nav-item">
              <Folder className="w-[18px] h-[18px] shrink-0" />
              <span>My Files</span>
            </Link>

            <Link to="/history" className="dashboard-nav-item">
              <History className="w-[18px] h-[18px] shrink-0" />
              <span>Analysis History</span>
            </Link>

            <Link to="/reports" className="dashboard-nav-item active">
              <Shield className="w-[18px] h-[18px] shrink-0" />
              <span>Bug Reports</span>
            </Link>

            <Link to="/dashboard?tab=settings" className="dashboard-nav-item">
              <Settings className="w-[18px] h-[18px] shrink-0" />
              <span>Settings</span>
            </Link>

            <Link to="/dashboard?tab=help" className="dashboard-nav-item">
              <HelpCircle className="w-[18px] h-[18px] shrink-0" />
              <span>Help &amp; Docs</span>
            </Link>

            <Link to="/dashboard?tab=about" className="dashboard-nav-item">
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
          MAIN CONTENT AREA
          ========================================================= */}
      <main className="bugreports-main">
        {/* Top Header Row with Breadcrumbs & Profile */}
        <div className="flex items-center justify-between h-[42px] mb-3">
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
            <span className="text-slate-900 font-bold">Bug Reports</span>
          </div>

          {/* Right Notifications & Profile */}
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
            MAIN WHITE CARD CONTAINER
            ========================================================= */}
        <div className="bugreports-card">
          {/* Card Top Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#eef4ff] text-[#2563eb] flex items-center justify-center shrink-0 border border-blue-100/80 shadow-xs">
                <Bug className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h1 className="text-[22px] sm:text-[24px] font-black text-[#0f172a] tracking-tight leading-tight">
                  Bug Reports
                </h1>
                <p className="text-xs text-slate-400 font-normal mt-0.5 leading-none">
                  View and manage bugs detected in your Java code
                </p>
              </div>
            </div>

            {/* Right Search, Severity Filter & New Report Button */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search Bar */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search bugs by title, file, or status..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 pl-10 pr-4 bg-slate-50/90 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-400 outline-none w-52 sm:w-64 transition shadow-xs"
                />
              </div>

              {/* Severity Filter */}
              <div className="relative" ref={severityRef}>
                <button
                  type="button"
                  onClick={() => setSeverityDropdownOpen(!severityDropdownOpen)}
                  className="h-10 flex items-center gap-2 px-3.5 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span>{severityFilter}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {severityDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white border border-slate-200 shadow-lg p-1 z-40 text-xs">
                    {['All Severity', 'Critical', 'Major', 'Minor'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSeverityFilter(opt);
                          setSeverityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition ${
                          severityFilter === opt
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* New Report Button */}
              <button
                type="button"
                onClick={() => navigate('/upload')}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#7c3aed] text-white text-xs sm:text-[13px] font-bold shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_18px_rgba(37,99,235,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Report</span>
              </button>
            </div>
          </div>

          {/* =========================================================
              4 TOP STAT CARDS
              ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Bugs */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1f2] text-[#e11d48] flex items-center justify-center shrink-0 border border-rose-100/70">
                <Bug className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block leading-none">
                  Total Bugs
                </span>
                <span className="text-2xl font-black text-[#0f172a] block leading-tight mt-1">
                  {bugs.length}
                </span>
                <span className="text-[11px] text-slate-400 block leading-none mt-0.5">
                  {bugs.length > 0 ? 'Across all files' : 'No bugs detected'}
                </span>
              </div>
            </div>

            {/* Critical */}
            <div className="p-4 rounded-2xl bg-[#fffbfc] border border-rose-200/70 shadow-xs flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-[#fee2e2] text-[#ef4444] flex items-center justify-center shrink-0 border border-rose-200/80">
                <AlertOctagon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block leading-none">
                  Critical
                </span>
                <span className="text-2xl font-black text-[#0f172a] block leading-tight mt-1">
                  {criticalCount}
                </span>
                <span className="text-[11px] text-slate-400 block leading-none mt-0.5">
                  Need immediate attention
                </span>
              </div>
            </div>

            {/* Major */}
            <div className="p-4 rounded-2xl bg-[#fffdfa] border border-amber-200/70 shadow-xs flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center shrink-0 border border-amber-200/80">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block leading-none">
                  Major
                </span>
                <span className="text-2xl font-black text-[#0f172a] block leading-tight mt-1">
                  {majorCount}
                </span>
                <span className="text-[11px] text-slate-400 block leading-none mt-0.5">
                  Affects functionality
                </span>
              </div>
            </div>

            {/* Minor */}
            <div className="p-4 rounded-2xl bg-[#fbfdff] border border-sky-200/70 shadow-xs flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0 border border-sky-200/80">
                <Info className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block leading-none">
                  Minor
                </span>
                <span className="text-2xl font-black text-[#0f172a] block leading-tight mt-1">
                  {minorCount}
                </span>
                <span className="text-[11px] text-slate-400 block leading-none mt-0.5">
                  Low impact issues
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================
              DETECTED BUGS TABLE SECTION
              ========================================================= */}
          <div className="flex flex-col gap-3">
            {/* Table Header Row: Title on Left, Export on Right */}
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h2 className="text-base font-bold text-[#0f172a] leading-tight">
                  Detected Bugs
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-none">
                  List of bugs found during analysis
                </p>
              </div>

              {/* Export Button */}
              <div className="relative" ref={exportRef}>
                <button
                  type="button"
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {exportDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white border border-slate-200 shadow-lg p-1 z-40 text-xs">
                    <button
                      type="button"
                      onClick={() => setExportDropdownOpen(false)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportDropdownOpen(false)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition"
                    >
                      Export PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[12px] font-bold text-slate-600">
                    <th className="py-3 px-3 w-10">#</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">File Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Detected On</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                          <p className="text-xs font-medium">Scanning analyzed programs for bug reports...</p>
                        </div>
                      </td>
                    </tr>
                  ) : bugs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-14 h-14 rounded-2xl bg-[#fff1f2] text-[#e11d48] flex items-center justify-center mb-3">
                            <Bug className="w-7 h-7 stroke-[2]" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800">No bug reports detected yet</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                            Run execution traces or ML analyses on your Java source files to detect and classify bugs offline.
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate('/upload')}
                            className="mt-4 h-9 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Analyze New Java File</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : displayedBugs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No bug reports match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedBugs.map((bug) => (
                      <tr
                        key={bug.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/analysis/${bug.analysisId}`)}
                      >
                        {/* Number */}
                        <td className="py-3.5 px-3 font-semibold text-slate-700">
                          {bug.id}
                        </td>

                        {/* Title */}
                        <td className="py-3.5 px-3 font-bold text-slate-900 text-[13px]">
                          {bug.title}
                        </td>

                        {/* File Name */}
                        <td className="py-3.5 px-3 text-slate-600 font-mono text-[12px]">
                          {bug.fileName}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-3">
                          {renderTypeBadge(bug.type)}
                        </td>

                        {/* Severity */}
                        <td className="py-3.5 px-3">
                          {renderSeverityBadge(bug.severity)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          {renderStatusBadge(bug.status)}
                        </td>

                        {/* Detected On */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-700 text-xs">
                            {bug.date}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {bug.time}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/analysis/${bug.analysisId}`)}
                              className="w-8 h-8 rounded-lg bg-blue-50/80 text-blue-600 hover:bg-blue-100 border border-blue-100/60 flex items-center justify-center transition cursor-pointer shadow-2xs"
                              title="View Bug Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================
              TABLE FOOTER & PAGINATION
              ========================================================= */}
          {filteredBugs.length > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing{' '}
                <span className="font-bold text-slate-700">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-700">
                  {Math.min(currentPage * itemsPerPage, filteredBugs.length)}
                </span>{' '}
                of <span className="font-bold text-slate-700">{filteredBugs.length}</span> results
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200/80 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition cursor-pointer ${
                      currentPage === pg
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200/80 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BugReports;
