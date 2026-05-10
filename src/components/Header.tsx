import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center bg-lloyds-gradient text-white">
      <div className="flex items-center gap-4">
        {/* Simplified Lloyds Horse Logo */}
        <div className="bg-white rounded-full p-2">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 100 100" 
              className="text-lloyds-green fill-current"
            >
              <path d="M75,30 C65,15 45,15 35,30 C25,45 25,65 40,80 C50,90 70,90 80,80 C95,65 95,45 85,30 Z" />
              <path d="M20,40 C10,50 10,70 25,85 C35,95 55,95 65,85" stroke="currentColor" fill="none" strokeWidth="5" />
            </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight uppercase">Lloyds Bank</span>
          <span className="text-[10px] opacity-80 uppercase tracking-widest font-medium">Commercial Banking Online</span>
        </div>
      </div>
      
      <nav className="hidden md:flex gap-6 items-center text-sm font-medium">
        <a href="#" className="hover:opacity-80">Help & Security</a>
        <a href="#" className="hover:opacity-80">Cookie Policy</a>
      </nav>
    </header>
  );
};
