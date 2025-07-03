// src/lib/audit-logger.ts - FIXED to match Prisma schema
import { prisma } from '@/lib/database';
import { AdminAction, ResourceType, LogSeverity, SecurityEventType, SecuritySeverity } from '@prisma/client';

// Use Prisma-generated types directly
export type { AdminAction, ResourceType, LogSeverity, SecurityEventType, SecuritySeverity };

export interface AuditLogEntry {
  adminId?: string | null;
  action: AdminAction;
  resourceType?: ResourceType | null;  // ✅ FIXED: Use resourceType not resource
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint?: string;
  oldValues?: any;
  newValues?: any;
  description?: string;
  severity: LogSeverity;
  tags?: any;
}

export interface SecurityEvent {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  targetUserId?: string;
  targetIP?: string;
  targetResource?: string;
  userAgent?: string;
  endpoint?: string;
  requestData?: any;
  blocked?: boolean;
  action?: string;
  detectionMethod?: string;
  riskScore?: number;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
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

  // Admin Action Logging with proper Prisma types
  async logAdminAction(entry: AuditLogEntry): Promise<void> {
    // Immediate console logging for critical events
    if (entry.severity === LogSeverity.CRITICAL || entry.severity === LogSeverity.ERROR) {
      console.error(`🚨 CRITICAL ADMIN ACTION: ${JSON.stringify(entry)}`);
    }

    // Queue for database storage
    this.logQueue.push(entry);
    this.processQueue();
  }

  // Security Event Logging with proper Prisma types
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Immediate alerting for high-risk events
    if (event.severity === SecuritySeverity.CRITICAL || event.severity === SecuritySeverity.HIGH) {
      console.error(`🚨 SECURITY THREAT: ${JSON.stringify(event)}`);
      
      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        await this.sendSecurityAlert(event);
      }
    }

    this.securityQueue.push(event);
    this.processQueue();
  }

  // Specific logging methods for common admin actions
  async logUserAction(
    adminId: string, 
    action: AdminAction, 
    targetUserId: string, 
    ip: string, 
    userAgent: string, 
    details?: any
  ): Promise<void> {
    await this.logAdminAction({
      adminId,
      action,
      resourceType: ResourceType.USER,
      resourceId: targetUserId,
      ipAddress: ip,
      userAgent,
      severity: LogSeverity.INFO,
      newValues: details
    });
  }

  async logCarAction(
    adminId: string, 
    action: AdminAction, 
    carId: string, 
    ip: string, 
    userAgent: string, 
    details?: any
  ): Promise<void> {
    await this.logAdminAction({
      adminId,
      action,
      resourceType: ResourceType.CAR,
      resourceId: carId,
      ipAddress: ip,
      userAgent,
      severity: LogSeverity.INFO,
      newValues: details
    });
  }

  async logSystemAction(
    adminId: string, 
    action: AdminAction, 
    ip: string, 
    userAgent: string, 
    details?: any
  ): Promise<void> {
    await this.logAdminAction({
      adminId,
      action,
      resourceType: ResourceType.SYSTEM_SETTING,
      ipAddress: ip,
      userAgent,
      severity: LogSeverity.WARNING,
      newValues: details
    });
  }

  async logFinancialAction(
    adminId: string, 
    action: AdminAction, 
    amount: number, 
    ip: string, 
    userAgent: string, 
    details?: any
  ): Promise<void> {
    await this.logAdminAction({
      adminId,
      action,
      resourceType: ResourceType.REVENUE_RECORD,
      ipAddress: ip,
      userAgent,
      severity: LogSeverity.WARNING,
      newValues: { amount, ...details }
    });
  }

  // Security event helpers with proper Prisma types
  async logLoginAttempt(
    ip: string, 
    userAgent: string, 
    email: string, 
    success: boolean, 
    reason?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: success ? SecurityEventType.FAILED_LOGIN : SecurityEventType.FAILED_LOGIN,
      severity: success ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM,
      description: success ? 'Successful login' : `Failed login: ${reason || 'Unknown reason'}`,
      targetIP: ip,
      userAgent,
      endpoint: '/api/admin/auth/login',
      requestData: { 
        email: this.maskEmail(email), 
        reason,
        timestamp: new Date().toISOString()
      },
      blocked: !success
    });
  }

  async logSuspiciousActivity(
    type: SecurityEventType, 
    ip: string, 
    userAgent: string, 
    path: string, 
    details: any
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: type,
      severity: SecuritySeverity.HIGH,
      description: `Suspicious activity detected: ${type}`,
      targetIP: ip,
      userAgent,
      endpoint: path,
      requestData: details,
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
      eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecuritySeverity.MEDIUM,
      description: `Rate limit exceeded: ${attemptCount} attempts`,
      targetIP: ip,
      userAgent,
      endpoint: path,
      requestData: { attemptCount, timestamp: new Date().toISOString() },
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

  // ✅ FIXED: Use correct field names from Prisma schema
  private async storeBatchAuditLogs(logs: AuditLogEntry[]): Promise<void> {
    try {
      await prisma.adminAuditLog.createMany({
        data: logs.map(log => ({
          adminId: log.adminId || '',  // AdminAuditLog.adminId is required in your schema
          action: log.action,
          resourceType: log.resourceType || ResourceType.USER,  // ✅ FIXED: Use resourceType
          resourceId: log.resourceId,
          oldValues: log.oldValues,
          newValues: log.newValues,
          description: log.description,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent?.substring(0, 500),
          endpoint: log.endpoint,
          severity: log.severity,
          tags: log.tags,
          // createdAt is auto-generated by Prisma
        }))
      });
    } catch (error) {
      console.error('Failed to store audit logs:', error);
      // Re-queue failed logs for retry
      this.logQueue.unshift(...logs);
    }
  }

  // ✅ FIXED: Use correct field names from SecurityEvent schema
  private async storeBatchSecurityEvents(events: SecurityEvent[]): Promise<void> {
    try {
      await prisma.securityEvent.createMany({
        data: events.map(event => ({
          eventType: event.eventType,
          severity: event.severity,
          description: event.description,
          targetUserId: event.targetUserId,
          targetIP: event.targetIP,
          targetResource: event.targetResource,
          userAgent: event.userAgent?.substring(0, 500),
          endpoint: event.endpoint,
          requestData: event.requestData,
          blocked: event.blocked || false,
          action: event.action,
          detectionMethod: event.detectionMethod,
          riskScore: event.riskScore,
          resolved: event.resolved || false,
          resolvedBy: event.resolvedBy,
          resolvedAt: event.resolvedAt,
          resolution: event.resolution,
          // createdAt is auto-generated by Prisma
        }))
      });
    } catch (error) {
      console.error('Failed to store security events:', error);
      this.securityQueue.unshift(...events);
    }
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 3) return email;
    return local.substring(0, 3) + '***@' + domain;
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    console.error(`🚨 SECURITY ALERT: ${event.eventType} from ${event.targetIP} - Severity: ${event.severity}`);
  }

  // Fixed utility methods for reports and analysis
  async getAdminActivitySummary(adminId: string, days: number = 30): Promise<any> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    try {
      return await prisma.adminAuditLog.groupBy({
        by: ['action', 'severity'],
        where: {
          adminId,
          createdAt: { gte: since }  // ✅ FIXED: Use createdAt not timestamp
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
        by: ['eventType', 'severity'],  // ✅ FIXED: Use eventType not type
        where: {
          createdAt: { gte: since }  // ✅ FIXED: Use createdAt not timestamp
        },
        _count: true,
        orderBy: {
          _count: {
            eventType: 'desc'  // ✅ FIXED: Use eventType
          }
        }
      });
    } catch (error) {
      console.error('Failed to get security threat summary:', error);
      return [];
    }
  }

  async getHighRiskIPs(days: number = 7): Promise<string[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    try {
      const highRiskEvents = await prisma.securityEvent.findMany({
        where: {
          createdAt: { gte: since },  // ✅ FIXED: Use createdAt
          severity: { in: [SecuritySeverity.HIGH, SecuritySeverity.CRITICAL] }
        },
        select: {
          targetIP: true  // ✅ FIXED: Use targetIP not ipAddress
        }
      });

      // Count occurrences per IP in application logic
      const ipCounts = new Map<string, number>();
      highRiskEvents.forEach(event => {
        if (event.targetIP) {
          const currentCount = ipCounts.get(event.targetIP) || 0;
          ipCounts.set(event.targetIP, currentCount + 1);
        }
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
  resourceType: ResourceType,
  resourceId: string,
  ip: string,
  userAgent: string,
  details?: any
): Promise<void> {
  await auditLogger.logAdminAction({
    adminId: adminId || undefined,
    action,
    resourceType,
    resourceId,
    ipAddress: ip,
    userAgent,
    severity: LogSeverity.INFO,
    newValues: details
  });
}

export async function logSecurityThreat(
  eventType: SecurityEventType,
  ip: string,
  userAgent: string,
  path: string,
  blocked: boolean,
  details?: any
): Promise<void> {
  await auditLogger.logSecurityEvent({
    eventType,
    severity: blocked ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM,
    description: `Security event: ${eventType}`,
    targetIP: ip,
    userAgent,
    endpoint: path,
    blocked,
    requestData: details
  });
}