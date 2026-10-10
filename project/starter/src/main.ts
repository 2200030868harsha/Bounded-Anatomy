import * as dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { CodeReviewOrchestrator } from './orchestrator';
import { ReportGenerator } from './utils/report-generator';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev -- <owner> <repo> <pr-number>
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  // Validate command line arguments
  if (!owner || !repo || !prStr) {
    console.error(
      'Usage: npm run dev -- <owner> <repo> <pr-number>'
    );
    process.exit(1);
  }

  const prNumber = Number(prStr);

  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    console.error('Error: PR number must be a positive integer.');
    process.exit(1);
  }

  // Validate authentication
  const hasAnthropicApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
    const hasAnthropicAuthToken = Boolean(process.env.ANTHROPIC_AUTH_TOKEN);

  const hasAwsCredentials =
    Boolean(process.env.AWS_ACCESS_KEY_ID) &&
    Boolean(process.env.AWS_SECRET_ACCESS_KEY);

  if (hasAwsCredentials) {
    if (!process.env.AWS_REGION) {
      console.error(
        'Error: AWS_REGION is required when using AWS Bedrock authentication.'
      );
      process.exit(1);
    }

    console.log('🔐 Using AWS Bedrock authentication');
  } else if (hasAnthropicApiKey || hasAnthropicAuthToken) {
    console.log('🔐 Using Anthropic authentication');
  } else {
    console.error(
      'Error: No authentication configured.\n\n' +
      'Choose one of the following:\n' +
      '1. Set ANTHROPIC_API_KEY for Anthropic API authentication.\n' +
      '2. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION for AWS Bedrock authentication.'
    );
    process.exit(1);
  }

  // Validate model
  if (!process.env.ANTHROPIC_MODEL && !process.env.ANTHROPIC_MODELS) {
    console.error(
      'Error: ANTHROPIC_MODEL environment variable is required.'
    );
    process.exit(1);
  }

  try {
    console.log(
      `🔍 Reviewing ${owner}/${repo} pull request #${prNumber}...`
    );

    const orchestrator = new CodeReviewOrchestrator();

    const report = await orchestrator.reviewPullRequest(
      owner,
      repo,
      prNumber
    );

    const reportGenerator = new ReportGenerator();

    const markdown = reportGenerator.generateMarkdownReport(report);
    const html = reportGenerator.generateHTMLReport(report);
    const json = reportGenerator.generateJSONReport(report);

    const reportsDir = path.resolve('reports');
    await mkdir(reportsDir, { recursive: true });

    const baseName = `${owner}_${repo}_${prNumber}`;

    await Promise.all([
      writeFile(
        path.join(reportsDir, `${baseName}.md`),
        markdown,
        'utf8'
      ),
      writeFile(
        path.join(reportsDir, `${baseName}.html`),
        html,
        'utf8'
      ),
      writeFile(
        path.join(reportsDir, `${baseName}.json`),
        json,
        'utf8'
      )
    ]);

    console.log('\n✅ Review completed successfully.');
    console.log(`Overall score: ${report.summary.overallScore}/100`);
    console.log(`Files reviewed: ${report.summary.totalFiles}`);
    console.log(`Reports saved to: ${reportsDir}`);
    console.log(`  - ${baseName}.json`);
    console.log(`  - ${baseName}.md`);
    console.log(`  - ${baseName}.html`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error(`\n❌ Review failed: ${message}`);
    process.exit(1);
  }
}

main();
