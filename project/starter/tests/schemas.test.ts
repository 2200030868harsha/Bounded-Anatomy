import { describe, expect, it } from 'vitest';

import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  ReviewReportSchema
} from '../src/types';

describe('Analysis Schemas', () => {
  it('should validate a valid code quality result', () => {
    const result = CodeQualityResultSchema.safeParse({
      file: 'src/example.ts',
      issues: [
        {
          line: 10,
          severity: 'medium',
          category: 'maintainability',
          description: 'Example issue',
          suggestion: 'Improve readability'
        }
      ],
      overallScore: 85,
      summary: 'Good code quality'
    });

    expect(result.success).toBe(true);
  });

  it('should reject an invalid code quality severity', () => {
    const result = CodeQualityResultSchema.safeParse({
      file: 'src/example.ts',
      issues: [
        {
          line: 10,
          severity: 'invalid',
          category: 'maintainability',
          description: 'Example issue',
          suggestion: 'Fix it'
        }
      ],
      overallScore: 85,
      summary: 'Test'
    });

    expect(result.success).toBe(false);
  });

  it('should validate a valid test coverage result', () => {
    const result = TestCoverageResultSchema.safeParse({
      file: 'src/example.ts',
      hasTests: true,
      testFiles: ['tests/example.test.ts'],
      untestedPaths: [],
      coverageEstimate: 90,
      summary: 'Good test coverage'
    });

    expect(result.success).toBe(true);
  });

  it('should validate a valid refactoring result', () => {
    const result = RefactoringSuggestionSchema.safeParse({
      file: 'src/example.ts',
      suggestions: [],
      summary: 'No major refactoring needed'
    });

    expect(result.success).toBe(true);
  });

  it('should validate a complete review report', () => {
    const result = ReviewReportSchema.safeParse({
      pullRequest: {
        owner: 'udacity',
        repo: 'cd14715-simple-todo-app',
        number: 1
      },
      fileReviews: [],
      summary: {
        totalFiles: 0,
        overallScore: 90,
        criticalIssues: 0,
        highPriorityTests: 0,
        refactoringOpportunities: 0
      },
      recommendations: [],
      metadata: {
        analyzedAt: new Date().toISOString(),
        duration: 1000,
        agentVersions: {}
      }
    });

    expect(result.success).toBe(true);
  });
});
