import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import sessionManager from '@/utils/sessionManager';

interface SessionTimeoutWarningProps {
  onExtendSession: () => void;
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({ onExtendSession }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const checkSession = () => {
      const sessionInfo = sessionManager.getSessionInfo();
      const remaining = Math.min(sessionInfo.sessionRemaining, sessionInfo.activityRemaining);
      
      // Show warning when 5 minutes remaining
      if (remaining <= 5 * 60 * 1000 && remaining > 0) {
        setRemainingTime(remaining);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);
    checkSession(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const handleExtendSession = () => {
    sessionManager.updateActivity();
    onExtendSession();
    setShowWarning(false);
    toast.success('Session extended');
  };

  const handleLogout = () => {
    sessionManager.clearSession();
    window.location.href = '/login';
  };

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Timeout Warning</DialogTitle>
          <DialogDescription>
            Your session will expire in {formatTime(remainingTime)}. 
            Would you like to extend your session?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleLogout}>
            Logout Now
          </Button>
          <Button onClick={handleExtendSession}>
            Extend Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeoutWarning; 