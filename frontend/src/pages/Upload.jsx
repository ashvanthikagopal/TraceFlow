import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProject, startAnalysis, runIntelliTrace } from '../services/api';
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
  Sliders,
  Code2,
  FileCode2,
  FileText,
  UploadCloud,
  Play,
  Zap,
  Copy,
  Check,
  Edit3,
  CheckCircle2,
} from 'lucide-react';
import { TraceFlowMark } from '../components/TraceFlowLogo';

const PRESETS = [
  {
    id: 'sample',
    name: 'Sample.java',
    tag: 'INTELLI-TRACE DEMO',
    tagClass: 'bg-blue-100/80 text-blue-600 border border-blue-200/80',
    desc: 'Initialize demo with common patterns for loops, conditions and variables.',
    code: `public class Sample {
    public static void main(String[] args) {
        // Variable declarations with expressions
        int a = 10;
        int b = 20;
        int sum = a + b;
        int product = a * b;
        double average = (a + b) / 2.0;
        String greeting = "TraceFlow";
        boolean isActive = true;

        System.out.println("Starting Program Execution");
        System.out.println("Sum of a and b: " + sum);
        System.out.println("Product of a and b: " + product);
        System.out.println("Average: " + average);

        // Control Flow: If-Else Condition
        if (sum > 25) {
            System.out.println("Sum is greater than 25");
        } else {
            System.out.println("Sum is 25 or less");
        }

        // Control Flow: For Loop
        int loopTotal = 0;
        for (int i = 1; i <= 3; i++) {
            loopTotal = loopTotal + i;
            System.out.println("Loop iteration step: " + i);
        }

        // Control Flow: While Loop
        int count = 2;
        while (count > 0) {
            System.out.println("Countdown: " + count);
            count = count - 1;
        }

        System.out.println("Execution Completed Successfully");
    }
}`,
  },
  {
    id: 'divbyzero',
    name: 'DivisionByZeroBug.java',
    tag: 'ARITHMETIC ERROR',
    tagClass: 'bg-rose-50 text-rose-600 border border-rose-200/60',
    desc: 'Triggers ArithmeticException (division by zero) detected by ML.',
    code: `public class DivisionByZeroBug {
    public static void main(String[] args) {
        int dividend = 100;
        int divisor = 0;
        
        System.out.println("Attempting division calculation...");
        // Bug: Division by zero triggers ArithmeticException
        int result = dividend / divisor;
        System.out.println("Result: " + result);
    }
}`,
  },
  {
    id: 'nullpointer',
    name: 'NullPointerBug.java',
    tag: 'NULL POINTER',
    tagClass: 'bg-rose-50 text-rose-600 border border-rose-200/60',
    desc: 'Triggers null pointer dereference scenarios.',
    code: `public class NullPointerBug {
    public static void main(String[] args) {
        String message = null;
        
        System.out.println("Checking message length...");
        // Bug: Dereferencing null pointer causes NullPointerException
        int len = message.length();
        System.out.println("Length: " + len);
    }
}`,
  },
  {
    id: 'infinite',
    name: 'InfiniteLoopBug.java',
    tag: 'INFINITE LOOP',
    tagClass: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    desc: 'Identifies non-terminating loop conditions.',
    code: `public class InfiniteLoopBug {
    public static void main(String[] args) {
        int count = 0;
        int target = 10;
        
        // Bug: Loop variable 'count' is never incremented!
        while (count < target) {
            System.out.println("Processing iteration: " + count);
            // Missing: count++;
        }
        
        System.out.println("Finished!");
    }
}`,
  },
  {
    id: 'offbyone',
    name: 'ArrayOffByOne.java',
    tag: 'OFF BY ONE',
    tagClass: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    desc: 'Detects boundary errors in arrays and collections.',
    code: `public class ArrayOffByOne {
    public static void main(String[] args) {
        int[] scores = {95, 88, 72, 90};
        
        // Bug: Using <= instead of < causes ArrayIndexOutOfBoundsException
        for (int i = 0; i <= scores.length; i++) {
            System.out.println("Score " + i + ": " + scores[i]);
        }
    }
}`,
  },
  {
    id: 'recursion',
    name: 'UnboundedRecursion.java',
    tag: 'RECURSION RISK',
    tagClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
    desc: 'Finds missing base cases in recursive methods.',
    code: `public class UnboundedRecursion {
    public static void main(String[] args) {
        System.out.println("Starting recursive computation...");
        compute(5);
    }
    
    public static int compute(int n) {
        // Bug: Missing base case (if n <= 0 return 0) causes StackOverflowError
        return n + compute(n - 1);
    }
}`,
  },
  {
    id: 'typemismatch',
    name: 'TypeMismatchBug.java',
    tag: 'TYPE MISMATCH',
    tagClass: 'bg-purple-50 text-purple-600 border border-purple-200/60',
    desc: 'Identifies incompatible Scanner type assignments.',
    code: `import java.util.Scanner;

public class TypeMismatchBug {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter name: ");
        // Bug: sc.nextInt() returns int, cannot assign to String
        String name = sc.nextInt();
        System.out.println("Hello, " + name);
        sc.close();
    }
}`,
  },
  {
    id: 'resourceleak',
    name: 'ResourceLeakBug.java',
    tag: 'RESOURCE LEAK',
    tagClass: 'bg-cyan-50 text-cyan-700 border border-cyan-200/60',
    desc: 'Detects unclosed Scanner or Stream handles.',
    code: `import java.util.Scanner;

public class ResourceLeakBug {
    public static void main(String[] args) {
        Scanner reader = new Scanner(System.in);
        System.out.println("Enter value: ");
        int val = 42;
        System.out.println("Value is: " + val);
        // Bug: reader.close() is never called
    }
}`,
  },
];

const DEFAULT_BUBBLE_SORT = `public class BubbleSort {
    public static void main(String[] args) {
        int[] arr = {5, 1, 4, 2, 8};

        for (int i = 0; i < arr.length - 1; i++) {
            for (int j = 0; j < arr.length - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }

        System.out.println("Sorted Array:");
        for (int num : arr) {
            System.out.print(num + " ");
        }
    }
}`;

const Upload = () => {
  const { user, logout } = useAuth();
  const [selectedPresetId, setSelectedPresetId] = useState('sample');
  const [fileName, setFileName] = useState('BubbleSort.java');
  const [code, setCode] = useState(DEFAULT_BUBBLE_SORT);
  const [analyzing, setAnalyzing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setFileName(preset.name);
    setCode(preset.code);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.java')) {
      alert('Please select a valid Java (.java) file.');
      return;
    }

    setFileName(file.name);
    setSelectedPresetId('');

    const reader = new FileReader();
    reader.onload = (event) => {
      setCode(event.target?.result || '');
    };
    reader.readAsText(file);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartAnalysis = async () => {
    if (!code.trim()) {
      alert('Source code cannot be empty.');
      return;
    }

    setAnalyzing(true);
    try {
      const proj = await createProject({
        name: fileName,
        description: 'Uploaded via TraceFlow Studio',
        sourceCode: code,
        userId: user?.id || 1,
      });

      const projectId = proj?.projectId || proj?.id;
      if (!projectId) {
        throw new Error('Project ID was not returned by server.');
      }

      const analysis = await startAnalysis(projectId);
      navigate(`/analysis/${analysis.id}`);
    } catch (err) {
      alert('Analysis start failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunIntelliTrace = async () => {
    if (!code.trim()) {
      alert('Source code cannot be empty.');
      return;
    }
    setAnalyzing(true);
    try {
      const proj = await createProject({
        name: fileName,
        description: 'IntelliTrace Direct Run',
        sourceCode: code,
        userId: user?.id || 1,
      });
      const projectId = proj?.projectId || proj?.id;
      if (!projectId) {
        throw new Error('Project ID was not returned by server.');
      }
      const analysis = await startAnalysis(projectId);
      navigate(`/analysis/${analysis.id}`);
    } catch (err) {
      alert('IntelliTrace execution failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const displayName = user?.username || 'ashu';
  const initial = displayName.charAt(0).toUpperCase();
  const lineCount = code.split('\n').length;

  return (
    <div
      className="upload-root"
      style={{ backgroundImage: `url(${uploadBg})` }}
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
            <TraceFlowMark className="w-9 h-9 shrink-0" idPrefix="upload-logo" />

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
      <main className="upload-main">
        {/* Top Header Row with Breadcrumbs & Profile */}
        <div className="flex items-center justify-between h-[42px] mb-2">
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
            <span className="text-slate-900 font-bold">Analyze Source</span>
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
            TOP CONTAINER: Upload & Analyze Header + 5 Presets
            ========================================================= */}
        <div className="upload-card">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#eef4ff] text-[#2563eb] flex items-center justify-center shrink-0 border border-blue-100/80 shadow-xs">
                <Code2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h1 className="text-[22px] sm:text-[24px] font-black text-[#0f172a] tracking-tight leading-tight">
                  Upload &amp; Analyze Java Source
                </h1>
                <p className="text-xs text-slate-400 font-normal mt-0.5 leading-none">
                  Upload your Java source file or pick from curated sample bug patterns to run static AST checks, JDI dynamic debugging, and Weka ML classification.
                </p>
              </div>
            </div>

            {/* Right: Curated Test Presets Button */}
            <button
              type="button"
              className="h-10 px-4 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-2 hover:bg-slate-50 transition shrink-0 cursor-default"
            >
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Curated Test Presets</span>
            </button>
          </div>

          {/* 5 Preset Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`rounded-2xl p-4 flex flex-col justify-between text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-2 border-blue-500 bg-[#f8fbff] shadow-xs'
                      : 'border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Badge & Checkmark */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${preset.tagClass}`}>
                        {preset.tag}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">
                      {preset.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                      {preset.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2">
                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700">
                      <span>Load Preset</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================
            BOTTOM TWO-COLUMN LAYOUT (Left: Upload/File | Right: Editor)
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Upload Dropzone, File Details, Action Buttons */}
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-slate-100/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 sm:p-6 flex flex-col justify-between gap-5 box-border">
            {/* Header */}
            <div className="flex items-start gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/70">
                <UploadCloud className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#0f172a] leading-tight">
                  Upload Java File
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-none">
                  Drag and drop your .java file here or browse from your device.
                </p>
              </div>
            </div>

            {/* Dropzone Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-blue-200/80 rounded-[20px] bg-[#f8fbff]/60 py-6 px-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".java"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 mb-2.5 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="font-bold text-slate-800 text-xs">
                Drag &amp; drop your Java file here
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 mb-3">
                or click to browse
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="h-9 px-5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white font-bold text-xs shadow-xs hover:brightness-105 active:scale-[0.99] transition cursor-pointer"
              >
                Choose Java File
              </button>
            </div>

            {/* File Details Section */}
            <div className="flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">File Details</span>
                <span className="text-[10.5px] text-slate-400">• Selected File</span>
              </div>

              <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                <FileCode2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{fileName}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={analyzing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#7c3aed] text-white font-bold text-xs shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white stroke-none" />
                <span>{analyzing ? 'Starting Analysis...' : 'Start TraceFlow Analysis'}</span>
              </button>

              <button
                type="button"
                onClick={handleRunIntelliTrace}
                disabled={analyzing}
                className="w-full py-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 font-bold text-xs shadow-xs hover:bg-slate-50 hover:text-slate-900 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>IntelliTrace Static Engine</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Code Editor / Viewer */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-slate-100/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 sm:p-6 flex flex-col gap-3.5 box-border">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-xs">
                  &lt;/&gt;
                </div>
                <span className="font-bold text-[#0f172a] text-[15px]">
                  {fileName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-slate-100/90 text-slate-500 font-medium text-xs px-2.5 py-1 rounded-lg">
                  {lineCount} lines
                </span>
                <span className="bg-blue-50 text-blue-600 font-bold text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 border border-blue-100/60">
                  <Edit3 className="w-3 h-3" />
                  <span>Editable</span>
                </span>
              </div>
            </div>

            {/* Code Textarea with Line Numbers Container */}
            <div className="relative rounded-2xl bg-[#fafcff] border border-slate-200/80 p-4 flex overflow-hidden min-h-[380px]">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white border border-slate-200/90 text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-xs transition z-20 cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Line Numbers Column */}
              <div className="w-10 pr-3 text-right text-slate-300 font-mono text-[12px] leading-relaxed select-none shrink-0 border-r border-slate-200/70">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i + 1}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea Code Input */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                className="flex-1 pl-4 bg-transparent font-mono text-[12px] text-slate-800 leading-relaxed outline-none resize-none border-none overflow-y-auto"
                rows={Math.max(16, lineCount)}
              />

              {/* Language Tag at bottom-right */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-[11px] font-semibold text-slate-600 flex items-center gap-1 shadow-xs pointer-events-none z-20">
                <span>Java</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;
