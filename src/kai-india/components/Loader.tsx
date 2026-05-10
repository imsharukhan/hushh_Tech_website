import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full w-full" role="status" aria-label="Loading">
      <div className="relative w-8 h-8">
        <div className="absolute top-0 left-0 w-full h-full border-[3px] border-neutral-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-[3px] border-black rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
  );
};