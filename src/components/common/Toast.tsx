import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center text-sm font-bold w-max max-w-[90%] animate-bounce">
      <CheckCircle size={18} className="text-green-400 mx-2 flex-shrink-0" />
      <span className="truncate">{toast}</span>
    </div>
  );
};
