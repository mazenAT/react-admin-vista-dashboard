// Session timeout duration: 8 hours in milliseconds
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

// Activity timeout duration: 30 minutes of inactivity
const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  token: string;
  user: any;
  lastActivity: number;
  loginTime: number;
}

class SessionManager {
  private static instance: SessionManager;
  private activityTimer: NodeJS.Timeout | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private logoutCallback: (() => void) | null = null;

  private constructor() {
    this.setupActivityListeners();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public setLogoutCallback(callback: () => void): void {
    this.logoutCallback = callback;
  }

  public startSession(token: string, user: any): void {
    const sessionData: SessionData = {
      token,
      user,
      lastActivity: Date.now(),
      loginTime: Date.now(),
    };

    localStorage.setItem('sessionData', JSON.stringify(sessionData));
    this.startTimers();
  }

  public updateActivity(): void {
    const sessionData = this.getSessionData();
    if (sessionData) {
      sessionData.lastActivity = Date.now();
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
      this.resetActivityTimer();
    }
  }

  public clearSession(): void {
    localStorage.removeItem('sessionData');
    this.clearTimers();
  }

  public getSessionData(): SessionData | null {
    try {
      const data = localStorage.getItem('sessionData');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public isSessionValid(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;

    const now = Date.now();
    const sessionAge = now - sessionData.loginTime;
    const lastActivity = now - sessionData.lastActivity;

    // Check if session has expired (8 hours)
    if (sessionAge > SESSION_TIMEOUT) {
      return false;
    }

    // Check if user has been inactive for too long (30 minutes)
    if (lastActivity > ACTIVITY_TIMEOUT) {
      return false;
    }

    return true;
  }

  public getRemainingTime(): number {
    const sessionData = this.getSessionData();
    if (!sessionData) return 0;

    const now = Date.now();
    const sessionAge = now - sessionData.loginTime;
    const lastActivity = now - sessionData.lastActivity;

    // Return the minimum of session timeout and activity timeout
    const sessionRemaining = SESSION_TIMEOUT - sessionAge;
    const activityRemaining = ACTIVITY_TIMEOUT - lastActivity;

    return Math.max(0, Math.min(sessionRemaining, activityRemaining));
  }

  public getSessionInfo(): {
    sessionAge: number;
    lastActivity: number;
    sessionRemaining: number;
    activityRemaining: number;
  } {
    const sessionData = this.getSessionData();
    if (!sessionData) {
      return {
        sessionAge: 0,
        lastActivity: 0,
        sessionRemaining: 0,
        activityRemaining: 0,
      };
    }

    const now = Date.now();
    const sessionAge = now - sessionData.loginTime;
    const lastActivity = now - sessionData.lastActivity;
    const sessionRemaining = Math.max(0, SESSION_TIMEOUT - sessionAge);
    const activityRemaining = Math.max(0, ACTIVITY_TIMEOUT - lastActivity);

    return {
      sessionAge,
      lastActivity,
      sessionRemaining,
      activityRemaining,
    };
  }

  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), true);
    });

    // Also track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    });
  }

  private startTimers(): void {
    this.clearTimers();
    
    // Check session validity every minute
    this.sessionTimer = setInterval(() => {
      if (!this.isSessionValid()) {
        this.handleSessionExpired();
      }
    }, 60000); // 1 minute

    // Reset activity timer
    this.resetActivityTimer();
  }

  private resetActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    this.activityTimer = setTimeout(() => {
      this.handleSessionExpired();
    }, ACTIVITY_TIMEOUT);
  }

  private clearTimers(): void {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  private handleSessionExpired(): void {
    this.clearSession();
    if (this.logoutCallback) {
      this.logoutCallback();
    }
  }
}

export default SessionManager.getInstance(); 