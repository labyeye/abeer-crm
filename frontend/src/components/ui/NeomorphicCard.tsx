import React from 'react';

interface NeomorphicCardProps {
  children: React.ReactNode;
  className?: string;
}

const NeomorphicCard: React.FC<NeomorphicCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-[8px_8px_30px_#e0e0e0,_-8px_-8px_30px_#ffffff] border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
};

export default NeomorphicCard; 