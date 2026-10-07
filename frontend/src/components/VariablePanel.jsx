import React, { useState } from 'react';
import { Database, TrendingUp, Sparkles, Clock, Check, Layers, Table } from 'lucide-react';

const VariablePanel = ({ currentStep, variableTimelines = {}, staticVariables = [] }) => {
  const [selectedVar, setSelectedVar] = useState(null);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'table' | 'history'

  const variables = currentStep?.variables || {};
  const varKeys = Object.keys(variables);
  const timelineKeys = Object.keys(variableTimelines);

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden border border-slate-800/80 bg-slate-950/80 shadow-2xl">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm text-slate-200">Variable State Inspector</span>
        </div>
        <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeTab === 'live'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Current Step
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeTab === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Variable Table
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Tab 1: Live Step Variables */}
      {activeTab === 'live' && (
        <div className="flex-1 overflow-auto p-3">
          {varKeys.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Layers className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">No variables in scope at this step.</p>
              <p className="text-xs text-slate-600 mt-1">Variables will appear as execution enters methods and loops.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {varKeys.map((name) => {
                const varData = variables[name];
                const isChanged = varData.changed;

                return (
                  <div
                    key={name}
                    className={`p-3 rounded-xl border transition-all ${
                      isChanged
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-100">{name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {varData.dataType || 'type'}
                        </span>
                      </div>
                      {isChanged && (
                        <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                          <Sparkles className="w-2.5 h-2.5" /> Mutated
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-cyan-300 break-all select-text">
                      {varData.value}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: IntelliTrace Variable Table */}
      {activeTab === 'table' && (
        <div className="flex-1 overflow-auto p-3">
          {varKeys.length === 0 && staticVariables.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Table className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">No tracked variables found.</p>
              <p className="text-xs text-slate-600 mt-1">Step forward in the timeline to initialize variables.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                    <th className="py-2 px-3 font-semibold">Name</th>
                    <th className="py-2 px-3 font-semibold">Type</th>
                    <th className="py-2 px-3 font-semibold">Current Value</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {varKeys.map((name) => {
                    const varData = variables[name];
                    return (
                      <tr key={name} className="hover:bg-indigo-950/20 transition">
                        <td className="py-2 px-3 font-bold text-indigo-300">{name}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {varData.dataType || 'var'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold truncate max-w-[150px]">
                          {varData.value}
                        </td>
                        <td className="py-2 px-3">
                          {varData.changed ? (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Mutated
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Stable</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mutation History Across Timeline */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-auto p-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800">
            {timelineKeys.map((varName) => (
              <button
                key={varName}
                onClick={() => setSelectedVar(varName)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                  (selectedVar || timelineKeys[0]) === varName
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {varName}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto space-y-1.5">
            {(() => {
              const activeVarKey = selectedVar || timelineKeys[0];
              const history = variableTimelines[activeVarKey] || [];

              if (history.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No history points recorded for this variable.
                  </div>
                );
              }

              return history.map((pt, idx) => {
                const isCurrent = currentStep?.stepNo === pt.stepNo;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono transition ${
                      isCurrent
                        ? 'bg-indigo-950/60 border border-indigo-500/50 text-white'
                        : pt.changed
                        ? 'bg-slate-900/80 border border-slate-800 text-slate-300'
                        : 'bg-slate-950/40 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-indigo-400 font-bold">Step {pt.stepNo}</span>
                      <span className="text-[10px] text-slate-500">L{pt.lineNo}</span>
                    </div>
                    <div className="flex items-center gap-2 max-w-[60%] truncate">
                      <span className="text-cyan-300 truncate">{pt.value}</span>
                      {pt.changed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariablePanel;
