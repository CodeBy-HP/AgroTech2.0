import React from 'react';

const Spinner = ({ size = 'medium' }) => {
  const sizeClass = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }[size];

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-green-500 ${sizeClass}`}></div>
    </div>
  );
};

export default Spinner; 