import React from 'react';

interface NeomorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const NeomorphicButton: React.FC<NeomorphicButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`bg-white rounded-xl shadow-[4px_4px_15px_#e0e0e0,_-4px_-4px_15px_#ffffff] border border-gray-100 px-6 py-2 text-gray-800 font-semibold transition-all duration-200 hover:shadow-[2px_2px_8px_#e0e0e0,_-2px_-2px_8px_#ffffff] hover:scale-105 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeomorphicButton; 