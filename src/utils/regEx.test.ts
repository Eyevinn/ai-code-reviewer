import { parseGitHubUrl } from './regEx';

describe('parseGitHubUrl', () => {
  it.each([
    [
      'https://github.com/Eyevinn/ai-code-reviewer',
      { kind: 'repository', owner: 'Eyevinn', repo: 'ai-code-reviewer' }
    ],
    [
      'https://github.com/Eyevinn/ai-code-reviewer.git',
      { kind: 'repository', owner: 'Eyevinn', repo: 'ai-code-reviewer' }
    ],
    [
      'https://github.com/Eyevinn/ai-code-reviewer/tree/feature/review',
      {
        kind: 'repository',
        owner: 'Eyevinn',
        repo: 'ai-code-reviewer',
        ref: 'feature/review'
      }
    ],
    [
      'https://github.com/Eyevinn/ai-code-reviewer/pull/42/files',
      {
        kind: 'pull_request',
        owner: 'Eyevinn',
        repo: 'ai-code-reviewer',
        pullNumber: 42
      }
    ]
  ])('parses supported target %s', (url, expected) => {
    expect(parseGitHubUrl(url)).toEqual(expected);
  });

  it.each([
    'http://github.com/Eyevinn/ai-code-reviewer',
    'https://github.com.evil.test/Eyevinn/ai-code-reviewer',
    'https://user@github.com/Eyevinn/ai-code-reviewer',
    'https://github.com/Eyevinn/ai-code-reviewer?tab=readme',
    'https://github.com/Eyevinn/ai-code-reviewer#readme',
    'https://github.com/Eyevinn/ai-code-reviewer/pull/zero',
    'https://github.com/Eyevinn/ai-code-reviewer/issues/1',
    'https://github.com/-invalid/ai-code-reviewer',
    'https://github.com/Eyevinn/..',
    'not a URL'
  ])('rejects unsupported target %s', (url) => {
    expect(parseGitHubUrl(url)).toBeUndefined();
  });
});
