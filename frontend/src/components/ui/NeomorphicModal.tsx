import React from 'react';

interface NeomorphicModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const NeomorphicModal: React.FC<NeomorphicModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-[8px_8px_30px_#e0e0e0,_-8px_-8px_30px_#ffffff] border border-gray-100 p-8 min-w-[340px] max-w-full relative">
        {title && <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold">&times;</button>
        {children}
      </div>
    </div>
  );
};

export default NeomorphicModal; 