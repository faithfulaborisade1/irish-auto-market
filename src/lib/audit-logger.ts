// src/lib/audit-logger.ts - FIXED TypeScript Issues
import { prisma } from '@/lib/database';

// Define proper enum types that match Prisma schema
export type AdminAction = 
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
  | 'USER_CREATE' | 'USER_EDIT' | 'USER_DELETE' | 'USER_DISABLE' | 'USER_ENABLE'
  | 'CAR_CREATE' | 'CAR_EDIT' | 'CAR_DELETE' | 'CAR_APPROVE' | 'CAR_REJECT'
  | 'ADMIN_CREATE' | 'ADMIN_EDIT' | 'ADMIN_DELETE'
  | 'SYSTEM_CONFIG' | 'SYSTEM_BACKUP' | 'SYSTEM_SHUTDOWN'
  | 'FINANCIAL_TRANSFER' | 'FINANCIAL_REFUND' | 'FINANCIAL_ADJUSTMENT'
  | 'CSRF_TOKEN_GENERATED' | 'PERMISSION_CHANGE' | 'ROLE_CHANGE';

export type SecurityEventType = 
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGIN_RATE_LIMITED'
  | 'SUSPICIOUS_USER_AGENT' | 'SUSPICIOUS_SCRIPT_INJECTION' | 'SUSPICIOUS_SQL_INJECTION'
  | 'RATE_LIMIT_EXCEEDED' | 'CSRF_VIOLATION' | 'UNAUTHORIZED_ACCESS'
  | 'BRUTE_FORCE_ATTEMPT' | 'MULTIPLE_FAILED_LOGINS' | 'INVALID_TOKEN'
  | 'CSRF_TOKEN_MISSING' | 'CSRF_TOKEN_INVALID' | 'CSRF_TOKEN_EXPIRED'
  | 'CSRF_TOKEN_ADMIN_MISMATCH' | 'CSRF_TOKEN_IP_MISMATCH' | 'CSRF_TOKEN_UNAUTHORIZED'
  | 'CSRF_TOKEN_ERROR' | 'CSRF_TOKEN_GENERATION_FAILED'
  | 'ADMIN_SESSION_INVALID' | 'ADMIN_SESSION_EXPIRED' | 'ADMIN_SESSION_HIJACK'
  | 'IP_BLOCKED' | 'PERMANENT_IP_BLOCK' | 'SUSPICIOUS_ACTIVITY'
  | 'AUTHENTICATION_FAILED' | 'AUTHORIZATION_FAILED' | 'TOKEN_VALIDATION_FAILED';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLogEntry {
  adminId?: string | null;
  action: AdminAction;
  resource?: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: any;
  severity: SeverityLevel;
  success: boolean;
  errorMessage?: string;
}

export interface SecurityEvent {
  type: SecurityEventType;
  ip: string;
  userAgent: string;
  path: string;
  metadata?: any;
  riskLevel: RiskLevel;
  blocked: boolean;
}

class AuditLogger {
  private static instance: AuditLogger;
  private logQueue: AuditLogEntry[] = [];
  private securityQueue: SecurityEvent[] = [];
  private isProcessing = false;
  
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Admin Action Logging with proper typing
  async logAdminAction(entry: Omit<AuditLogEntry, 'severity'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      severity: this.calculateSeverity(entry.action, entry.success)
    };

    // Immediate console logging for critical events
    if (auditEntry.severity === 'CRITICAL' || auditEntry.severity === 'HIGH') {
      console.error(`🚨 CRITICAL ADMIN ACTION: ${JSON.stringify(auditEntry)}`);
    }

    // Queue for database storage
    this.logQueue.push(auditEntry);
    this.processQueue();
  }

  // Security Event Logging with proper typing
  async logSecurityEvent(event: Omit<SecurityEvent, 'riskLevel'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      riskLevel: this.calculateSecurityRisk(event.type, event.blocked)
    };

    // Immediate alerting for high-risk events
    if (securityEvent.riskLevel === 'CRITICAL' || securityEvent.riskLevel === 'HIGH') {
      console.error(`🚨 SECURITY THREAT: ${JSON.stringify(securityEvent)}`);
      
      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        await this.sendSecurityAlert(securityEvent);
      }
    }

    this.securityQueue.push(securityEvent);
    this.processQueue();
  }

  // Specific logging methods for common admin actions
  async logUserAction(
    adminId: string, 
    action: 'CREATE' | 'EDIT' | 'DELETE' | 'DISABLE' | 'ENABLE', 
    targetUserId: string, 
    ip: string, 
    userAgent: string, 
    success: boolean, 
    details?: any
  ): Promise<void> {
    await this.logAdminAction({
      adminId,
      action: `USER_${action}` as AdminAction,
      resource: 'user',
      resourceId: targetUserId,
      ipAddress: ip,
      userAgent,
      success,
      metadata: details
    });
  }

  async logCarAction(
    adminId: string, 
    action: 'CREATE' | 'EDIT' | 'DELETE' | 'APPROVE' | 'REJECT', 
    carId: string, 
    ip: string, 
    userAgent: string, 
    success: boolean, 
    details?: any
  ): Promise<void> {
    await this.logAdminAction({
      adminId,
      action: `CAR_${action}` as AdminAction,
      resource: 'car',
      resourceId: carId,
      ipAddress: ip,
      userAgent,
      success,
      metadata: details
    });
  }

  async logSystemAction(
    adminId: string, 
    action: 'CONFIG' | 'BACKUP' | 'SHUTDOWN', 
    ip: string, 
    userAgent: string, 
    success: boolean, 
    details?: any
  ): Promise<void> {
    await this.logAdminAction({
      adminId,
      action: `SYSTEM_${action}` as AdminAction,
      resource: 'system',
      ipAddress: ip,
      userAgent,
      success,
      metadata: details
    });
  }

  async logFinancialAction(
    adminId: string, 
    action: 'TRANSFER' | 'REFUND' | 'ADJUSTMENT', 
    amount: number, 
    ip: string, 
    userAgent: string, 
    success: boolean, 
    details?: any
  ): Promise<void> {
    await this.logAdminAction({
      adminId,
      action: `FINANCIAL_${action}` as AdminAction,
      resource: 'financial',
      ipAddress: ip,
      userAgent,
      success,
      metadata: { amount, ...details }
    });
  }

  // Security event helpers with proper typing
  async logLoginAttempt(
    ip: string, 
    userAgent: string, 
    email: string, 
    success: boolean, 
    reason?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      ip,
      userAgent,
      path: '/api/admin/auth/login',
      metadata: { 
        email: this.maskEmail(email), 
        reason,
        timestamp: new Date().toISOString()
      },
      blocked: !success
    });
  }

  async logSuspiciousActivity(
    type: 'USER_AGENT' | 'SCRIPT_INJECTION' | 'SQL_INJECTION', 
    ip: string, 
    userAgent: string, 
    path: string, 
    details: any
  ): Promise<void> {
    await this.logSecurityEvent({
      type: `SUSPICIOUS_${type}` as SecurityEventType,
      ip,
      userAgent,
      path,
      metadata: details,
      blocked: true
    });
  }

  async logRateLimitViolation(
    ip: string, 
    userAgent: string, 
    path: string, 
    attemptCount: number
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      userAgent,
      path,
      metadata: { attemptCount, timestamp: new Date().toISOString() },
      blocked: true
    });
  }

  // Process queued logs
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Process audit logs
      while (this.logQueue.length > 0) {
        const batch = this.logQueue.splice(0, 10); // Process in batches
        await this.storeBatchAuditLogs(batch);
      }
      
      // Process security events
      while (this.securityQueue.length > 0) {
        const batch = this.securityQueue.splice(0, 10);
        await this.storeBatchSecurityEvents(batch);
      }
    } catch (error) {
      console.error('Failed to process audit queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async storeBatchAuditLogs(logs: AuditLogEntry[]): Promise<void> {
    try {
      await prisma.adminAuditLog.createMany({
        data: logs.map(log => ({
          adminId: log.adminId || null,
          action: log.action,
          resource: log.resource || null,
          resourceId: log.resourceId || null,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent.substring(0, 500),
          metadata: log.metadata || {},
          severity: log.severity,
          success: log.success,
          errorMessage: log.errorMessage || null,
          timestamp: new Date()
        }))
      });
    } catch (error) {
      console.error('Failed to store audit logs:', error);
      // Re-queue failed logs for retry
      this.logQueue.unshift(...logs);
    }
  }

  private async storeBatchSecurityEvents(events: SecurityEvent[]): Promise<void> {
    try {
      await prisma.securityEvent.createMany({
        data: events.map(event => ({
          type: event.type,
          ipAddress: event.ip,
          userAgent: event.userAgent.substring(0, 500),
          path: event.path,
          metadata: event.metadata || {},
          riskLevel: event.riskLevel,
          blocked: event.blocked,
          timestamp: new Date()
        }))
      });
    } catch (error) {
      console.error('Failed to store security events:', error);
      this.securityQueue.unshift(...events);
    }
  }

  private calculateSeverity(action: AdminAction, success: boolean): SeverityLevel {
    if (!success) {
      // Failed actions are generally more severe
      const criticalActions: AdminAction[] = ['USER_DELETE', 'SYSTEM_SHUTDOWN', 'FINANCIAL_TRANSFER'];
      const highActions: AdminAction[] = ['USER_DISABLE', 'CAR_DELETE', 'ADMIN_CREATE', 'SYSTEM_CONFIG'];
      
      if (criticalActions.includes(action)) return 'CRITICAL';
      if (highActions.includes(action)) return 'HIGH';
      return 'MEDIUM';
    }

    // Successful actions
    const criticalActions: AdminAction[] = ['USER_DELETE', 'ADMIN_DELETE', 'SYSTEM_SHUTDOWN'];
    const highActions: AdminAction[] = ['USER_DISABLE', 'FINANCIAL_TRANSFER', 'SYSTEM_CONFIG'];
    const mediumActions: AdminAction[] = ['CAR_DELETE', 'USER_EDIT', 'LOGIN'];

    if (criticalActions.includes(action)) return 'CRITICAL';
    if (highActions.includes(action)) return 'HIGH';
    if (mediumActions.includes(action)) return 'MEDIUM';
    
    return 'LOW';
  }

  private calculateSecurityRisk(type: SecurityEventType, blocked: boolean): RiskLevel {
    const criticalEvents: SecurityEventType[] = [
      'SUSPICIOUS_SQL_INJECTION', 
      'BRUTE_FORCE_ATTEMPT', 
      'ADMIN_SESSION_HIJACK',
      'PERMANENT_IP_BLOCK'
    ];
    
    const highEvents: SecurityEventType[] = [
      'RATE_LIMIT_EXCEEDED', 
      'INVALID_TOKEN', 
      'SUSPICIOUS_USER_AGENT', 
      'MULTIPLE_FAILED_LOGINS',
      'CSRF_TOKEN_ADMIN_MISMATCH',
      'CSRF_TOKEN_IP_MISMATCH',
      'ADMIN_SESSION_INVALID',
      'AUTHENTICATION_FAILED',
      'AUTHORIZATION_FAILED'
    ];
    
    const mediumEvents: SecurityEventType[] = [
      'LOGIN_FAILED', 
      'CSRF_VIOLATION',
      'CSRF_TOKEN_MISSING',
      'CSRF_TOKEN_INVALID',
      'CSRF_TOKEN_EXPIRED',
      'CSRF_TOKEN_UNAUTHORIZED',
      'CSRF_TOKEN_ERROR',
      'TOKEN_VALIDATION_FAILED'
    ];

    let baseRisk: RiskLevel = 'LOW';
    
    if (criticalEvents.includes(type)) baseRisk = 'CRITICAL';
    else if (highEvents.includes(type)) baseRisk = 'HIGH';
    else if (mediumEvents.includes(type)) baseRisk = 'MEDIUM';

    // Increase risk if the attack was not blocked
    if (!blocked && baseRisk !== 'LOW') {
      const riskLevels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const currentIndex = riskLevels.indexOf(baseRisk);
      if (currentIndex < riskLevels.length - 1) {
        baseRisk = riskLevels[currentIndex + 1];
      }
    }

    return baseRisk;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 3) return email;
    return local.substring(0, 3) + '***@' + domain;
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    console.error(`🚨 SECURITY ALERT: ${event.type} from ${event.ip} - Risk: ${event.riskLevel}`);
  }

  // Fixed utility methods for reports and analysis
  async getAdminActivitySummary(adminId: string, days: number = 30): Promise<any> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    try {
      return await prisma.adminAuditLog.groupBy({
        by: ['action', 'severity'],
        where: {
          adminId,
          timestamp: { gte: since }
        },
        _count: true
      });
    } catch (error) {
      console.error('Failed to get admin activity summary:', error);
      return [];
    }
  }

  async getSecurityThreatSummary(days: number = 7): Promise<any> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    try {
      return await prisma.securityEvent.groupBy({
        by: ['type', 'riskLevel'],
        where: {
          timestamp: { gte: since }
        },
        _count: true,
        orderBy: {
          _count: {
            type: 'desc'
          }
        }
      });
    } catch (error) {
      console.error('Failed to get security threat summary:', error);
      return [];
    }
  }

  // Fixed method - use proper aggregation approach
  async getHighRiskIPs(days: number = 7): Promise<string[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    try {
      // Get all high-risk events first, then group in application logic
      const highRiskEvents = await prisma.securityEvent.findMany({
        where: {
          timestamp: { gte: since },
          riskLevel: { in: ['HIGH', 'CRITICAL'] }
        },
        select: {
          ipAddress: true
        }
      });

      // Count occurrences per IP in application logic
      const ipCounts = new Map<string, number>();
      highRiskEvents.forEach(event => {
        const currentCount = ipCounts.get(event.ipAddress) || 0;
        ipCounts.set(event.ipAddress, currentCount + 1);
      });

      // Filter IPs with more than 5 events
      return Array.from(ipCounts.entries())
        .filter(([ip, count]) => count > 5)
        .map(([ip, count]) => ip);
    } catch (error) {
      console.error('Failed to get high-risk IPs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Helper functions for easy use in route handlers
export async function logAdminAction(
  adminId: string | null | undefined,
  action: AdminAction,
  resource: string,
  resourceId: string,
  ip: string,
  userAgent: string,
  success: boolean,
  details?: any
): Promise<void> {
  await auditLogger.logAdminAction({
    adminId: adminId || null, // Convert undefined to null
    action,
    resource,
    resourceId,
    ipAddress: ip,
    userAgent,
    success,
    metadata: details
  });
}

export async function logSecurityThreat(
  type: SecurityEventType,
  ip: string,
  userAgent: string,
  path: string,
  blocked: boolean,
  details?: any
): Promise<void> {
  await auditLogger.logSecurityEvent({
    type,
    ip,
    userAgent,
    path,
    blocked,
    metadata: details
  });
}