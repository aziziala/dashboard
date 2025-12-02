export interface SmsRecord {
  id?: number;
  contenu: string;
  date_envoi?: Date;
  telephone: string;
  type?: SmsType;
  status?: SmsStatus;
  date_reception?: Date;
  error_message?: string;
  retry_count?: number;
  max_retries?: number;
  gateway_response?: string;
  cost?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  metadata?: any;
  // Additional fields from SmsRecordDTO
  sqlId?: number;
  momt?: string;
  sender?: string;
  receiver?: string;
  msgData?: string;
  time?: number;
  smscId?: string;
  service?: string;
  account?: string;
  smsType?: number;
  mclass?: number;
  mwi?: number;
  coding?: number;
  compress?: number;
  validity?: number;
  deferred?: number;
  dlrMask?: number;
  dlrUrl?: string;
  pid?: number;
  altDcs?: number;
  rpi?: number;
  charset?: string;
  boxcId?: string;
  binfo?: string;
}

export enum SmsStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum SmsType {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
  NOTIFICATION = 'NOTIFICATION',
  VERIFICATION = 'VERIFICATION',
  MARKETING = 'MARKETING',
  ALERT = 'ALERT',
  SYSTEM = 'SYSTEM'
}

export interface SmsStatistics {
  totalSms: number;
  sentSms: number;
  deliveredSms: number;
  failedSms: number;
  pendingSms: number;
  successRate: number;
  totalCost: number;
  averageDeliveryTime: number;
  smsByType: { [key in SmsType]: number };
  smsByStatus: { [key in SmsStatus]: number };
  dailyVolume: DailySmsVolume[];
  hourlyDistribution: HourlySmsDistribution[];
}

export interface DailySmsVolume {
  date: string;
  incoming: number;
  outgoing: number;
  total: number;
}

export interface HourlySmsDistribution {
  hour: number;
  count: number;
  percentage: number;
}

export interface SmsFilter {
  phone?: string;
  type?: SmsType;
  status?: SmsStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  content?: string;
  priority?: string;
  tags?: string[];
  gateway?: string;
  costRange?: {
    min: number;
    max: number;
  };
}

export interface SmsTemplate {
  id?: number;
  name: string;
  content: string;
  type: SmsType;
  category: string;
  variables?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  usageCount: number;
}

export interface SmsGateway {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'maintenance';
  priority: number;
  costPerSms: number;
  deliveryRate: number;
  responseTime: number;
  lastTested?: Date;
  credentials: any;
  settings: any;
}

export interface SmsQueue {
  id: number;
  smsRecord: SmsRecord;
  priority: number;
  scheduledTime?: Date;
  retryCount: number;
  maxRetries: number;
  gatewayId?: string;
  status: 'queued' | 'processing' | 'sent' | 'failed';
  createdAt: Date;
  processedAt?: Date;
}

export interface SmsError {
  id?: number;
  smsRecordId: number;
  errorCode: string;
  errorMessage: string;
  errorType: 'gateway' | 'validation' | 'system' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface SmsNotification {
  id?: number;
  type: 'delivery_status' | 'gateway_error' | 'quota_exceeded' | 'cost_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: any;
}

export interface SmsCost {
  id?: number;
  date: string;
  gatewayId: string;
  smsCount: number;
  totalCost: number;
  averageCost: number;
  currency: string;
  breakdown: {
    delivered: { count: number; cost: number };
    failed: { count: number; cost: number };
    pending: { count: number; cost: number };
  };
}

export interface SmsComplianceRule {
  id?: number;
  name: string;
  description: string;
  ruleType: 'content' | 'recipient' | 'timing' | 'volume';
  conditions: any[];
  actions: string[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SmsAutomation {
  id?: number;
  name: string;
  description: string;
  trigger: {
    type: 'event' | 'schedule' | 'condition';
    event?: string;
    schedule?: string;
    condition?: any;
  };
  actions: {
    type: 'send_sms' | 'update_status' | 'create_record' | 'webhook';
    config: any;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastExecuted?: Date;
  executionCount: number;
}

export interface SmsHealthMetrics {
  gatewayStatus: { [key: string]: 'healthy' | 'warning' | 'critical' };
  deliveryRate: number;
  averageResponseTime: number;
  errorRate: number;
  queueSize: number;
  activeConnections: number;
  lastHealthCheck: Date;
}

export interface SmsPerformanceMetrics {
  throughput: number; // SMS per second
  latency: number; // Average response time
  availability: number; // Uptime percentage
  reliability: number; // Success rate
  efficiency: number; // Cost per successful SMS
  capacity: number; // Maximum SMS per hour
}

export interface SmsDeliveryReport {
  smsId: number;
  phone: string;
  status: SmsStatus;
  deliveredAt?: Date;
  gatewayResponse: string;
  deliveryAttempts: number;
  cost: number;
  gatewayId: string;
  route: string;
  messageId?: string;
}

export interface SmsUsageReport {
  period: string;
  totalSms: number;
  totalCost: number;
  byType: { [key in SmsType]: { count: number; cost: number } };
  byStatus: { [key in SmsStatus]: { count: number; cost: number } };
  byGateway: { [key: string]: { count: number; cost: number } };
  trends: {
    volume: number[];
    cost: number[];
    successRate: number[];
  };
}
