import React, { ComponentType, SVGProps } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'purple' | 'teal' | 'pink' | 'indigo';
  gradient?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'primary',
  gradient = false
}) => {
  const getColorClasses = () => {
    const colorMap = {
      primary: {
        icon: 'icon-bg-primary',
        bg: gradient ? 'card-gradient-primary' : 'bg-white',
        textColor: gradient ? 'text-white' : 'text-neutral-900',
        titleColor: gradient ? 'text-primary-100' : 'text-neutral-900'
      },
      secondary: {
        icon: 'icon-bg-secondary',
        bg: gradient ? 'card-gradient-secondary' : 'bg-white',
        textColor: gradient ? 'text-white' : 'text-neutral-900',
        titleColor: gradient ? 'text-secondary-100' : 'text-neutral-900'
      },
      success: {
        icon: 'icon-bg-success',
        bg: gradient ? 'card-gradient-success' : 'bg-white',
        textColor: gradient ? 'text-white' : 'text-neutral-900',
        titleColor: gradient ? 'text-success-100' : 'text-neutral-900'
      },
      warning: {
        icon: 'icon-bg-warning',
        bg: gradient ? 'card-gradient-warning' : 'bg-white',
        textColor: gradient ? 'text-white' : 'text-neutral-900',
        titleColor: gradient ? 'text-warning-100' : 'text-neutral-900'
      },
      error: {
        icon: 'icon-bg-error',
        bg: 'bg-white',
        textColor: 'text-neutral-900',
        titleColor: 'text-neutral-900'
      },
      purple: {
        icon: 'icon-bg-purple',
        bg: 'bg-white',
        textColor: 'text-neutral-900',
        titleColor: 'text-neutral-900'
      },
      teal: {
        icon: 'icon-bg-teal',
        bg: 'bg-white',
        textColor: 'text-neutral-900',
        titleColor: 'text-neutral-900'
      },
      pink: {
        icon: 'icon-bg-pink',
        bg: 'bg-white',
        textColor: 'text-neutral-900',
        titleColor: 'text-neutral-900'
      },
      indigo: {
        icon: 'icon-bg-indigo',
        bg: 'bg-white',
        textColor: 'text-neutral-900',
        titleColor: 'text-neutral-900'
      }
    };
    return colorMap[color];
  };

  const changeClasses = {
    increase: gradient ? 'text-white bg-white bg-opacity-20' : 'text-success-600 bg-success-50',
    decrease: gradient ? 'text-white bg-white bg-opacity-20' : 'text-error-600 bg-error-50',
    neutral: gradient ? 'text-white bg-white bg-opacity-20' : 'text-neutral-600 bg-neutral-50'
  };

  const colors = getColorClasses();

  return (
    <div className={`stat-card ${colors.bg} ${colors.textColor} group`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.titleColor} mb-2`}>{title}</p>
          <p className={`text-3xl font-bold ${colors.textColor} mb-1 font-display`}>{value}</p>
          {change && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${changeClasses[changeType]}`}>
              {change}
            </span>
          )}
        </div>
        <div className="ml-4">
          <div className={`icon-container ${colors.icon} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;