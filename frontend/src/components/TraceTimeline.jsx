import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward, Zap, ShieldAlert, CornerDownRight, Download } from 'lucide-react';

const TraceTimeline = ({
  steps = [],
  currentStepIndex = 0,
  onStepChange,
  isPlaying = false,
  onTogglePlay,
  playbackSpeed = 1000,
  onSpeedChange,
  onExportCsv,
}) => {
  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] || null;

  const handleSliderChange = (e) => {
    onStepChange(parseInt(e.target.value, 10));
  };

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    onStepChange(0);
  };

  const handleJumpToEnd = () => {
    if (totalSteps > 0) {
      onStepChange(totalSteps - 1);
    }
  };

  const getEventBadge = (eventType) => {
    switch (eventType) {
      case 'METHOD_ENTRY':
        return (
          <span className="badge bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <CornerDownRight className="w-3 h-3" /> Method Entry
          </span>
        );
      case 'METHOD_EXIT':
        return (
          <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Method Exit
          </span>
        );
      case 'EXCEPTION':
        return (
          <span className="badge bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <ShieldAlert className="w-3 h-3" /> Exception
          </span>
        );
      default:
        return (
          <span className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            Line Step
          </span>
        );
    }
  };

  if (totalSteps === 0) {
    return (
      <div className="glass-card p-4 text-center text-slate-500 text-sm">
        No execution trace available for this project.
      </div>
    );
  }

  return (
    <div className="glass-card p-4 border border-slate-800 flex flex-col gap-3 bg-slate-950/80 shadow-xl">
      {/* Current Step Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-sm text-indigo-400">
            Step {currentStepIndex + 1} <span className="text-slate-500 text-xs">/ {totalSteps}</span>
          </span>
          {currentStep && getEventBadge(currentStep.eventType)}
          {currentStep?.methodName && (
            <span className="font-mono text-slate-300 text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              {currentStep.methodName}()
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          {currentStep?.message && (
            <span className="truncate max-w-md text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
              {currentStep.message}
            </span>
          )}
        </div>
      </div>

      {/* Scrubber Timeline Slider */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={totalSteps - 1}
            value={currentStepIndex}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <span>Start (Step 1)</span>
          <span>Progress: {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%</span>
          <span>End (Step {totalSteps})</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            title="Reset to beginning"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            title="Previous Step"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-800 transition"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePlay}
            className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow transition-all ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Play Trace
              </>
            )}
          </button>
          <button
            onClick={handleNext}
            disabled={currentStepIndex === totalSteps - 1}
            title="Next Step"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-800 transition"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleJumpToEnd}
            title="Jump to end"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Controls & CSV Export */}
        <div className="flex items-center gap-3">
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Export Execution Log to CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" /> Export CSV
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Speed:
            </span>
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
              {[
                { label: '0.5x', speed: 1500 },
                { label: '1x', speed: 800 },
                { label: '2x', speed: 400 },
                { label: '5x', speed: 150 },
              ].map(({ label, speed }) => (
                <button
                  key={label}
                  onClick={() => onSpeedChange(speed)}
                  className={`px-2 py-1 rounded transition ${
                    playbackSpeed === speed
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceTimeline;
