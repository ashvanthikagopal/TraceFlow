import React from 'react';
import traceflowLogo from '../assets/traceflow-logo.png';

export const TraceFlowMark = ({ className = 'w-8 h-8', idPrefix = 'tf' }) => {
  return (
    <img
      src={traceflowLogo}
      alt="TraceFlow"
      className={`object-contain select-none rounded-lg shrink-0 ${className}`}
      draggable={false}
    />
  );
};

export const TraceFlowLogoBadge = ({
  size = 'md',
  className = '',
  idPrefix = 'tf-badge',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 p-0.5',
    md: 'w-9 h-9 p-1',
    lg: 'w-11 h-11 p-1.5',
    xl: 'w-14 h-14 p-2',
  };

  const containerClass = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200/80 shadow-sm shadow-blue-500/10 flex items-center justify-center shrink-0 overflow-hidden ${containerClass} ${className}`}
    >
      <TraceFlowMark className="w-full h-full" idPrefix={idPrefix} />
    </div>
  );
};

export const TraceFlowBrand = ({
  size = 'md',
  showSubtext = true,
  className = '',
  idPrefix = 'tf-brand',
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <TraceFlowLogoBadge size={size} idPrefix={idPrefix} />
      <div className="flex flex-col text-left">
        <span className="font-extrabold text-[18px] text-[#0f172a] leading-tight tracking-tight">
          Trace<span className="text-[#2563eb]">Flow</span>
        </span>
        {showSubtext && (
          <span className="text-[10px] font-semibold text-slate-400 tracking-tight leading-none mt-0.5">
            Java Execution &amp; Bug Engine
          </span>
        )}
      </div>
    </div>
  );
};

export default TraceFlowBrand;
