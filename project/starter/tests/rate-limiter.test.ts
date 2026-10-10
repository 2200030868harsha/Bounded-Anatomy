import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RATE_LIMITS,
  RateLimiter,
  withRateLimit
} from '../src/utils/rate-limiter.js';

describe('RateLimiter', () => {
  describe('Configuration', () => {
    it('should use the default rate limits', () => {
      expect(DEFAULT_RATE_LIMITS.maxRequestsPerMinute).toBe(50);
      expect(DEFAULT_RATE_LIMITS.maxTokensPerMinute).toBe(100000);
      expect(DEFAULT_RATE_LIMITS.maxConcurrent).toBe(5);
    });

    it('should accept custom rate limits', () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 5000,
        maxConcurrent: 2
      });

      expect(limiter.canProceed(1000)).toBe(true);
    });
  });

  describe('canProceed', () => {
    it('should allow a request when limits are available', () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 5,
        maxTokensPerMinute: 5000,
        maxConcurrent: 2
      });

      expect(limiter.canProceed(1000)).toBe(true);
    });

    it('should reject a request when token limit would be exceeded', async () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 5,
        maxTokensPerMinute: 1000,
        maxConcurrent: 2
      });

      await limiter.acquire(1000);

      expect(limiter.canProceed(1)).toBe(false);

      limiter.release();
    });

    it('should reject a request when concurrent limit is reached', async () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 10000,
        maxConcurrent: 1
      });

      await limiter.acquire(1000);

      expect(limiter.canProceed(1000)).toBe(false);

      limiter.release();
    });
  });

  describe('acquire and release', () => {
    it('should track an acquired request', async () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 10000,
        maxConcurrent: 2
      });

      await limiter.acquire(500);

      const status = limiter.getStatus();

      expect(status.activeRequests).toBe(1);
      expect(status.requestsInWindow).toBe(1);
      expect(status.tokensInWindow).toBe(500);

      limiter.release();

      expect(limiter.getStatus().activeRequests).toBe(0);
    });

    it('should update token usage when actual tokens are provided', async () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 10000,
        maxConcurrent: 2
      });

      await limiter.acquire(500);
      limiter.release(800);

      expect(limiter.getStatus().tokensInWindow).toBe(800);
    });
  });

  describe('getStatus', () => {
    it('should report available requests and tokens', async () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 5000,
        maxConcurrent: 2
      });

      await limiter.acquire(1000);

      const status = limiter.getStatus();

      expect(status.activeRequests).toBe(1);
      expect(status.requestsInWindow).toBe(1);
      expect(status.tokensInWindow).toBe(1000);
      expect(status.availableRequests).toBe(9);
      expect(status.availableTokens).toBe(4000);

      limiter.release();
    });
  });

  describe('withRateLimit', () => {
    it('should execute the function and return its result', async () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 10000,
        maxConcurrent: 2
      });

      const result = await withRateLimit(
        limiter,
        async () => 'success',
        500
      );

      expect(result).toBe('success');
      expect(limiter.getStatus().activeRequests).toBe(0);
    });

    it('should release the request when the function fails', async () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 10000,
        maxConcurrent: 2
      });

      await expect(
        withRateLimit(
          limiter,
          async () => {
            throw new Error('operation failed');
          },
          500
        )
      ).rejects.toThrow('operation failed');

      expect(limiter.getStatus().activeRequests).toBe(0);
    });
  });
});
