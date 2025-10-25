
import React from 'react';

interface LoadingSpinnerProps {
  message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-12 h-12 border-4 border-t-purple-500 border-gray-600 rounded-full animate-spin"></div>
      <p className="text-lg font-medium text-gray-300">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
