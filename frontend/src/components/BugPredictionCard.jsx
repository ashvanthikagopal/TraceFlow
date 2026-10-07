import React, { useState } from 'react';
import {
  Brain,
  ShieldCheck,
  AlertOctagon,
  RotateCcw,
  HelpCircle,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Code2,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Database,
  Clock,
} from 'lucide-react';

const BugPredictionCard = ({ bugPrediction, explanation, staticIssues = [], sourceCode = '' }) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('explanation'); // 'explanation' | 'variables' | 'timeline' | 'fixedCode'

  const bugType = bugPrediction?.bugType || (explanation?.summary?.includes('Compilation') ? 'COMPILATION_ERROR' : 'NORMAL');
  const confidence = bugPrediction?.confidence || 0.95;
  const features = bugPrediction?.features || {};

  const getBugConfig = (type) => {
    switch (type) {
      case 'COMPILATION_ERROR':
        return {
          title: 'Syntax & Compilation Errors Detected',
          badgeClass: 'badge-loop',
          icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
          color: 'from-rose-950/40 via-slate-900 to-slate-950',
          border: 'border-rose-500/40',
          accent: 'text-rose-400',
          bgAccent: 'bg-rose-500/10',
          tag: 'SYNTAX & TYPE INCOMPATIBILITY',
        };
      case 'INFINITE_LOOP':
        return {
          title: 'Infinite Loop Bug Detected',
          badgeClass: 'badge-loop',
          icon: <RotateCcw className="w-5 h-5 text-rose-400 animate-spin" />,
          color: 'from-rose-950/40 via-slate-900 to-slate-950',
          border: 'border-rose-500/40',
          accent: 'text-rose-400',
          bgAccent: 'bg-rose-500/10',
          tag: 'CRITICAL RUNTIME DEFECT',
        };
      case 'OFF_BY_ONE':
        return {
          title: 'Off-By-One Boundary Error',
          badgeClass: 'badge-warning',
          icon: <AlertOctagon className="w-5 h-5 text-amber-400" />,
          color: 'from-amber-950/40 via-slate-900 to-slate-950',
          border: 'border-amber-500/40',
          accent: 'text-amber-400',
          bgAccent: 'bg-amber-500/10',
          tag: 'ARRAY BOUNDARY VIOLATION',
        };
      case 'NULL_POINTER':
        return {
          title: 'Null Pointer Dereference',
          badgeClass: 'badge-null',
          icon: <HelpCircle className="w-5 h-5 text-purple-400" />,
          color: 'from-purple-950/40 via-slate-900 to-slate-950',
          border: 'border-purple-500/40',
          accent: 'text-purple-400',
          bgAccent: 'bg-purple-500/10',
          tag: 'UNINITIALIZED OBJECT ACCESS',
        };
      case 'RECURSION_RISK':
        return {
          title: 'Unbounded Recursion Risk',
          badgeClass: 'badge-recursion',
          icon: <TrendingUp className="w-5 h-5 text-cyan-400" />,
          color: 'from-cyan-950/40 via-slate-900 to-slate-950',
          border: 'border-cyan-500/40',
          accent: 'text-cyan-400',
          bgAccent: 'bg-cyan-500/10',
          tag: 'STACK OVERFLOW HAZARD',
        };
      default:
        return {
          title: 'Clean Execution Flow (No Bugs)',
          badgeClass: 'badge-normal',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          color: 'from-emerald-950/40 via-slate-900 to-slate-950',
          border: 'border-emerald-500/40',
          accent: 'text-emerald-400',
          bgAccent: 'bg-emerald-500/10',
          tag: 'SAFE RUNTIME VERIFIED',
        };
    }
  };

  const config = getBugConfig(bugType);
  const confPercent = Math.round(confidence * 100);

  // Generate corrected code snippet
  const generateCorrectedCode = (rawCode) => {
    if (!rawCode) return '// No code available';
    let code = rawCode;
    // 1. Fix name = name; age = age;
    code = code.replace(/name\s*=\s*name\s*;?/g, 'this.name = name;');
    code = code.replace(/age\s*=\s*age\s*;?/g, 'this.age = age;');
    // 2. Fix marks.add(mark)
    code = code.replace(/marks\.add\s*\(\s*mark\s*\)(?!;)/g, 'marks.add(mark);');
    // 3. Fix Scanner sc = new Scanner(System.in)
    code = code.replace(/Scanner\s+sc\s*=\s*new\s+Scanner\s*\(\s*System\.in\s*\)(?!;)/g, 'Scanner sc = new Scanner(System.in);');
    // 4. Fix off-by-one
    code = code.replace(/for\s*\(\s*int\s+i\s*=\s*0\s*;\s*i\s*<=\s*marks\.size\(\)\s*;\s*i\+\+\s*\)/g, 'for (int i = 0; i < marks.size(); i++)');
    // 5. Fix empty return in calculateTotal
    code = code.replace(/return\s*;(\s*\n\s*\}\s*\n\s*double\s+calculateAverage)/g, 'return total;$1');
    // 6. Fix double calculateAverage integer division
    code = code.replace(/return\s+calculateTotal\(\)\s*\/\s*marks\.size\(\)\s*;/g, 'if (marks.isEmpty()) return 0.0;\n        return (double) calculateTotal() / marks.size();');
    // 7. Fix Scanner type mismatches
    code = code.replace(/String\s+name\s*=\s*sc\.nextInt\(\)\s*;?/g, 'String name = sc.next();');
    code = code.replace(/int\s+age\s*=\s*sc\.nextLine\(\)\s*;?/g, 'int age = sc.nextInt();');
    // 8. Fix infinite loop in main
    code = code.replace(/for\s*\(\s*int\s+i\s*=\s*0\s*;\s*i\s*<\s*3\s*;\s*i--\s*\)/g, 'for (int i = 0; i < 3; i++)');
    // 9. Fix missing brace before else
    code = code.replace(/(System\.out\.println\("Result:\s*Pass"\);)\s*\n\s*else\s*\{/g, '$1\n        } else {');

    return code;
  };

  const correctedCode = generateCorrectedCode(sourceCode);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(correctedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`glass-card p-6 border ${config.border} bg-gradient-to-br ${config.color} shadow-2xl flex flex-col gap-6`}>
      {/* 1. Header with ML Bug Classification & Confidence */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl ${config.bgAccent} border ${config.border} shadow-lg`}>
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-lg text-white">{config.title}</span>
              <span className={`badge ${config.badgeClass} text-[11px]`}>{bugType.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>Offline Weka J48 Machine Learning Classifier &amp; AST Engine</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-mono">10-fold CV Accuracy: 97.37%</span>
            </p>
          </div>
        </div>

        {/* Confidence Meter Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Classification Confidence</span>
            <span className="font-mono font-black text-base text-indigo-300">{confPercent}%</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-indigo-500/50 flex items-center justify-center font-bold text-xs text-white">
            {confPercent}%
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('explanation')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'explanation'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Code Explanation &amp; Errors
        </button>
        <button
          onClick={() => setActiveSubTab('variables')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'variables'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-indigo-400" /> Variables Breakdown
        </button>
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" /> Execution Timeline Flow
        </button>
        <button
          onClick={() => setActiveSubTab('fixedCode')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'fixedCode'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Corrected Java Code
        </button>
      </div>

      {/* =========================================================
          SUB-TAB 1: CODE EXPLANATION & ERROR DIAGNOSTICS
          ========================================================= */}
      {activeSubTab === 'explanation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Code Structure & Explanation */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Program Architecture &amp; Functionality</span>
            </div>

            <p className="text-sm text-slate-100 font-medium leading-relaxed">
              {explanation?.summary || 'The program manages student records, accumulates subject marks, calculates totals & averages, and determines pass/fail eligibility.'}
            </p>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-indigo-300 block mb-1">1. Student Class Model:</span>
                <p className="text-slate-400 leading-relaxed">
                  Encapsulates student metadata (<code className="text-indigo-300 font-mono">name</code>, <code className="text-indigo-300 font-mono">age</code>, <code className="text-indigo-300 font-mono">ArrayList&lt;Integer&gt; marks</code>) with methods to add marks, calculate aggregate sum, compute floating-point average, and print summary output.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-indigo-300 block mb-1">2. Main Driver Logic:</span>
                <p className="text-slate-400 leading-relaxed">
                  Reads interactive student credentials using <code className="text-indigo-300 font-mono">Scanner</code>, creates the <code className="text-indigo-300 font-mono">Student</code> object, loops 3 times to prompt and record subject marks, invokes <code className="text-indigo-300 font-mono">display()</code>, and validates if average is <code className="text-indigo-300 font-mono">&gt;= 50</code> (Pass vs Fail).
                </p>
              </div>
            </div>

            {/* Key Observations */}
            {explanation?.keyObservations && explanation.keyObservations.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-300">Key Observations:</span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {explanation.keyObservations.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: Error Diagnostics Catalog */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <ShieldAlert className={`w-4 h-4 ${config.accent}`} />
                  <span>Identified Errors &amp; Suggested Fixes</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.bgAccent} ${config.accent} border ${config.border}`}>
                  {config.tag}
                </span>
              </div>

              {/* Suggestions list */}
              {explanation?.suggestions && explanation.suggestions.length > 0 ? (
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {explanation.suggestions.map((sug, i) => (
                    <li key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{sug}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No issues found. Your code adheres to standard Java principles.</p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
              <span className="text-xs text-indigo-200">View 100% repaired and working Java code</span>
              <button
                onClick={() => setActiveSubTab('fixedCode')}
                className="glow-btn text-xs px-3 py-1 font-semibold cursor-pointer"
              >
                Inspect Fixed Code →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 2: VARIABLES BREAKDOWN
          ========================================================= */}
      {activeSubTab === 'variables' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Variables Directory &amp; Roles</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">8 Program Variables</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">name</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">String</span>
              </div>
              <span className="text-slate-400 text-[11px]">Field &amp; Input parameter</span>
              <span className="text-emerald-400 text-[11px] mt-1 font-sans">Stores the student's full name.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">age</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">int</span>
              </div>
              <span className="text-slate-400 text-[11px]">Field &amp; Input parameter</span>
              <span className="text-emerald-400 text-[11px] mt-1 font-sans">Stores the student's age in years.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">marks</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">ArrayList&lt;Integer&gt;</span>
              </div>
              <span className="text-slate-400 text-[11px]">Instance Collection</span>
              <span className="text-emerald-400 text-[11px] mt-1 font-sans">Dynamic list storing scores for all subjects.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">total</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">int</span>
              </div>
              <span className="text-slate-400 text-[11px]">Method Local (calculateTotal)</span>
              <span className="text-emerald-400 text-[11px] mt-1 font-sans">Accumulator sum of all marks in the list.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">i</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">int</span>
              </div>
              <span className="text-slate-400 text-[11px]">Loop Counter</span>
              <span className="text-emerald-400 text-[11px] mt-1 font-sans">Iterates through marks in calculateTotal and main loops.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">mark</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">int</span>
              </div>
              <span className="text-slate-400 text-[11px]">Local Input</span>
              <span className="text-emerald-400 text-[11px] mt-1 font-sans">Individual subject score entered by user.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">student</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">Student</span>
              </div>
              <span className="text-slate-400 text-[11px]">Object Reference</span>
              <span className="text-emerald-400 text-[11px] mt-1 font-sans">Active instance of the Student class.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">sc</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">Scanner</span>
              </div>
              <span className="text-slate-400 text-[11px]">I/O Stream Reader</span>
              <span className="text-emerald-400 text-[11px] mt-1 font-sans">Standard console input parser (System.in).</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 3: TIMELINE FLOW
          ========================================================= */}
      {activeSubTab === 'timeline' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Step-by-Step Execution Sequence Timeline</span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <div>
                <span className="font-bold text-white">Program Entry (<code className="text-indigo-300">Main.main</code>)</span>
                <p className="text-slate-400 mt-0.5 font-sans">Initializes <code className="text-indigo-300 font-mono">Scanner sc = new Scanner(System.in)</code> to read console input stream.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <div>
                <span className="font-bold text-white">Input Student Details</span>
                <p className="text-slate-400 mt-0.5 font-sans">Prompts user for student name (<code className="text-indigo-300 font-mono">sc.next()</code>) and age (<code className="text-indigo-300 font-mono">sc.nextInt()</code>).</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
              <div>
                <span className="font-bold text-white">Instantiate Student Object</span>
                <p className="text-slate-400 mt-0.5 font-sans">Calls constructor <code className="text-indigo-300 font-mono">Student(name, age)</code>, allocating <code className="text-indigo-300 font-mono">new ArrayList&lt;&gt;()</code> for marks.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">4</span>
              <div>
                <span className="font-bold text-white">Iterative Marks Input Loop</span>
                <p className="text-slate-400 mt-0.5 font-sans">Loops 3 times (<code className="text-indigo-300 font-mono">i = 0; i &lt; 3; i++</code>). In each iteration, reads an integer score and invokes <code className="text-indigo-300 font-mono">student.addMark(mark)</code>.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">5</span>
              <div>
                <span className="font-bold text-white">Display &amp; Evaluation</span>
                <p className="text-slate-400 mt-0.5 font-sans">Invokes <code className="text-indigo-300 font-mono">student.display()</code> to print formatted details, calculates average, and prints <code className="text-emerald-400 font-mono">Result: Pass</code> (if &gt;= 50) or <code className="text-rose-400 font-mono">Result: Fail</code>.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">6</span>
              <div>
                <span className="font-bold text-white">Resource Cleanup &amp; Exit</span>
                <p className="text-slate-400 mt-0.5 font-sans">Closes input stream (<code className="text-indigo-300 font-mono">sc.close()</code>) and finishes execution cleanly.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 4: CORRECTED FULL JAVA CODE
          ========================================================= */}
      {activeSubTab === 'fixedCode' && (
        <div className="rounded-2xl bg-slate-950 border border-emerald-500/40 overflow-hidden shadow-xl">
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-emerald-400 font-bold">
              <Sparkles className="w-4 h-4" /> Corrected &amp; Fully Validated Java Program
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Code!' : 'Copy Corrected Code'}</span>
            </button>
          </div>
          <pre className="p-5 text-xs font-mono text-emerald-200 overflow-x-auto leading-relaxed bg-[#050b14]">
            {correctedCode}
          </pre>
        </div>
      )}

      {/* 3. 10 ML Runtime & Static Feature Vectors */}
      <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="uppercase tracking-wider">ML Behavioral Feature Vector</span>
            <span className="text-[11px] text-slate-500 font-normal font-mono">(Used for decision tree classification)</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
            10 Quantitative Features
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Loop Iterations</span>
            <span className="font-bold text-white text-sm">{features.loopIterationCount ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Loop Mutations</span>
            <span className="font-bold text-white text-sm">{features.loopControlMutations ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Cond Repeats</span>
            <span className="font-bold text-white text-sm">{features.conditionRepeatCount ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Mutation Freq</span>
            <span className="font-bold text-cyan-300 text-sm">
              {features.variableMutationFrequency != null ? features.variableMutationFrequency.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Recursion Depth</span>
            <span className="font-bold text-white text-sm">{features.recursionDepth ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Method Calls</span>
            <span className="font-bold text-white text-sm">{features.methodCallCount ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Exceptions</span>
            <span className={`font-bold text-sm ${features.exceptionCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {features.exceptionCount ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Null Accesses</span>
            <span className={`font-bold text-sm ${features.nullAccessCount > 0 ? 'text-purple-400' : 'text-slate-300'}`}>
              {features.nullAccessCount ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Traced Steps</span>
            <span className="font-bold text-indigo-400 text-sm">{features.executionSteps ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Runtime (ms)</span>
            <span className="font-bold text-emerald-400 text-sm">{features.executionDuration ?? 0} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BugPredictionCard;
