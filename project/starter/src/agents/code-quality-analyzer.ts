import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/code-quality-analyzer.prompt';

export const codeQualityAnalyzer: AgentDefinition = {
  description:
    'Analyzes pull request code for JavaScript/TypeScript quality, modern best practices, common pitfalls, performance issues, and security concerns.',
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
  model: 'inherit',
  prompt: CODE_QUALITY_ANALYZER_PROMPT,
};
