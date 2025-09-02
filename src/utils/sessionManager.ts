// Simplified session manager - no timeouts, users stay logged in until manual logout
interface SessionData {
  token: string;
  user: any;
  lastActivity: number;
  loginTime: number;
}

class SessionManager {
  private static instance: SessionManager;
  private logoutCallback: (() => void) | null = null;

  private constructor() {}

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
  }

  public updateActivity(): void {
    const sessionData = this.getSessionData();
    if (sessionData) {
      sessionData.lastActivity = Date.now();
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
    }
  }

  public clearSession(): void {
    localStorage.removeItem('sessionData');
  }

  public getSessionData(): SessionData | null {
    try {
      const data = localStorage.getItem('sessionData');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Always return true - no session expiration
  public isSessionValid(): boolean {
    const sessionData = this.getSessionData();
    return !!sessionData;
  }

  // Return a large number to indicate no expiration
  public getRemainingTime(): number {
    return 999999999; // Effectively infinite
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

    return {
      sessionAge,
      lastActivity,
      sessionRemaining: 999999999, // Effectively infinite
      activityRemaining: 999999999, // Effectively infinite
    };
  }
}

export default SessionManager.getInstance();
