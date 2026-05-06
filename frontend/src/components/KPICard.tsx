import React from 'react';

interface KPICardProps {
  title:      string;
  value:      string | number;
  subtitle?:  string;
  icon?:      React.ReactNode;
  trend?:     { value: number; label: string };
  color?:     'green' | 'blue' | 'purple' | 'orange' | 'teal';
}

const colorMap = {
  green:  'from-green-500 to-eco-600',
  blue:   'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
  teal:   'from-teal-500 to-teal-600',
};

export default function KPICard({
  title, value, subtitle, icon, trend, color = 'green',
}: KPICardProps) {
  const gradient = colorMap[color];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span className="text-gray-400 font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
