import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

import {
  ReviewReportSchema,
  ReviewReportJSONSchema,
  type ReviewReport
} from './types';

import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents';

import { mcpServersConfig } from './config/mcp.config';
import { buildOrchestratorPrompt } from './prompts';
import {
  logReviewComplete,
  logReviewError,
  logReviewStart
} from './utils/logger';

export interface OrchestratorOptions {
  maxTurns?: number;
  maxBudgetUsd?: number;
}

export class CodeReviewOrchestrator {
  private readonly options: OrchestratorOptions;

  constructor(options: OrchestratorOptions = {}) {
    this.options = options;
  }

  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const startTime = Date.now();

    logReviewStart(owner, repo, prNumber);

    try {
      const agents: Record<string, AgentDefinition> = {
        'code-quality-analyzer': codeQualityAnalyzer,
        'test-coverage-analyzer': testCoverageAnalyzer,
        'refactoring-suggester': refactoringSuggester
      };

      const prompt = buildOrchestratorPrompt(owner, repo, prNumber);

      const q = query({
        prompt,
        options: {
          cwd: process.env.PROJECT_ROOT || process.cwd(),
          mcpServers: mcpServersConfig,
          agents,
          allowedTools: [
            'Task',
            'mcp__github__*',
            'mcp__eslint__*'
          ],
          outputFormat: {
            type: 'json_schema',
            schema: ReviewReportJSONSchema
          },
          model: process.env.ANTHROPIC_MODEL,
          maxTurns: this.options.maxTurns ?? 30,
          maxBudgetUsd: this.options.maxBudgetUsd
        }
      });

      let structuredOutput: unknown;
      let duration = 0;

      for await (const message of q) {
        if (message.type === 'result') {
          duration = message.duration_ms;

          if (message.subtype !== 'success') {
            throw new Error(
              `Claude query failed with result subtype: ${message.subtype}`
            );
          }

          structuredOutput = message.structured_output;
        }
      }

      if (structuredOutput === undefined) {
        throw new Error('Claude did not return structured review output');
      }

      const parsed = ReviewReportSchema.safeParse(structuredOutput);

      if (!parsed.success) {
        throw new Error(
          `ReviewReport validation failed: ${parsed.error.message}`
        );
      }

      const report: ReviewReport = {
        ...parsed.data,
        pullRequest: {
          owner,
          repo,
          number: prNumber
        },
        metadata: {
          ...parsed.data.metadata,
          duration: duration || Date.now() - startTime
        }
      };

      logReviewComplete(
        owner,
        repo,
        prNumber,
        report.summary.overallScore,
        report.metadata.duration
      );

      return report;
    } catch (error) {
      const reviewError =
        error instanceof Error ? error : new Error(String(error));

      logReviewError(owner, repo, prNumber, reviewError);

      throw reviewError;
    }
  }
}
