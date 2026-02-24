import net from 'node:net';
import ping from 'ping';
import axios from 'axios';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { Server as ServerModel } from '../generated/prisma/client.js';
import type { Server as SocketIOServer } from 'socket.io';
import { sendAlert } from './notification.service.js';

interface CheckResult {
  status: 'up' | 'down' | 'degraded';
  responseTimeMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

async function performHttpCheck(url: string, threshold: number): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const responseTimeMs = Date.now() - start;
    const status = response.status >= 200 && response.status < 400
      ? (responseTimeMs > threshold ? 'degraded' : 'up')
      : 'degraded';
    return { status, responseTimeMs, statusCode: response.status, errorMessage: null };
  } catch (error: unknown) {
    const axiosErr = error as { response?: { status: number }; message?: string };
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      statusCode: axiosErr.response?.status ?? null,
      errorMessage: axiosErr.message ?? 'Unknown error',
    };
  }
}

function parseTcpTarget(url: string): { host: string; port: number } {
  const cleaned = url.replace(/^tcp:\/\//, '');
  const lastColon = cleaned.lastIndexOf(':');
  if (lastColon === -1) {
    return { host: cleaned, port: 22 };
  }
  const host = cleaned.substring(0, lastColon);
  const port = parseInt(cleaned.substring(lastColon + 1), 10);
  return { host, port: isNaN(port) ? 22 : port };
}

async function performTcpCheck(url: string, threshold: number): Promise<CheckResult> {
  const { host, port } = parseTcpTarget(url);

  if (!isValidHost(host)) {
    return { status: 'down', responseTimeMs: null, statusCode: null, errorMessage: `Invalid host: ${host}` };
  }

  const start = Date.now();
  const timeout = 10000;

  return new Promise<CheckResult>((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const responseTimeMs = Date.now() - start;
      socket.destroy();
      resolve({
        status: responseTimeMs > threshold ? 'degraded' : 'up',
        responseTimeMs,
        statusCode: null,
        errorMessage: null,
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({
        status: 'down',
        responseTimeMs: Date.now() - start,
        statusCode: null,
        errorMessage: `TCP connection to ${host}:${port} timed out`,
      });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({
        status: 'down',
        responseTimeMs: Date.now() - start,
        statusCode: null,
        errorMessage: `TCP ${host}:${port} - ${err.message}`,
      });
    });

    socket.connect(port, host);
  });
}

function isValidHost(host: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(host);
}

async function performPingCheck(url: string, threshold: number): Promise<CheckResult> {
  const cleaned = url.replace(/^ping:\/\//, '').replace(/^https?:\/\//, '');
  const host = cleaned.split('/')[0].split(':')[0];

  if (!isValidHost(host)) {
    return { status: 'down', responseTimeMs: null, statusCode: null, errorMessage: `Invalid host: ${host}` };
  }
  const start = Date.now();

  try {
    const result = await ping.promise.probe(host, { timeout: 10 });
    const rawTime = String(result.time);
    const responseTimeMs = rawTime === 'unknown' ? Date.now() - start : Math.round(Number(rawTime));

    if (result.alive) {
      return {
        status: responseTimeMs > threshold ? 'degraded' : 'up',
        responseTimeMs,
        statusCode: null,
        errorMessage: null,
      };
    }

    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      statusCode: null,
      errorMessage: `Ping to ${host} failed - host unreachable`,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      statusCode: null,
      errorMessage: `Ping ${host} - ${error.message ?? 'Unknown error'}`,
    };
  }
}

async function handleIncident(
  server: ServerModel,
  newStatus: string,
  previousStatus: string,
  prisma: PrismaClient,
  io: SocketIOServer,
): Promise<void> {
  // Status went bad → open incident
  if ((newStatus === 'down' || newStatus === 'degraded') && previousStatus !== 'down' && previousStatus !== 'degraded') {
    const incident = await prisma.incident.create({
      data: { serverId: server.id, status: newStatus },
    });
    io.emit('incident:created', { serverId: server.id, incident });
    console.log(`[INCIDENT] Opened for "${server.name}" — ${newStatus}`);
  }

  // Status recovered → close open incident
  if (newStatus === 'up' && (previousStatus === 'down' || previousStatus === 'degraded')) {
    const openIncident = await prisma.incident.findFirst({
      where: { serverId: server.id, resolvedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (openIncident) {
      const durationMs = Date.now() - openIncident.startedAt.getTime();
      const incident = await prisma.incident.update({
        where: { id: openIncident.id },
        data: { resolvedAt: new Date(), durationMs },
      });
      io.emit('incident:resolved', { serverId: server.id, incident });
      console.log(`[INCIDENT] Resolved for "${server.name}" — duration ${Math.round(durationMs / 1000)}s`);
    }
  }

  // Status changed between down ↔ degraded → update open incident
  if (
    (newStatus === 'down' && previousStatus === 'degraded') ||
    (newStatus === 'degraded' && previousStatus === 'down')
  ) {
    const openIncident = await prisma.incident.findFirst({
      where: { serverId: server.id, resolvedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (openIncident) {
      await prisma.incident.update({
        where: { id: openIncident.id },
        data: { status: newStatus },
      });
    }
  }
}

export async function checkServer(
  server: ServerModel,
  prisma: PrismaClient,
  io: SocketIOServer
): Promise<void> {
  let result: CheckResult;
  const threshold = (server as ServerModel & { degradedThresholdMs?: number }).degradedThresholdMs ?? 5000;

  switch (server.checkType) {
    case 'tcp':
      result = await performTcpCheck(server.url, threshold);
      break;
    case 'ping':
      result = await performPingCheck(server.url, threshold);
      break;
    default:
      result = await performHttpCheck(server.url, threshold);
      break;
  }

  // Save check record
  const check = await prisma.check.create({
    data: {
      serverId: server.id,
      status: result.status,
      responseTimeMs: result.responseTimeMs,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
    },
  });

  // Determine if status changed
  const previousStatus = server.status;
  if (result.status !== previousStatus) {
    await prisma.server.update({
      where: { id: server.id },
      data: { status: result.status },
    });

    io.emit('server:statusChanged', {
      serverId: server.id,
      previousStatus,
      newStatus: result.status,
      check,
    });

    // Handle incident lifecycle
    await handleIncident(server, result.status, previousStatus, prisma, io);

    // Send alert if server went down or degraded
    if (result.status === 'down' || result.status === 'degraded') {
      console.log(`[MONITOR] Server "${server.name}" changed ${previousStatus} → ${result.status}, sending alert...`);
      await sendAlert(server, result.status, prisma);
    }
  } else if (result.status === 'down' || result.status === 'degraded') {
    // Server is still down/degraded — resend alert every 5 minutes max
    const recentAlert = await prisma.notificationLog.findFirst({
      where: { serverId: server.id, success: true },
      orderBy: { sentAt: 'desc' },
    });
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!recentAlert || recentAlert.sentAt < fiveMinAgo) {
      console.log(`[MONITOR] Server "${server.name}" still ${result.status}, resending alert...`);
      await sendAlert(server, result.status, prisma);
    }
  }

  // Close orphaned incidents if server is up
  if (result.status === 'up') {
    const orphaned = await prisma.incident.findMany({
      where: { serverId: server.id, resolvedAt: null },
    });
    for (const inc of orphaned) {
      const durationMs = Date.now() - inc.startedAt.getTime();
      await prisma.incident.update({
        where: { id: inc.id },
        data: { resolvedAt: new Date(), durationMs },
      });
      console.log(`[INCIDENT] Closed orphaned incident for "${server.name}" — duration ${Math.round(durationMs / 1000)}s`);
    }
  }

  // Always emit the latest check for real-time updates
  io.emit('check:new', { serverId: server.id, check });
}
