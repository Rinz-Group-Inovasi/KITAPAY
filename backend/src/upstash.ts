import { Redis } from '@upstash/redis';
import { Client as QStashClient } from '@upstash/qstash';

// Initialize Redis client for Caching and Rate Limiting
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Initialize QStash client for Webhook Queuing
export const qstashClient = new QStashClient({
  token: process.env.QSTASH_TOKEN || '',
});
