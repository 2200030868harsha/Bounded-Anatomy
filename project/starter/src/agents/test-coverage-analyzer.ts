import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/test-coverage-analyzer.prompt';

export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Analyzes pull request changes for test coverage, identifies untested code paths and edge cases, and recommends specific tests.',
  tools: ['Read', 'Grep', 'Glob'],
  model: 'inherit',
  prompt: TEST_COVERAGE_ANALYZER_PROMPT,
};
