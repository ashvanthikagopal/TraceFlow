import React, { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';

const CodeViewer = ({ sourceCode, currentStep, staticIssues = [], compilerDiagnostics = [] }) => {
  const activeLineRef = useRef(null);
  const containerRef = useRef(null);

  const lines = sourceCode ? sourceCode.split('\n') : [];

  // Issue maps by line number
  const staticIssuesByLine = {};
  staticIssues.forEach((issue) => {
    if (issue.lineNo) {
      staticIssuesByLine[issue.lineNo] = issue;
    }
  });

  const compilerDiagnosticsByLine = {};
  compilerDiagnostics.forEach((diag) => {
    if (diag.lineNo) {
      compilerDiagnosticsByLine[diag.lineNo] = diag;
    }
  });

  const activeLineNo = currentStep?.lineNo;

  // Auto-scroll to active line smoothly
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineNo]);

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden border border-slate-800/80 bg-slate-950/90 shadow-2xl">
      {/* Editor Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="font-mono text-slate-300 font-semibold ml-2">Source Code</span>
        </div>
        <div className="flex items-center gap-3">
          {activeLineNo ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-500/30">
              <Play className="w-3 h-3 fill-indigo-400 text-indigo-400" />
              Line {activeLineNo}
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">Ready</span>
          )}
          <span className="text-slate-500 text-[11px]">{lines.length} lines</span>
        </div>
      </div>

      {/* Code Editor Body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto font-mono text-[13px] leading-relaxed p-2 select-text"
      >
        {lines.map((line, idx) => {
          const lineNo = idx + 1;
          const isActive = activeLineNo === lineNo;
          const staticIssue = staticIssuesByLine[lineNo];
          const compilerDiag = compilerDiagnosticsByLine[lineNo];
          const isError = compilerDiag?.kind === 'ERROR';

          let lineClass = 'flex items-start py-0.5 px-2 rounded transition-colors group relative ';
          if (isActive) {
            lineClass += 'code-line-active bg-indigo-950/40 text-indigo-100 font-medium ';
          } else if (isError) {
            lineClass += 'code-line-error bg-rose-950/30 text-rose-200 ';
          } else if (staticIssue) {
            lineClass += 'hover:bg-amber-950/20 text-slate-200 ';
          } else {
            lineClass += 'hover:bg-slate-900/60 text-slate-300 ';
          }

          return (
            <div
              key={lineNo}
              ref={isActive ? activeLineRef : null}
              className={lineClass}
            >
              {/* Gutter: Line Number & Markers */}
              <div className="flex items-center justify-end w-12 shrink-0 pr-3 select-none text-slate-600 group-hover:text-slate-400 font-mono text-[12px]">
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 mr-1.5 shadow-[0_0_8px_#818cf8] animate-pulse"></span>
                )}
                {compilerDiag && (
                  <span title={compilerDiag.message} className="mr-1 text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </span>
                )}
                {staticIssue && !compilerDiag && (
                  <span title={staticIssue.message} className="mr-1 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                )}
                <span>{lineNo}</span>
              </div>

              {/* Code Line Content */}
              <div className="flex-1 overflow-x-auto whitespace-pre font-mono">
                {line || ' '}
              </div>

              {/* Inline Issue Banner */}
              {staticIssue && (
                <div className="hidden group-hover:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-amber-500/40 text-amber-300 text-xs shadow-xl backdrop-blur-md">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>{staticIssue.message}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CodeViewer;
