import { describe, expect, it } from 'vitest';

import { ReportGenerator } from '../src/utils/report-generator.js';
import type { ReviewReport } from '../src/types/report-types.js';

const sampleReport: ReviewReport = {
  pullRequest: {
    owner: 'udacity',
    repo: 'cd14715-simple-todo-app',
    number: 1
  },
  fileReviews: [
    {
      file: 'src/todo.ts',
      codeQuality: {
        issues: [
          {
            line: 10,
            severity: 'high',
            category: 'security',
            description: 'Unsafe input handling',
            suggestion: 'Validate user input'
          }
        ],
        overallScore: 85,
        summary: 'Good quality with one security issue.'
      },
      testCoverage: {
        hasTests: false,
        testFiles: [],
        untestedPaths: [
          {
            type: 'function',
            location: 'addTodo()',
            priority: 'high',
            reasoning: 'The function has no tests.',
            suggestedTest: 'Add a test for adding a todo.'
          }
        ],
        coverageEstimate: 40,
        summary: 'Coverage could be improved.'
      },
      refactorings: {
        suggestions: [
          {
            type: 'extract-function',
            location: 'src/todo.ts:10',
            impact: 'medium',
            description: 'Extract validation logic.',
            before: 'Validation is mixed with business logic.',
            after: 'Move validation into a helper.',
            benefits: 'Improves readability.'
          }
        ],
        summary: 'One refactoring opportunity.'
      }
    }
  ],
  summary: {
    totalFiles: 1,
    overallScore: 85,
    criticalIssues: 0,
    highPriorityTests: 1,
    refactoringOpportunities: 1
  },
  recommendations: [
    {
      priority: 'high',
      category: 'security',
      description: 'Validate user input.',
      files: ['src/todo.ts']
    }
  ],
  metadata: {
    analyzedAt: '2026-10-10T07:00:00.000Z',
    duration: 5000,
    agentVersions: {
      'code-quality-analyzer': '1.0.0',
      'test-coverage-analyzer': '1.0.0',
      'refactoring-suggester': '1.0.0'
    }
  }
};

describe('ReportGenerator', () => {
  const generator = new ReportGenerator();

  describe('generateJSONReport', () => {
    it('should generate valid JSON containing the report', () => {
      const result = generator.generateJSONReport(sampleReport);

      const parsed = JSON.parse(result);

      expect(parsed.pullRequest.repo).toBe('cd14715-simple-todo-app');
      expect(parsed.summary.overallScore).toBe(85);
      expect(parsed.fileReviews[0].file).toBe('src/todo.ts');
    });
  });

  describe('generateMarkdownReport', () => {
    it('should include summary information', () => {
      const result = generator.generateMarkdownReport(sampleReport);

      expect(result).toContain('# 🔍 Code Review Report');
      expect(result).toContain('85/100');
      expect(result).toContain('Files Reviewed');
      expect(result).toContain('High Priority Tests');
    });

    it('should include recommendations and file findings', () => {
      const result = generator.generateMarkdownReport(sampleReport);

      expect(result).toContain('Validate user input.');
      expect(result).toContain('src/todo.ts');
      expect(result).toContain('Unsafe input handling');
      expect(result).toContain('addTodo()');
      expect(result).toContain('Extract validation logic.');
    });
  });

  describe('generateHTMLReport', () => {
    it('should generate a complete HTML document', () => {
      const result = generator.generateHTMLReport(sampleReport);

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('<title>Code Review Report</title>');
      expect(result).toContain('</html>');
    });

    it('should include summary values and recommendations', () => {
      const result = generator.generateHTMLReport(sampleReport);

      expect(result).toContain('85');
      expect(result).toContain('1');
      expect(result).toContain('[HIGH]');
      expect(result).toContain('Validate user input.');
      expect(result).toContain('src/todo.ts');
    });
  });

  describe('empty recommendations', () => {
    it('should handle reports with no recommendations', () => {
      const reportWithoutRecommendations: ReviewReport = {
        ...sampleReport,
        recommendations: []
      };

      const result = generator.generateMarkdownReport(
        reportWithoutRecommendations
      );

      expect(result).toContain('No recommendations at this time.');
    });

    it('should handle reports with no HTML recommendations', () => {
      const reportWithoutRecommendations: ReviewReport = {
        ...sampleReport,
        recommendations: []
      };

      const result = generator.generateHTMLReport(
        reportWithoutRecommendations
      );

      expect(result).toContain(
        '<li>No recommendations at this time.</li>'
      );
    });
  });
});
