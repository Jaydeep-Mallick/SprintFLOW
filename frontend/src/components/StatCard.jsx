import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, colorClass = 'text-indigo-400' }) => {
  return (
    <div className="glass-panel glass-panel-hover p-6 flex items-center justify-between">
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-slate-950 border border-slate-800 ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default StatCard;
