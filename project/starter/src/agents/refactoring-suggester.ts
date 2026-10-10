import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/refactoring-suggester.prompt';

export const refactoringSuggester: AgentDefinition = {
  description:
    'Analyzes pull request code for meaningful refactoring opportunities that improve readability, maintainability, and code structure.',
  tools: ['Read', 'Grep', 'Glob'],
  model: 'inherit',
  prompt: REFACTORING_SUGGESTER_PROMPT,
};
