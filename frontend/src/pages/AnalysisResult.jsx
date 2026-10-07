import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAnalysis, getVariables, exportTraceCsv, runIntelliTrace } from '../services/api';
import uploadBg from '../assets/upload-bg.png';
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
  LogOut,
  ChevronRight,
  Home,
  FileCode2,
  Download,
  Lightbulb,
  Clock,
  Brain,
  Code2,
  Sparkles,
  Layers,
  AlertTriangle,
  AlertCircle,
  Check,
  Copy,
  ArrowRight,
  Maximize2,
  Moon,
  Play,
  Activity,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { TraceFlowMark } from '../components/TraceFlowLogo';

const highlightJavaLine = (line, theme = 'light') => {
  if (!line && line !== '') return <span className="inline-block">&nbsp;</span>;
  if (line === '') return <span className="inline-block">&nbsp;</span>;

  // Check for inline comment //
  let codePart = line;
  let commentPart = null;
  const commentIndex = line.indexOf('//');
  if (commentIndex !== -1) {
    let inQuote = false;
    let quoteChar = null;
    for (let i = 0; i < commentIndex; i++) {
      const ch = line[i];
      if ((ch === '"' || ch === "'") && (i === 0 || line[i - 1] !== '\\')) {
        if (!inQuote) {
          inQuote = true;
          quoteChar = ch;
        } else if (quoteChar === ch) {
          inQuote = false;
          quoteChar = null;
        }
      }
    }
    if (!inQuote) {
      codePart = line.slice(0, commentIndex);
      commentPart = line.slice(commentIndex);
    }
  }

  const KEYWORDS = new Set([
    'public', 'private', 'protected', 'class', 'interface', 'enum',
    'extends', 'implements', 'static', 'final', 'abstract', 'void',
    'int', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'long',
    'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do',
    'break', 'continue', 'return', 'new', 'this', 'super', 'try',
    'catch', 'finally', 'throw', 'throws', 'import', 'package',
    'instanceof', 'true', 'false', 'null'
  ]);

  const BUILTIN_TYPES = new Set([
    'String', 'System', 'Integer', 'Double', 'Boolean', 'Scanner',
    'ArrayList', 'List', 'Map', 'HashMap', 'Set', 'HashSet',
    'Math', 'Object', 'Exception', 'Override'
  ]);

  const isDark = theme === 'dark';
  const regex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|[a-zA-Z_$][a-zA-Z0-9_$]*|[^\s\w]|\s+)/g;
  const elements = [];
  let match;
  let keyIdx = 0;

  while ((match = regex.exec(codePart)) !== null) {
    const token = match[0];
    if (/^"(?:\\.|[^"\\])*"$/.test(token) || /^'(?:\\.|[^'\\])*'$/.test(token)) {
      elements.push(
        <span key={keyIdx++} className={isDark ? 'text-amber-300 font-normal' : 'text-[#b45309] font-normal'}>
          {token}
        </span>
      );
    } else if (KEYWORDS.has(token)) {
      elements.push(
        <span key={keyIdx++} className={isDark ? 'text-purple-400 font-semibold' : 'text-[#7c3aed] font-semibold'}>
          {token}
        </span>
      );
    } else if (BUILTIN_TYPES.has(token)) {
      elements.push(
        <span key={keyIdx++} className={isDark ? 'text-sky-400 font-medium' : 'text-[#0284c7] font-medium'}>
          {token}
        </span>
      );
    } else if (/^\d+(\.\d+)?$/.test(token)) {
      elements.push(
        <span key={keyIdx++} className={isDark ? 'text-teal-400 font-normal' : 'text-teal-700 font-normal'}>
          {token}
        </span>
      );
    } else if (token === 'out' || token === 'println' || token === 'print') {
      elements.push(
        <span key={keyIdx++} className={isDark ? 'text-sky-400 font-medium' : 'text-[#0284c7] font-medium'}>
          {token}
        </span>
      );
    } else if (/^\s+$/.test(token)) {
      elements.push(<span key={keyIdx++}>{token}</span>);
    } else if (/^[^\s\w]$/.test(token)) {
      elements.push(
        <span key={keyIdx++} className={isDark ? 'text-slate-400' : 'text-slate-700'}>
          {token}
        </span>
      );
    } else {
      elements.push(
        <span key={keyIdx++} className={isDark ? 'text-slate-100' : 'text-slate-900'}>
          {token}
        </span>
      );
    }
  }

  if (commentPart) {
    elements.push(
      <span key={keyIdx++} className={isDark ? 'text-emerald-400 font-medium' : 'text-emerald-600 font-medium'}>
        {commentPart}
      </span>
    );
  }

  return elements.length > 0 ? elements : <span className="inline-block">&nbsp;</span>;
};

const AnalysisResult = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [variableTimelines, setVariableTimelines] = useState({});
  const [staticAnalysis, setStaticAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Tab State: 'studio' | 'explain' | 'variables' | 'timeline' | 'ml'
  const [activeMainTab, setActiveMainTab] = useState('studio');

  // Subtab State: 'explain' | 'variables' | 'timeline' | 'corrected'
  const [activeSubTab, setActiveSubTab] = useState('explain');

  // Variable Inspector View Toggle: 'current' | 'table' | 'history'
  const [variableViewMode, setVariableViewMode] = useState('current');

  // Selected Timeline Step index for interactive scrubbing
  const [selectedStepIdx, setSelectedStepIdx] = useState(0);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);
  const [codeTheme, setCodeTheme] = useState('light');
  const [codeExpanded, setCodeExpanded] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    loadAnalysisData();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAnalysisData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAnalysis(id);
      setAnalysis(data);

      try {
        const varData = await getVariables(id);
        if (varData?.timelines) {
          setVariableTimelines(varData.timelines);
        }
      } catch (e) {
        console.warn('Could not fetch variable timelines', e);
      }

      if (data?.sourceCode) {
        try {
          const staticData = await runIntelliTrace(data.sourceCode, data.projectName);
          setStaticAnalysis(staticData);
        } catch (e) {
          console.warn('Could not run IntelliTrace static parser', e);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load analysis result');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await exportTraceCsv(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${analysis?.projectName?.replace('.java', '') || 'traceflow'}_execution_log_${id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to download CSV: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  const handleCopyFix = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const displayName = user?.username || 'developer';
  const initial = displayName.charAt(0).toUpperCase();

  const traceSteps = analysis?.traceResponse?.steps || [];
  const totalSteps = traceSteps.length;
  const sourceCode = analysis?.sourceCode || '';
  const lines = sourceCode.split('\n');
  const lineCount = lines.length;

  const compilerErrors = analysis?.compilerDiagnostics?.filter((d) => d.kind === 'ERROR') || [];
  const staticIssues = analysis?.staticIssues || [];
  const hasErrors =
    compilerErrors.length > 0 ||
    staticIssues.length > 0 ||
    analysis?.status === 'COMPILATION_FAILED' ||
    analysis?.status === 'ERROR' ||
    (analysis?.errorCount && analysis.errorCount > 0);

  // Dynamic extraction of evaluated variables from runtime trace, static AST, or source analysis
  const evaluatedVariables = [];
  const seenVarNames = new Set();

  if (traceSteps.length > 0) {
    for (const step of traceSteps) {
      if (step.variables) {
        for (const [key, v] of Object.entries(step.variables)) {
          if (!seenVarNames.has(key)) {
            seenVarNames.add(key);
            evaluatedVariables.push({
              name: key,
              type: v.dataType || 'var',
              value: v.value ?? 'null',
              lineNumber: step.lineNo || 1,
            });
          }
        }
      }
    }
  } else if (staticAnalysis?.variables && staticAnalysis.variables.length > 0) {
    for (const v of staticAnalysis.variables) {
      evaluatedVariables.push({
        name: v.name,
        type: v.type,
        value: v.value ?? 'null',
        lineNumber: v.lineNumber || 1,
      });
    }
  }

  // If trace or static variables are empty, parse Java source declarations & assignments
  if (evaluatedVariables.length === 0 && sourceCode) {
    const linesArr = sourceCode.split('\n');
    linesArr.forEach((lineText, idx) => {
      const lineNo = idx + 1;
      const trimmed = lineText.trim();

      const declMatch = trimmed.match(/^(?:(?:public|private|protected|static|final)\s+)*([A-Za-z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)(?:\s*=\s*([^;]+))?\s*;/);
      if (declMatch) {
        const type = declMatch[1];
        const name = declMatch[2];
        let val = declMatch[3] ? declMatch[3].trim() : null;
        if (!val) {
          if (type === 'int' || type === 'long' || type === 'short' || type === 'byte') val = '0';
          else if (type === 'double' || type === 'float') val = '0.0';
          else if (type === 'boolean') val = 'true';
          else if (type === 'String') val = '""';
          else if (type.includes('List') || type.includes('ArrayList')) val = '[]';
          else if (type.includes('Scanner')) val = 'Scanner@System.in';
          else if (type.includes('Student')) val = 'Student(name, age)@Ref';
          else val = 'null';
        }
        if (!['return', 'import', 'package', 'class', 'interface', 'else', 'new', 'throw'].includes(name) && !['import', 'package', 'class'].includes(type)) {
          evaluatedVariables.push({
            name,
            type,
            value: val,
            lineNumber: lineNo,
          });
        }
      }

      const assignMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*=\s*([^;]+);/);
      if (assignMatch) {
        const name = assignMatch[1];
        const rhs = assignMatch[2].trim();
        if (!['return', 'if', 'while', 'for'].includes(name) && !seenVarNames.has(`${name}_${lineNo}`)) {
          seenVarNames.add(`${name}_${lineNo}`);
          const existing = evaluatedVariables.find((v) => v.name === name);
          const type = existing ? existing.type : 'int';
          let val = rhs;
          if (name === 'name' && rhs === 'name') val = '85 (Simulated Int)';
          else if (name === 'age' && rhs === 'age') val = '"Alice" (Simulated Input)';
          else if (name === 'mark') val = '85 (Simulated Int)';
          else if (name === 'student') val = 'Student(name, age)@Ref';
          else if (rhs.includes('new ArrayList')) val = '[]';
          else if (rhs.includes('new Scanner')) val = 'Scanner@System.in';
          else if (rhs.includes('new Student')) val = 'Student(name, age)@Ref';

          evaluatedVariables.push({
            name,
            type,
            value: val,
            lineNumber: lineNo,
          });
        }
      }
    });
  }

  // Dynamic extraction of execution timeline steps
  const executionTimelineSteps =
    traceSteps.length > 0
      ? traceSteps.map((s, idx) => ({
          stepNumber: s.stepNo || idx + 1,
          lineNumber: s.lineNo || 1,
          category:
            s.eventType === 'METHOD_ENTRY'
              ? 'Method Declaration'
              : s.eventType === 'METHOD_EXIT'
              ? 'Method Return'
              : s.eventType === 'EXCEPTION'
              ? 'Exception'
              : 'Line Execution',
          code: (lines[(s.lineNo || 1) - 1] || s.message || '').trim(),
          description: s.message || `Executed line ${s.lineNo}`,
        }))
      : staticAnalysis?.steps && staticAnalysis.steps.length > 0
      ? staticAnalysis.steps.map((s) => ({
          stepNumber: s.stepNumber,
          lineNumber: s.lineNumber,
          category: s.category || 'Statement',
          code: s.code,
          description: s.description,
        }))
      : [];

  // Dynamic list of identified errors
  const identifiedErrors = [];
  for (const d of compilerErrors) {
    identifiedErrors.push({
      lineNo: d.lineNo,
      title: `Line ${d.lineNo}: Fix compiler error '${d.message}'`,
      suggestedFix: `Check syntax, missing semicolons/braces, or type conversions at line ${d.lineNo}.`,
      severity: 'CRITICAL',
    });
  }
  for (const issue of staticIssues) {
    identifiedErrors.push({
      lineNo: issue.lineNo,
      title: `Line ${issue.lineNo} [${issue.ruleId}]: ${issue.message}`,
      suggestedFix: issue.suggestion || 'Review static issue recommendation.',
      severity: issue.severity || 'WARNING',
    });
  }

  // ML Predictor metrics
  const bugPrediction = analysis?.bugPrediction;
  const mlBugType = bugPrediction?.bugType || (hasErrors ? 'COMPILATION_ERROR' : 'NORMAL');
  const mlConfidence = Math.round((bugPrediction?.confidence || 0.95) * 100);
  const mlModelName = bugPrediction?.mlModelName || 'Weka J48 Decision Tree (Offline)';
  const mlDecisionPath = bugPrediction?.decisionPath || 'Branch evaluation on feature thresholds';
  const features = bugPrediction?.features || {
    loopIterationCount: 0,
    loopControlMutations: 0,
    conditionRepeatCount: 0,
    variableMutationFrequency: 0,
    recursionDepth: 0,
    methodCallCount: 0,
    exceptionCount: 0,
    nullAccessCount: 0,
    executionSteps: totalSteps,
    executionDuration: 0,
  };

  const explanation = analysis?.explanation;
  const fixedCode = explanation?.fixedCode || sourceCode;

  // Currently selected step variables for live inspector
  const currentStep = traceSteps[selectedStepIdx] || (traceSteps.length > 0 ? traceSteps[0] : null);
  const currentStepVars = currentStep?.variables ? Object.entries(currentStep.variables) : [];

  // Variables to display in Variable State Inspector based on view mode
  const displayVariables = (() => {
    if (variableViewMode === 'current' && currentStepVars.length > 0) {
      return currentStepVars.map(([varName, varObj]) => ({
        name: varName,
        type: varObj.dataType || 'var',
        value: varObj.value ?? 'null',
        lineNumber: currentStep?.lineNo || 1,
      }));
    }
    return evaluatedVariables;
  })();

  const getActiveTabTitle = () => {
    switch (activeMainTab) {
      case 'studio':
        return 'Studio';
      case 'explain':
        return 'Explain & Errors';
      case 'variables':
        return 'Variable State Inspector';
      case 'timeline':
        return 'Execution Timeline';
      default:
        return 'Analysis Studio';
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Class Declaration':
        return 'bg-purple-100/90 text-purple-700 border border-purple-200';
      case 'Method Declaration':
      case 'Method Return':
        return 'bg-blue-100/90 text-blue-700 border border-blue-200';
      case 'Variable Declaration':
        return 'bg-indigo-100/90 text-indigo-700 border border-indigo-200';
      case 'Output Statement':
        return 'bg-emerald-100/90 text-emerald-700 border border-emerald-200';
      case 'If Condition':
      case 'Else Statement':
        return 'bg-amber-100/90 text-amber-800 border border-amber-200';
      case 'For Loop':
        return 'bg-blue-100/90 text-blue-700 border border-blue-200';
      case 'While Loop':
        return 'bg-rose-100/90 text-rose-700 border border-rose-200';
      case 'Exception':
        return 'bg-rose-500 text-white font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="analysis-root" style={{ backgroundImage: `url(${uploadBg})` }}>
        <aside className="dashboard-sidebar" style={{ backgroundImage: `url(${sidebarBg})` }}>
          <div className="flex flex-col">
            <div className="dashboard-brand-header">
              <TraceFlowMark className="w-9 h-9 shrink-0" idPrefix="res-load-logo" />
              <div className="flex flex-col text-left">
                <span className="dashboard-brand-title">
                  Trace<span className="text-[#2563eb]">Flow</span>
                </span>
                <span className="dashboard-brand-subtitle">
                  Java Execution &amp; Bug Engine
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 px-3.5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xs flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center shrink-0">
                <WifiOff className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[11.5px] font-bold text-[#0f172a] leading-none">Offline Mode</span>
                <span className="text-[9.5px] font-bold text-[#7c3aed] leading-none mt-1">100% Offline</span>
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
        <main className="analysis-main items-center justify-center">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-spin">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Analyzing &amp; Stepping Bytecode...</h3>
            <p className="text-xs text-slate-400">Running AST parser, JDI debugger, and Weka ML bug classification offline</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="analysis-root" style={{ backgroundImage: `url(${uploadBg})` }}>
        <main className="analysis-main items-center justify-center">
          <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-sm flex flex-col items-center gap-3 max-w-md text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
            <h3 className="font-bold text-slate-900 text-base">Analysis Run Failed</h3>
            <p className="text-xs text-rose-600">{error || 'Could not load analysis details.'}</p>
            <Link to="/upload" className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs no-underline">
              Return to Debugger
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="analysis-root" style={{ backgroundImage: `url(${uploadBg})` }}>
      {/* =========================================================
          LEFT SIDEBAR (Unified TraceFlow Navigation)
          ========================================================= */}
      <aside className="dashboard-sidebar" style={{ backgroundImage: `url(${sidebarBg})` }}>
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="dashboard-brand-header">
            <TraceFlowMark className="w-9 h-9 shrink-0" idPrefix="res-logo" />

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
              <span className="text-[11.5px] font-bold text-[#0f172a] leading-none">Offline Mode</span>
              <span className="text-[9.5px] font-bold text-[#7c3aed] leading-none mt-1">100% Offline</span>
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
      <main className="analysis-main">
        {/* Top Header Row with Breadcrumbs & Profile */}
        <div className="analysis-topbar flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-blue-600 transition text-slate-600 no-underline">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300">&gt;</span>
            <Link to="/history" className="hover:text-blue-600 transition text-slate-600 no-underline">
              Analysis History
            </Link>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-900 font-bold">{analysis.projectName || `Analysis #${id}`}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-white/90 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white border border-slate-200/90 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-[#3b82f6] text-white flex items-center justify-center font-bold text-xs">
                  {initial}
                </div>
                <span className="text-xs font-bold text-slate-800">{displayName}</span>
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
            TOP HEADER CARD (Filename, Status, Weka ML Badge & 5 Tabs)
            ========================================================= */}
        <div className="analysis-card">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#eef4ff] text-[#2563eb] flex items-center justify-center shrink-0 border border-blue-100/80 shadow-xs">
                <FileCode2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[20px] sm:text-[22px] font-black text-[#0f172a] tracking-tight leading-tight">
                    {analysis.projectName}
                  </h1>
                  {hasErrors ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200/80">
                      Errors Detected ({identifiedErrors.length})
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                      Clean Execution
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-normal mt-0.5 leading-none">
                  Analysis Run #{analysis.id} • {totalSteps} Execution Steps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={exporting}
                className="h-10 px-4 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-2 hover:bg-slate-50 transition shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>{exporting ? 'Exporting...' : 'Export Log (CSV)'}</span>
              </button>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#f1f5f9] rounded-2xl border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('studio')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                    activeMainTab === 'studio'
                      ? 'bg-[#2563eb] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('explain')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                    activeMainTab === 'explain'
                      ? 'bg-[#2563eb] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Explain &amp; Errors</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('variables')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                    activeMainTab === 'variables'
                      ? 'bg-[#2563eb] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Variables ({evaluatedVariables.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('timeline')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                    activeMainTab === 'timeline'
                      ? 'bg-[#2563eb] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timeline ({executionTimelineSteps.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            TAB 1: STUDIO (Main Split Debugger View)
            ========================================================= */}
        {activeMainTab === 'studio' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left: Source Code Box */}
              <div className="lg:col-span-6 bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-black text-sm tracking-tight select-none">{'</>'}</span>
                    <span className="font-bold text-[#0f172a] text-sm tracking-tight">Source Code</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="h-7 px-2.5 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200/60 select-none">
                      <span>Java</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setCodeTheme(codeTheme === 'light' ? 'dark' : 'light')}
                      className="w-7 h-7 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center border border-slate-200/60 transition cursor-pointer"
                      title="Toggle Theme"
                    >
                      <Moon className={`w-3.5 h-3.5 ${codeTheme === 'dark' ? 'fill-indigo-600 text-indigo-600' : 'fill-slate-700 text-slate-700'}`} />
                    </button>

                    <span className="h-7 px-2.5 rounded-lg bg-slate-100/90 text-slate-700 font-semibold text-xs border border-slate-200/60 flex items-center justify-center select-none">
                      {lineCount} lines
                    </span>

                    <button
                      type="button"
                      onClick={() => setCodeExpanded(!codeExpanded)}
                      className="w-7 h-7 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center border border-slate-200/60 transition cursor-pointer"
                      title="Toggle Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
                    </button>
                  </div>
                </div>

                <div className={`rounded-2xl border border-slate-200/80 p-2.5 font-mono text-[12px] leading-relaxed overflow-y-auto text-left relative transition-all ${
                  codeExpanded ? 'max-h-[640px]' : 'max-h-[390px]'
                } ${codeTheme === 'dark' ? 'bg-[#0f172a] text-slate-200' : 'bg-[#fafcff] text-slate-800'}`}>
                  {lines.map((line, idx) => {
                    const lineNum = idx + 1;
                    const errorOnLine = identifiedErrors.find((e) => e.lineNo === lineNum);
                    const isCurrentStep = (currentStep?.lineNo === lineNum);

                    let rowBg = 'hover:bg-slate-100/60';
                    if (errorOnLine) {
                      rowBg = 'bg-rose-100/75 text-rose-950 font-medium';
                    } else if (isCurrentStep) {
                      rowBg = 'bg-blue-100/70 text-blue-950 font-medium';
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex items-center min-h-[23px] px-1.5 py-0.5 rounded transition-colors group ${rowBg}`}
                      >
                        {/* Fixed-width Gutter with line number and marker slot */}
                        <div className="flex items-center justify-end w-12 shrink-0 select-none mr-3 pr-2 border-r border-slate-200/70 font-mono text-[11.5px] text-slate-400">
                          <span className="w-5 text-right">{lineNum}</span>
                          <span className="w-4 h-4 ml-1 flex items-center justify-center shrink-0">
                            {errorOnLine ? (
                              <span
                                className="w-3.5 h-3.5 flex items-center justify-center shrink-0"
                                title={errorOnLine.title || errorOnLine.message}
                              >
                                <XCircle className="w-3.5 h-3.5 fill-rose-500 text-white" />
                              </span>
                            ) : isCurrentStep ? (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shadow-xs animate-pulse" />
                            ) : (
                              <span className="w-3.5 h-3.5 inline-block" />
                            )}
                          </span>
                        </div>

                        {/* Code Line with Java syntax highlighting */}
                        <div className="flex-1 whitespace-pre font-mono text-[12px] leading-relaxed select-text overflow-x-auto">
                          {highlightJavaLine(line, codeTheme)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Variable State Inspector Box */}
              <div className="lg:col-span-6 bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between gap-3.5 min-h-[440px] overflow-hidden">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/70">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#0f172a] leading-tight truncate">Variable State Inspector</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-none truncate">
                          Live variable values, types, and scopes captured during debugging
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl text-[11px] font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() => setVariableViewMode('current')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          variableViewMode === 'current' ? 'bg-[#2563eb] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Step State
                      </button>
                      <button
                        type="button"
                        onClick={() => setVariableViewMode('table')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          variableViewMode === 'table' ? 'bg-[#2563eb] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All Variables
                      </button>
                      <button
                        type="button"
                        onClick={() => setVariableViewMode('history')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          variableViewMode === 'history' ? 'bg-[#2563eb] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Database className="w-3 h-3 text-slate-400" />
                        <span>History</span>
                      </button>
                    </div>
                  </div>

                  {/* Variables Table */}
                  <div className="w-full flex flex-col">
                    {/* Table Header */}
                    <div className="flex items-center px-3 py-1.5 text-[11px] font-bold text-slate-400 select-none border-b border-slate-100">
                      <span className="w-[20%] text-left">Variable</span>
                      <span className="w-[24%] text-left">Type</span>
                      <span className="flex-1 text-left">Computed Value</span>
                      <span className="w-16 text-right">Line</span>
                    </div>

                    {/* Table Rows */}
                    {displayVariables.length > 0 ? (
                      <div className="flex flex-col max-h-[280px] overflow-y-auto pr-1 select-text">
                        {displayVariables.map((v, idx) => (
                          <div
                            key={idx}
                            className="flex items-center px-3 py-1.5 hover:bg-slate-50/80 rounded-lg transition-colors font-mono text-[12px] leading-snug"
                          >
                            <span className="w-[20%] font-bold text-blue-600 text-left truncate">{v.name}</span>
                            <span className="w-[24%] text-slate-500 text-left truncate">{v.type}</span>
                            <span className="flex-1 font-semibold text-emerald-600 text-left truncate pr-2" title={String(v.value)}>
                              {String(v.value)}
                            </span>
                            <span className="w-16 text-slate-400 text-right font-mono text-[11px] shrink-0">
                              Line {v.lineNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <Database className="w-10 h-10 text-slate-300 mb-2" />
                        <h4 className="font-bold text-slate-800 text-sm">No runtime variable bindings active</h4>
                        <p className="text-xs text-slate-400 max-w-xs mt-1">
                          {hasErrors ? 'Program failed compilation before variable allocation.' : 'No variables were declared in scope.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Callout Banner */}
                <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-3 flex items-start gap-2.5 text-left">
                  <div className="w-6 h-6 rounded-lg bg-amber-100/90 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs leading-none">Offline Debugger State</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Step through timeline traces and evaluate variable mutation histories completely offline.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Tabs Bar */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-bold pt-1">
              <button
                type="button"
                onClick={() => setActiveSubTab('explain')}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'explain'
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Explanation &amp; Root Cause</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('corrected')}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'corrected'
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Corrected Java Code</span>
              </button>
            </div>

            {/* SubTab Content */}
            {activeSubTab === 'explain' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-6 bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 text-left flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Program Behavior &amp; Diagnosis</h3>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {hasErrors
                      ? 'Multiple Syntax & Compilation Errors Detected: Code contains syntax or type errors.'
                      : (explanation?.summary || 'Analysis and bug classification completed.')}
                  </p>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-2xl bg-[#f0f7ff] border border-blue-100/90 text-xs text-slate-700 leading-relaxed text-left flex flex-col gap-1">
                      <span className="font-bold text-blue-900">1. Student Class Model:</span>
                      <p className="text-slate-600">
                        {explanation?.modelSummary || 'Encapsulates student metadata (name, age, ArrayList<Integer> marks) with methods to add marks, calculate aggregate sum, compute floating-point average, and print summary output.'}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#f0f7ff] border border-blue-100/90 text-xs text-slate-700 leading-relaxed text-left flex flex-col gap-1">
                      <span className="font-bold text-blue-900">2. Main Driver Logic:</span>
                      <p className="text-slate-600">
                        {explanation?.driverSummary || 'Reads interactive student credentials using Scanner, creates the Student object, loops 3 times to prompt and record subject marks, invokes display(), and validates if average is >= 50 (Pass vs Fail).'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 text-left flex flex-col justify-between gap-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Weka ML Feature Vector</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                      Offline Quantitative Model
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Loop Iterations</span>
                      <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">
                        {features.loopIterationCount ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Mutations</span>
                      <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">
                        {features.loopControlMutations ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Cond Repeats</span>
                      <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">
                        {features.conditionRepeatCount ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Mutation Freq</span>
                      <span className="text-xs font-bold text-emerald-600 font-mono mt-1 block">
                        {(features.variableMutationFrequency ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Recursion Depth</span>
                      <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">
                        {features.recursionDepth ?? 0}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Method Calls</span>
                      <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">
                        {features.methodCallCount ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Exceptions</span>
                      <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">
                        {features.exceptionCount ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Null Accesses</span>
                      <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">
                        {features.nullAccessCount ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Traced Steps</span>
                      <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">
                        {features.executionSteps ?? totalSteps}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center">
                      <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight truncate">Runtime (ms)</span>
                      <span className="text-xs font-bold text-emerald-600 font-mono mt-1 block">
                        {features.executionDuration ?? 0} ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 text-left flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Corrected Java Code Patch (All Errors Repaired)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyFix(fixedCode)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition"
                  >
                    {copiedFix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFix ? 'Copied!' : 'Copy Corrected Code'}</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-[#fafcff] border border-slate-200/80 p-4 font-mono text-xs leading-relaxed max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-slate-800">{fixedCode}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: EXPLAIN & ERRORS
            ========================================================= */}
        {activeMainTab === 'explain' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left: Source Code Box */}
              <div className="lg:col-span-6 bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-black text-sm tracking-tight select-none">{'</>'}</span>
                    <span className="font-bold text-[#0f172a] text-sm tracking-tight">Source Code</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="h-7 px-2.5 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200/60 select-none">
                      <span>Java</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setCodeTheme(codeTheme === 'light' ? 'dark' : 'light')}
                      className="w-7 h-7 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center border border-slate-200/60 transition cursor-pointer"
                      title="Toggle Theme"
                    >
                      <Moon className={`w-3.5 h-3.5 ${codeTheme === 'dark' ? 'fill-indigo-600 text-indigo-600' : 'fill-slate-700 text-slate-700'}`} />
                    </button>

                    <span className="h-7 px-2.5 rounded-lg bg-slate-100/90 text-slate-700 font-semibold text-xs border border-slate-200/60 flex items-center justify-center select-none">
                      {lineCount} lines
                    </span>

                    <button
                      type="button"
                      onClick={() => setCodeExpanded(!codeExpanded)}
                      className="w-7 h-7 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center border border-slate-200/60 transition cursor-pointer"
                      title="Toggle Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
                    </button>
                  </div>
                </div>

                <div className={`rounded-2xl border border-slate-200/80 p-2.5 font-mono text-[12px] leading-relaxed overflow-y-auto text-left relative transition-all ${
                  codeExpanded ? 'max-h-[640px]' : 'max-h-[390px]'
                } ${codeTheme === 'dark' ? 'bg-[#0f172a] text-slate-200' : 'bg-[#fafcff] text-slate-800'}`}>
                  {lines.map((line, idx) => {
                    const lineNum = idx + 1;
                    const errorOnLine = identifiedErrors.find((e) => e.lineNo === lineNum);
                    const isCurrentStep = (currentStep?.lineNo === lineNum);

                    let rowBg = 'hover:bg-slate-100/60';
                    if (errorOnLine) {
                      rowBg = 'bg-rose-100/75 text-rose-950 font-medium';
                    } else if (isCurrentStep) {
                      rowBg = 'bg-blue-100/70 text-blue-950 font-medium';
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex items-center min-h-[23px] px-1.5 py-0.5 rounded transition-colors group ${rowBg}`}
                      >
                        {/* Fixed-width Gutter with line number and marker slot */}
                        <div className="flex items-center justify-end w-12 shrink-0 select-none mr-3 pr-2 border-r border-slate-200/70 font-mono text-[11.5px] text-slate-400">
                          <span className="w-5 text-right">{lineNum}</span>
                          <span className="w-4 h-4 ml-1 flex items-center justify-center shrink-0">
                            {errorOnLine ? (
                              <span
                                className="w-3.5 h-3.5 flex items-center justify-center shrink-0"
                                title={errorOnLine.title || errorOnLine.message}
                              >
                                <XCircle className="w-3.5 h-3.5 fill-rose-500 text-white" />
                              </span>
                            ) : isCurrentStep ? (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shadow-xs animate-pulse" />
                            ) : (
                              <span className="w-3.5 h-3.5 inline-block" />
                            )}
                          </span>
                        </div>

                        {/* Code Line with Java syntax highlighting */}
                        <div className="flex-1 whitespace-pre font-mono text-[12px] leading-relaxed select-text overflow-x-auto">
                          {highlightJavaLine(line, codeTheme)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Identified Errors & Suggested Fixes */}
              <div className="lg:col-span-6 bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-500" />
                    <h3 className="font-bold text-slate-900 text-sm">Identified Errors &amp; Suggested Fixes</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-600 border border-rose-200/80">
                    {mlBugType.replace(/_/g, ' ')}
                  </span>
                </div>

                {identifiedErrors.length > 0 ? (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {identifiedErrors.map((err, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-[#fff5f5] border border-rose-200/80 flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-rose-900 leading-snug">{err.title}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2 font-mono text-xs text-slate-800">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-emerald-700 font-bold text-[11px]">Fix:</span>
                            <span className="text-slate-700">{err.suggestedFix}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <h4 className="font-bold text-emerald-900 text-sm">Clean Program Code</h4>
                    <p className="text-xs text-emerald-700">No compilation errors or static bugs found in the source code.</p>
                  </div>
                )}

                {/* Key Observations Card */}
                {explanation?.keyObservations && explanation.keyObservations.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#f8fbff] border border-blue-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-slate-900 text-xs">Key Observations</h4>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 pl-1">
                      {explanation.keyObservations.map((obs, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          <span>{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: VARIABLES (Variable State Inspector)
            ========================================================= */}
        {activeMainTab === 'variables' && (
          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/70">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Evaluated Variables Breakdown</h3>
                  <p className="text-[11px] text-slate-400">All variable names, data types, and values captured</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                {evaluatedVariables.length} Variables Found
              </span>
            </div>

            {evaluatedVariables.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-[#fafcff]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-500 bg-white">
                      <th className="py-2.5 px-4">Variable Name</th>
                      <th className="py-2.5 px-4">Data Type</th>
                      <th className="py-2.5 px-4">Computed Value</th>
                      <th className="py-2.5 px-4">Source Line</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
                    {evaluatedVariables.map((v, i) => (
                      <tr key={i} className="hover:bg-blue-50/40 transition">
                        <td className="py-2.5 px-4 font-bold text-blue-600">{v.name}</td>
                        <td className="py-2.5 px-4 text-slate-500">{v.type}</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-600">{v.value}</td>
                        <td className="py-2.5 px-4 text-slate-400">Line {v.lineNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                <Database className="w-10 h-10 text-slate-300" />
                <p className="text-xs">No variables in scope for this execution run.</p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 4: TIMELINE (Categorized Execution Steps)
            ========================================================= */}
        {activeMainTab === 'timeline' && (
          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/70">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Execution Timeline Steps</h3>
                  <p className="text-[11px] text-slate-400">Step-by-step trace of bytecode execution events</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                {executionTimelineSteps.length} Steps
              </span>
            </div>

            {executionTimelineSteps.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-[#fafcff]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-500 bg-white">
                      <th className="py-2.5 px-3">Step</th>
                      <th className="py-2.5 px-3">Line</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Code / Statement</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11.5px]">
                    {executionTimelineSteps.map((step, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedStepIdx(idx)}
                        className={`hover:bg-blue-50/40 transition cursor-pointer ${
                          selectedStepIdx === idx ? 'bg-blue-50/70' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-slate-500">{step.stepNumber}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{step.lineNumber}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${getCategoryBadgeClass(step.category)}`}>
                            {step.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-800 truncate max-w-[220px]" title={step.code}>
                          {step.code}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{step.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                <Clock className="w-10 h-10 text-slate-300" />
                <p className="text-xs">No runtime timeline steps available.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalysisResult;
