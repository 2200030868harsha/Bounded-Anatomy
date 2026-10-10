import { describe, expect, it, vi } from 'vitest';

import {
  ErrorCodes,
  ReviewError,
  formatError,
  isReviewError,
  withRetry,
  withTimeout
} from '../src/utils/error-handler.js';

describe('error-handler', () => {
  describe('ReviewError', () => {
    it('should create a ReviewError with code and metadata', () => {
      const error = new ReviewError(
        'Something failed',
        ErrorCodes.AGENT_FAILED,
        { attempt: 2 }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ReviewError);
      expect(error.name).toBe('ReviewError');
      expect(error.message).toBe('Something failed');
      expect(error.code).toBe(ErrorCodes.AGENT_FAILED);
      expect(error.metadata).toEqual({ attempt: 2 });
    });
  });

  describe('withRetry', () => {
    it('should return the result when the function succeeds', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      await expect(withRetry(fn, 3, 0)).resolves.toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry after failures and eventually succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('first failure'))
        .mockRejectedValueOnce(new Error('second failure'))
        .mockResolvedValue('success');

      await expect(withRetry(fn, 3, 0)).resolves.toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw RETRY_EXHAUSTED after all attempts fail', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('permanent failure'));

      await expect(withRetry(fn, 2, 0)).rejects.toMatchObject({
        code: ErrorCodes.RETRY_EXHAUSTED,
        message: 'Operation failed after 2 retries'
      });

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('withTimeout', () => {
    it('should return the result when it finishes before the timeout', async () => {
      const fn = vi.fn().mockResolvedValue('completed');

      await expect(withTimeout(fn, 1000)).resolves.toBe('completed');
    });

    it('should throw AGENT_TIMEOUT when the timeout is reached', async () => {
      const fn = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('too late'), 100);
        });

      await expect(
        withTimeout(fn, 10, 'Agent took too long')
      ).rejects.toMatchObject({
        code: ErrorCodes.AGENT_TIMEOUT,
        message: 'Agent took too long',
        metadata: { timeoutMs: 10 }
      });
    });
  });

  describe('helpers', () => {
    it('should identify ReviewError instances', () => {
      const reviewError = new ReviewError(
        'Failed',
        ErrorCodes.AGENT_FAILED
      );

      expect(isReviewError(reviewError)).toBe(true);
      expect(isReviewError(new Error('Failed'))).toBe(false);
      expect(isReviewError('Failed')).toBe(false);
    });

    it('should format ReviewError and normal errors', () => {
      const reviewError = new ReviewError(
        'Agent failed',
        ErrorCodes.AGENT_FAILED
      );

      expect(formatError(reviewError)).toBe(
        '[AGENT_FAILED] Agent failed'
      );

      expect(formatError(new Error('Normal error'))).toBe(
        'Normal error'
      );

      expect(formatError('String error')).toBe(
        'String error'
      );
    });
  });
});
