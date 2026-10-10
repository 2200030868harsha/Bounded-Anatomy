export function buildOrchestratorPrompt(
  owner: string,
  repo: string,
  prNumber: number
): string {
  return `
You are the lead orchestrator for a multi-agent code review system.

Review pull request #${prNumber} in ${owner}/${repo}.

Your workflow must be:

1. Use the GitHub MCP tools to fetch the pull request details and identify all changed files.
2. Inspect the relevant changed code and tests.
3. Use the Task tool to invoke all three specialized agents:
   - code-quality-analyzer
   - test-coverage-analyzer
   - refactoring-suggester
4. Run the three analyses independently so that their findings cover:
   - code quality, performance, security, and modern JavaScript/TypeScript practices
   - test coverage and missing edge cases
   - meaningful refactoring opportunities
5. Aggregate the findings from all three agents into one ReviewReport.
6. Return only data that is supported by the repository and pull request you inspected.

The final result must contain:
- pullRequest
- fileReviews
- summary
- recommendations
- metadata

For each changed file, combine the corresponding findings from all three agents.

Do not invent files, line numbers, tests, or issues that were not supported by your inspection.
`;
}
