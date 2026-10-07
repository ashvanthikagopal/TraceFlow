import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Maximize2,
  Play,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Layers,
  Code2,
  Compass,
  ListOrdered,
  Eye,
  Filter,
} from 'lucide-react';

const FlowGraph = ({ flowGraph = { nodes: [], edges: [] }, currentStep, onSelectLine }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram' | 'tree'
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const svgContainerRef = useRef(null);

  const rawNodes = flowGraph?.nodes || [];
  const rawEdges = flowGraph?.edges || [];
  const activeLineNo = currentStep?.lineNo;

  // Extract list of distinct methods
  const methodList = useMemo(() => {
    const set = new Set();
    rawNodes.forEach((n) => {
      if (n.methodName) set.add(n.methodName);
    });
    return Array.from(set);
  }, [rawNodes]);

  // Filter nodes & edges by selected method
  const filteredNodes = useMemo(() => {
    if (selectedMethod === 'ALL') return rawNodes;
    return rawNodes.filter((n) => n.methodName === selectedMethod);
  }, [rawNodes, selectedMethod]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return rawEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [rawEdges, filteredNodes]);

  // Compute clean method-grouped layout
  const layout = useMemo(() => {
    if (!filteredNodes || filteredNodes.length === 0) {
      return { nodeMap: new Map(), edges: [], minX: 0, maxX: 800, minY: 0, maxY: 600, width: 800, height: 600 };
    }

    const nodeWidth = 230;
    const nodeHeight = 64;
    const verticalGap = 56;
    const branchOffset = 180;
    const centerX = 380;

    const nodeMap = new Map();

    // Group nodes by method
    const methodGroups = new Map();
    filteredNodes.forEach((node) => {
      const m = node.methodName || 'main';
      if (!methodGroups.has(m)) methodGroups.set(m, []);
      methodGroups.get(m).push(node);
    });

    let currentY = 50;

    methodGroups.forEach((nodesInMethod, methodName) => {
      const startNode = nodesInMethod.find((n) => n.type === 'START');
      const endNode = nodesInMethod.find((n) => n.type === 'END');
      const middleNodes = nodesInMethod.filter((n) => n.type !== 'START' && n.type !== 'END');

      const ordered = [];
      if (startNode) ordered.push(startNode);
      ordered.push(...middleNodes);
      if (endNode) ordered.push(endNode);

      ordered.forEach((node) => {
        let x = centerX;
        let y = currentY;

        if (node.type === 'START') {
          x = centerX;
          y = currentY;
          currentY += nodeHeight + verticalGap;
        } else if (node.type === 'END') {
          x = centerX;
          y = currentY;
          currentY += nodeHeight + 60; // Extra spacing after method ends
        } else if (node.type === 'IF_DECISION' || node.type === 'LOOP_CONDITION') {
          x = centerX;
          y = currentY;
          currentY += nodeHeight + verticalGap;
        } else if (node.label && (node.label.startsWith('Join') || node.label.startsWith('Exit'))) {
          x = centerX;
          y = currentY;
          currentY += nodeHeight + verticalGap;
        } else {
          // Check branch offset
          const isThenBranch = filteredEdges.some((e) => e.target === node.id && (e.label === 'true' || e.label === 'then_done'));
          const isElseBranch = filteredEdges.some((e) => e.target === node.id && (e.label === 'false' || e.label === 'else_done' || e.label === 'branch_no'));

          if (isThenBranch) {
            x = centerX - branchOffset;
          } else if (isElseBranch) {
            x = centerX + branchOffset;
          } else {
            x = centerX;
          }
          y = currentY;
          currentY += nodeHeight + verticalGap;
        }

        nodeMap.set(node.id, {
          ...node,
          x,
          y,
          width: nodeWidth,
          height: nodeHeight,
        });
      });
    });

    // Calculate bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodeMap.forEach((n) => {
      minX = Math.min(minX, n.x - 80);
      maxX = Math.max(maxX, n.x + n.width + 80);
      minY = Math.min(minY, n.y - 40);
      maxY = Math.max(maxY, n.y + n.height + 60);
    });

    return {
      nodeMap,
      edges: filteredEdges,
      minX: Math.max(0, minX),
      maxX: Math.max(maxX, 800),
      minY: Math.max(0, minY),
      maxY: Math.max(maxY, 600),
      width: maxX - minX + 200,
      height: maxY - minY + 200,
    };
  }, [filteredNodes, filteredEdges]);

  // Center on active line when step changes
  useEffect(() => {
    if (activeLineNo && layout.nodeMap) {
      for (const node of layout.nodeMap.values()) {
        if (node.lineNo === activeLineNo) {
          setSelectedNodeId(node.id);
          break;
        }
      }
    }
  }, [activeLineNo, layout]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 80, y: 40 });
  };

  const fitToView = () => {
    setZoom(0.85);
    setPan({ x: 60, y: 20 });
  };

  const getNodeTheme = (type, isActive, isSelected) => {
    if (isActive) {
      return {
        fill: '#1e1b4b',
        stroke: '#ec4899',
        glow: 'rgba(236, 72, 153, 0.4)',
        borderWidth: 3,
        text: '#ffffff',
        badgeBg: '#f43f5e',
        badgeText: '#ffffff',
      };
    }
    if (isSelected) {
      return {
        fill: '#172554',
        stroke: '#60a5fa',
        glow: 'rgba(96, 165, 250, 0.3)',
        borderWidth: 2.5,
        text: '#ffffff',
        badgeBg: '#3b82f6',
        badgeText: '#ffffff',
      };
    }
    switch (type) {
      case 'START':
        return {
          fill: '#064e3b',
          stroke: '#10b981',
          glow: 'rgba(16, 185, 129, 0.2)',
          borderWidth: 2,
          text: '#a7f3d0',
          badgeBg: '#059669',
          badgeText: '#ffffff',
        };
      case 'END':
        return {
          fill: '#1e293b',
          stroke: '#64748b',
          glow: 'none',
          borderWidth: 1.5,
          text: '#cbd5e1',
          badgeBg: '#475569',
          badgeText: '#ffffff',
        };
      case 'IF_DECISION':
        return {
          fill: '#451a03',
          stroke: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.25)',
          borderWidth: 2,
          text: '#fde68a',
          badgeBg: '#d97706',
          badgeText: '#ffffff',
        };
      case 'LOOP_CONDITION':
        return {
          fill: '#083344',
          stroke: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.25)',
          borderWidth: 2,
          text: '#a5f3fc',
          badgeBg: '#0891b2',
          badgeText: '#ffffff',
        };
      case 'EXCEPTION':
        return {
          fill: '#4c0519',
          stroke: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.3)',
          borderWidth: 2,
          text: '#fecdd3',
          badgeBg: '#e11d48',
          badgeText: '#ffffff',
        };
      case 'RETURN':
        return {
          fill: '#3b0764',
          stroke: '#c084fc',
          glow: 'rgba(192, 132, 252, 0.2)',
          borderWidth: 1.5,
          text: '#f3e8ff',
          badgeBg: '#9333ea',
          badgeText: '#ffffff',
        };
      case 'METHOD_CALL':
        return {
          fill: '#0f172a',
          stroke: '#818cf8',
          glow: 'rgba(129, 140, 248, 0.2)',
          borderWidth: 1.5,
          text: '#c7d2fe',
          badgeBg: '#4f46e5',
          badgeText: '#ffffff',
        };
      default:
        return {
          fill: '#0f172a',
          stroke: '#334155',
          glow: 'none',
          borderWidth: 1.5,
          text: '#e2e8f0',
          badgeBg: '#1e293b',
          badgeText: '#94a3b8',
        };
    }
  };

  if (rawNodes.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center p-12 text-center text-slate-500 h-full">
        <GitFork className="w-12 h-12 mb-3 opacity-30 text-indigo-400" />
        <p className="text-sm font-semibold text-slate-300">Control Flow Graph</p>
        <p className="text-xs text-slate-500 mt-1">Upload and analyze a Java source file to generate the visual execution flowchart.</p>
      </div>
    );
  }

  return (
    <div className="glass-card relative flex flex-col h-full overflow-hidden border border-slate-800 bg-slate-950/95 shadow-2xl">
      {/* Flowchart Header & Action Controls */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white uppercase tracking-wider">Control Flow Graph</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {filteredNodes.length} Nodes · {filteredEdges.length} Transitions
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive execution graph with live line stepping &amp; decision branches
            </p>
          </div>
        </div>

        {/* Action Controls & Method Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter Dropdown */}
          {methodList.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Methods ({rawNodes.length} nodes)</option>
                {methodList.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}()
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('diagram')}
              className={`px-2.5 py-1 rounded-lg transition ${
                viewMode === 'diagram' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Visual Diagram View"
            >
              Diagram
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-2.5 py-1 rounded-lg transition ${
                viewMode === 'tree' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Sequential Step List View"
            >
              Step List
            </button>
          </div>

          {/* Zoom & Navigation buttons */}
          <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fitToView}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Fit View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'diagram' ? (
        <div
          ref={svgContainerRef}
          className="flex-1 relative cursor-grab active:cursor-grabbing select-none overflow-hidden bg-[#070913]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          <svg
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <defs>
              <marker
                id="flow-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
              </marker>
              <marker
                id="flow-arrow-active"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#ec4899" />
              </marker>
              <marker
                id="flow-arrow-loop"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
              </marker>
            </defs>

            {/* Edge Connecting Lines */}
            <g className="flow-edges">
              {layout.edges.map((edge) => {
                const src = layout.nodeMap.get(edge.source);
                const tgt = layout.nodeMap.get(edge.target);
                if (!src || !tgt) return null;

                const isLoopBack = edge.type === 'loop_back' || edge.label === 'repeat' || edge.label === 'next_iteration';
                const isBranchNo = edge.label === 'false' || edge.label === 'branch_no' || edge.label === 'else';
                const isBranchYes = edge.label === 'true' || edge.label === 'then';

                const x1 = src.x + src.width / 2;
                const y1 = src.y + src.height;
                const x2 = tgt.x + tgt.width / 2;
                const y2 = tgt.y;

                let pathD = '';
                let midX = (x1 + x2) / 2;
                let midY = (y1 + y2) / 2;

                if (isLoopBack) {
                  const loopOffset = 140;
                  pathD = `M ${x1 + src.width / 2 - 10} ${src.y + src.height / 2} C ${x1 + loopOffset} ${src.y + src.height / 2}, ${x2 + loopOffset} ${tgt.y + tgt.height / 2}, ${x2 + tgt.width / 2} ${tgt.y + tgt.height / 2}`;
                  midX = x1 + loopOffset - 20;
                  midY = (src.y + tgt.y) / 2;
                } else if (Math.abs(x1 - x2) > 20) {
                  pathD = `M ${x1} ${y1} C ${x1} ${y1 + 35}, ${x2} ${y2 - 35}, ${x2} ${y2}`;
                } else {
                  pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                }

                let strokeColor = '#475569';
                let markerId = 'flow-arrow';

                if (isLoopBack) {
                  strokeColor = '#06b6d4';
                  markerId = 'flow-arrow-loop';
                } else if (isBranchYes) {
                  strokeColor = '#10b981';
                } else if (isBranchNo) {
                  strokeColor = '#f59e0b';
                }

                return (
                  <g key={edge.id} className="transition-all duration-300">
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isLoopBack ? 2 : 1.8}
                      strokeDasharray={isLoopBack ? '5,4' : 'none'}
                      markerEnd={`url(#${markerId})`}
                      className="transition-colors hover:stroke-indigo-400"
                    />
                    {edge.label && edge.label !== 'next' && edge.label !== 'straight' && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-28"
                          y="-9"
                          width="56"
                          height="18"
                          rx="9"
                          fill="#0f172a"
                          stroke={strokeColor}
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          dy="3.5"
                          className="text-[9px] font-bold font-mono"
                          fill={isBranchYes ? '#34d399' : isBranchNo ? '#fbbf24' : '#94a3b8'}
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Nodes */}
            <g className="flow-nodes">
              {Array.from(layout.nodeMap.values()).map((node) => {
                const isActive = activeLineNo === node.lineNo;
                const isSelected = selectedNodeId === node.id;
                const theme = getNodeTheme(node.type, isActive, isSelected);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      if (node.lineNo && onSelectLine) {
                        onSelectLine(node.lineNo);
                      }
                    }}
                    className="cursor-pointer transition-transform hover:scale-[1.02]"
                  >
                    {/* Node Background with glow */}
                    <rect
                      width={node.width}
                      height={node.height}
                      rx={node.type === 'START' || node.type === 'END' ? 32 : 12}
                      fill={theme.fill}
                      stroke={theme.stroke}
                      strokeWidth={theme.borderWidth}
                      style={{
                        filter: theme.glow !== 'none' ? `drop-shadow(0 0 10px ${theme.glow})` : 'none',
                      }}
                      className="transition-all duration-200"
                    />

                    {/* Method Tag */}
                    {node.methodName && (
                      <text
                        x="14"
                        y="16"
                        className="text-[9px] font-mono font-bold"
                        fill="#818cf8"
                      >
                        {node.methodName}()
                      </text>
                    )}

                    {/* Node Type Badge */}
                    <rect
                      x={node.width - 76}
                      y="7"
                      width="66"
                      height="15"
                      rx="7.5"
                      fill={theme.badgeBg}
                    />
                    <text
                      x={node.width - 43}
                      y="18"
                      textAnchor="middle"
                      className="text-[8px] font-bold tracking-wider font-mono"
                      fill={theme.badgeText}
                    >
                      {node.type.replace('_', ' ')}
                    </text>

                    {/* Node Label Text */}
                    <text
                      x="14"
                      y="36"
                      className="text-[11px] font-bold font-mono"
                      fill={theme.text}
                    >
                      {node.label && node.label.length > 25 ? node.label.substring(0, 23) + '...' : node.label}
                    </text>

                    {/* Line Number Footer */}
                    {node.lineNo > 0 && (
                      <text
                        x="14"
                        y="52"
                        className="text-[9px] font-mono"
                        fill="#64748b"
                      >
                        Line {node.lineNo}
                      </text>
                    )}

                    {/* Executing Pulse indicator */}
                    {isActive && (
                      <circle
                        cx={node.width - 12}
                        cy={node.height / 2}
                        r="5"
                        fill="#f43f5e"
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Flow Legend at Bottom Right */}
          <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-xl backdrop-blur-md flex flex-col gap-2 pointer-events-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Node Legend</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Start
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> If Decision
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Loop Condition
              </div>
              <div className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Statement
              </div>
              <div className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Return
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> End
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Sequential Step List View */
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#070913]">
          {filteredNodes.map((node, i) => {
            const isActive = activeLineNo === node.lineNo;
            return (
              <div
                key={node.id}
                onClick={() => {
                  if (node.lineNo && onSelectLine) onSelectLine(node.lineNo);
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-indigo-950/80 border-pink-500/80 shadow-lg shadow-pink-500/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold font-mono text-slate-300 flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{node.label}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400">
                        {node.type}
                      </span>
                    </div>
                    {node.codeSnippet && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{node.codeSnippet}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-indigo-400 block font-semibold">
                    Line {node.lineNo}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block animate-pulse">
                      [EXECUTING]
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FlowGraph;
