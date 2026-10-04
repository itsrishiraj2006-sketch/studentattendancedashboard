import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Ensure dark mode is active everywhere across the app
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#111216';
    document.body.style.color = '#F3F4F6';
  }, []);

  return (
    <div className="min-h-screen bg-[#111216] text-white flex flex-col">
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto w-full bg-[#111216]">
          {children}
        </main>
      </div>
    </div>
  );
}
