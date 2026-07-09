import type { Response } from 'express';

export type StreamEventPayload = {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
};

export function initSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

export function sendSSE(
  res: Response,
  type: string,
  data: Record<string, unknown>,
) {
  const payload: StreamEventPayload = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };

  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}
