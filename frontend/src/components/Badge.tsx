import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  error:   'bg-red-100 text-red-800 border border-red-200',
  info:    'bg-blue-100 text-blue-800 border border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
};

const statusMap: Record<string, BadgeVariant> = {
  // Plant / Log statuses
  Approved:  'success',
  Verified:  'success',
  Active:    'success',
  Submitted: 'info',
  Audited:   'success',
  Pending:   'warning',
  Draft:     'neutral',
  Rejected:  'error',
  Sold:      'neutral',
  Cancelled: 'error',
};

interface BadgeProps {
  status:   string;
  variant?: BadgeVariant;
  size?:    'sm' | 'md';
}

export default function Badge({ status, variant, size = 'sm' }: BadgeProps) {
  const resolvedVariant = variant ?? statusMap[status] ?? 'neutral';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${variantClasses[resolvedVariant]}`}>
      {status}
    </span>
  );
}
