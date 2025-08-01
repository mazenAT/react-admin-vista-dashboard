import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import sessionManager from '@/utils/sessionManager';

const SessionInfo: React.FC = () => {
  const [sessionInfo, setSessionInfo] = useState(sessionManager.getSessionInfo());
  const [isLow, setIsLow] = useState(false);

  useEffect(() => {
    const updateSessionInfo = () => {
      const info = sessionManager.getSessionInfo();
      setSessionInfo(info);
      
      // Check if session is running low (less than 30 minutes)
      const remaining = Math.min(info.sessionRemaining, info.activityRemaining);
      setIsLow(remaining < 30 * 60 * 1000 && remaining > 0);
    };

    // Update every minute
    const interval = setInterval(updateSessionInfo, 60000);
    updateSessionInfo(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const formatTime = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatLastActivity = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  const handleExtendSession = () => {
    sessionManager.updateActivity();
    setSessionInfo(sessionManager.getSessionInfo());
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center space-x-2 ${
            isLow ? 'text-orange-600 hover:text-orange-700' : 'text-gray-600 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          {isLow && <AlertTriangle className="w-4 h-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Session Status</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExtendSession}
            >
              Extend
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Session Age:</span>
              <span className="text-sm font-medium">
                {formatTime(sessionInfo.sessionAge)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Activity:</span>
              <span className="text-sm font-medium">
                {formatLastActivity(sessionInfo.lastActivity)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Session Remaining:</span>
              <span className={`text-sm font-medium ${
                sessionInfo.sessionRemaining < 30 * 60 * 1000 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {formatTime(sessionInfo.sessionRemaining)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Activity Remaining:</span>
              <span className={`text-sm font-medium ${
                sessionInfo.activityRemaining < 5 * 60 * 1000 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatTime(sessionInfo.activityRemaining)}
              </span>
            </div>
          </div>
          
          {isLow && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  Session will expire soon. Click "Extend" to continue.
                </span>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SessionInfo; 