import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserAnalyses } from '../services/api';
import historyBg from '../assets/history-bg.png';
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
  Calendar,
  Eye,
  MoreVertical,
  FileCode2,
  Home,
  ArrowUpDown,
  Bug,
  Cpu,
  Code2,
  UploadCloud,
} from 'lucide-react';
import { TraceFlowMark } from '../components/TraceFlowLogo';

const AnalysisHistory = () => {
  const { user, logout } = useAuth();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const dropdownRef = useRef(null);
  const filterRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const analyses = await getUserAnalyses(user?.id || 0).catch(() => []);
      if (Array.isArray(analyses) && analyses.length > 0) {
        const mapped = analyses.map((a) => {
          const dt = new Date(a.startedAt || a.createdAt || Date.now());
          const hasBug = a.predictedClass && a.predictedClass !== 'NORMAL';
          let type = 'flow';
          if (a.predictedClass) {
            type = hasBug ? 'bug' : 'ml';
          }
          return {
            id: a.id,
            fileName: a.project?.name || a.project?.fileName || (a.sourceCode ? 'Program.java' : `Analysis #${a.id}`),
            path: a.project?.name ? 'src/main/java/' : 'workspace/local/',
            analysisType: type,
            status: a.status || 'Completed',
            bugsFound: hasBug ? (a.staticIssues?.length || (a.predictedClass === 'INFINITE_LOOP' ? 2 : 1)) : 0,
            predictedClass: a.predictedClass || 'NORMAL',
            date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            rawDate: dt.getTime(),
          };
        });

        // Sort by newest first
        mapped.sort((a, b) => b.rawDate - a.rawDate || b.id - a.id);
        setHistoryItems(mapped);
      } else {
        setHistoryItems([]);
      }
    } catch (err) {
      console.error('Failed to load analysis history', err);
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const displayName = user?.username || 'ashu';
  const initial = displayName.charAt(0).toUpperCase();

  // Filter items based on search query and time filter
  const filteredItems = historyItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      item.fileName.toLowerCase().includes(q) ||
      item.path.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q) ||
      (item.analysisType === 'flow' && 'execution flow'.includes(q)) ||
      (item.analysisType === 'bug' && 'bug detection'.includes(q)) ||
      (item.analysisType === 'ml' && 'ml classification'.includes(q))
    );

    if (!matchesSearch) return false;

    if (timeFilter === 'Today') {
      const oneDay = 24 * 60 * 60 * 1000;
      return Date.now() - item.rawDate < oneDay;
    }
    if (timeFilter === 'This Week') {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      return Date.now() - item.rawDate < oneWeek;
    }
    if (timeFilter === 'This Month') {
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      return Date.now() - item.rawDate < oneMonth;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'bug':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] text-[#e11d48] border border-rose-200/60 text-[11.5px] font-bold">
            <Bug className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Bug Detection</span>
          </span>
        );
      case 'ml':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf5ff] text-[#9333ea] border border-purple-200/60 text-[11.5px] font-bold">
            <Cpu className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>ML Classification</span>
          </span>
        );
      case 'flow':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4ff] text-[#2563eb] border border-blue-200/60 text-[11.5px] font-bold">
            <Code2 className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Execution Flow</span>
          </span>
        );
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] text-[#059669] border border-emerald-200/60 text-[11.5px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Completed</span>
        </span>
      );
    }
    if (status === 'Failed' || status === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] text-[#e11d48] border border-rose-200/60 text-[11.5px] font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Failed</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-[11.5px] font-bold">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div
      className="history-root"
      style={{ backgroundImage: `url(${historyBg})` }}
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
            <TraceFlowMark className="w-9 h-9 shrink-0" idPrefix="hist-logo" />

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

            <Link to="/history" className="dashboard-nav-item active">
              <History className="w-[18px] h-[18px] shrink-0" />
              <span>Analysis History</span>
            </Link>

            <Link to="/reports" className="dashboard-nav-item">
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
      <main className="history-main">
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
            <span className="text-slate-900 font-bold">Analysis History</span>
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
        <div className="history-card">
          {/* Card Top Header: Title with Icon on Left, Search + Filter on Right */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#eef4ff] text-[#2563eb] flex items-center justify-center shrink-0 border border-blue-100/80 shadow-xs">
                <History className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h1 className="text-[22px] sm:text-[24px] font-black text-[#0f172a] tracking-tight leading-tight">
                  Analysis History
                </h1>
                <p className="text-xs text-slate-400 font-normal mt-0.5 leading-none">
                  Complete record of your JDI execution traces &amp; ML classifications
                </p>
              </div>
            </div>

            {/* Right Search Input and Filter */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by file name, type, or status..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 pl-10 pr-4 bg-slate-50/90 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-400 outline-none w-56 sm:w-72 transition shadow-xs"
                />
              </div>

              {/* Time Range Filter */}
              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="h-10 flex items-center gap-2 px-3.5 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{timeFilter}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {filterDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white border border-slate-200 shadow-lg p-1 z-40 text-xs">
                    {['All Time', 'Today', 'This Week', 'This Month'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setTimeFilter(opt);
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition ${
                          timeFilter === opt
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
            </div>
          </div>

          {/* =========================================================
              DATA TABLE
              ========================================================= */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[12px] font-bold text-slate-600">
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1 cursor-pointer select-none">
                      <span>File Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1 cursor-pointer select-none">
                      <span>Analysis Type</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1 cursor-pointer select-none">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1 cursor-pointer select-none">
                      <span>Bugs Found</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1 cursor-pointer select-none">
                      <span>Analyzed On</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                        <p className="text-xs font-medium">Loading analysis records from database...</p>
                      </div>
                    </td>
                  </tr>
                ) : historyItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#eef4ff] text-[#2563eb] flex items-center justify-center mb-3">
                          <History className="w-7 h-7 stroke-[2]" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">No analysis runs recorded yet</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                          Upload a .java file or run IntelliTrace debugger to generate real-time execution flows and ML bug classifications.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/upload')}
                          className="mt-4 h-9 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Analyze Your First File</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No analysis runs match your search filters.
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/analysis/${item.id}`)}
                    >
                      {/* File Name Column */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#eef4ff] text-[#2563eb] flex items-center justify-center shrink-0 border border-blue-100/70">
                            <FileCode2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-[13.5px]">
                              {item.fileName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {item.path}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Analysis Type */}
                      <td className="py-3.5 px-3">
                        {renderTypeBadge(item.analysisType)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Bugs Found */}
                      <td className="py-3.5 px-3 font-semibold text-slate-700 text-[13.5px]">
                        {item.bugsFound !== null && item.bugsFound !== undefined ? item.bugsFound : '-'}
                      </td>

                      {/* Analyzed On */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-700 text-xs">
                          {item.date}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.time}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/analysis/${item.id}`)}
                            className="w-8 h-8 rounded-lg bg-blue-50/80 text-blue-600 hover:bg-blue-100 border border-blue-100/60 flex items-center justify-center transition cursor-pointer shadow-2xs"
                            title="View Analysis Studio"
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

          {/* =========================================================
              TABLE FOOTER & PAGINATION
              ========================================================= */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing{' '}
                <span className="font-bold text-slate-700">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-700">
                  {Math.min(currentPage * itemsPerPage, filteredItems.length)}
                </span>{' '}
                of <span className="font-bold text-slate-700">{filteredItems.length}</span> results
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

export default AnalysisHistory;
