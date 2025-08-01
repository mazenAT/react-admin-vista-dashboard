
import React from 'react';
import Sidebar from './Sidebar';
import SessionTimeoutWarning from './SessionTimeoutWarning';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const handleExtendSession = () => {
    // Session extension is handled by the SessionTimeoutWarning component
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <main className="p-8">
          {children}
        </main>
      </div>
      <SessionTimeoutWarning onExtendSession={handleExtendSession} />
    </div>
  );
};

export default DashboardLayout;
