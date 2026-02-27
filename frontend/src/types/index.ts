export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface Server {
  id: string;
  name: string;
  url: string;
  checkType: string;
  intervalSec: number;
  degradedThresholdMs: number;
  status: string;
  enabled: boolean;
  isPublic: boolean;
  createdById?: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Check {
  id: string;
  serverId: string;
  status: string;
  responseTimeMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

export interface NotificationSetting {
  id: string;
  serverId?: string | null;
  type: string;
  destination: string;
  triggerOn: string;
  enabled: boolean;
}

export interface Incident {
  id: string;
  serverId: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
  durationMs: number | null;
  server?: { id: string; name: string; url: string };
}

export interface AuthResponse {
  token: string;
  user: User;
}
