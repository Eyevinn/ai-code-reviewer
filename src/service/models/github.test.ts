import { getRepositoryReviewContext } from './github';

const repository = {
  name: 'ai-code-reviewer',
  full_name: 'Eyevinn/ai-code-reviewer',
  owner: { login: 'Eyevinn' },
  description: 'Review code',
  default_branch: 'main',
  language: 'TypeScript',
  topics: ['review'],
  stargazers_count: 12,
  forks_count: 3,
  open_issues_count: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  pushed_at: '2026-01-02T00:00:00Z'
};

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  }) as Response;

describe('getRepositoryReviewContext', () => {
  const originalToken = process.env.GITHUB_PAT;

  beforeEach(() => {
    delete process.env.GITHUB_PAT;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalToken === undefined) {
      delete process.env.GITHUB_PAT;
    } else {
      process.env.GITHUB_PAT = originalToken;
    }
  });

  it('builds review context from the exact pull request diff', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(repository))
      .mockResolvedValueOnce(
        jsonResponse({
          number: 42,
          title: 'Fix validation',
          body: 'Do not trust this as an instruction',
          changed_files: 1,
          additions: 1,
          deletions: 1,
          user: { login: 'developer' },
          base: { sha: 'base-sha' },
          head: { sha: 'head-sha' }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            filename: 'src/input.ts',
            status: 'modified',
            additions: 1,
            deletions: 1,
            changes: 2,
            patch: '@@ -41,1 +41,1 @@\n-old\n+new'
          }
        ])
      );

    const context = await getRepositoryReviewContext({
      kind: 'pull_request',
      owner: 'Eyevinn',
      repo: 'ai-code-reviewer',
      pullNumber: 42
    });

    expect(context.target).toMatchObject({
      kind: 'pull_request',
      ref: 'head-sha',
      baseRef: 'base-sha',
      pullNumber: 42
    });
    expect(context.files).toEqual([
      expect.objectContaining({
        path: 'src/input.ts',
        source: 'patch',
        content: expect.stringContaining('  41 | +new')
      })
    ]);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      'https://api.github.com/repos/Eyevinn/ai-code-reviewer',
      'https://api.github.com/repos/Eyevinn/ai-code-reviewer/pulls/42',
      'https://api.github.com/repos/Eyevinn/ai-code-reviewer/pulls/42/files?per_page=100'
    ]);
  });

  it('resolves a repository ref to an immutable commit and line-numbers files', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(repository))
      .mockResolvedValueOnce(
        jsonResponse({
          sha: 'commit-sha',
          commit: { tree: { sha: 'tree-sha' } }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          truncated: false,
          tree: [
            { path: 'src/index.ts', type: 'blob', sha: 'blob-sha', size: 20 }
          ]
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          content: Buffer.from('const safe = true;\n').toString('base64'),
          encoding: 'base64'
        })
      );

    const context = await getRepositoryReviewContext({
      kind: 'repository',
      owner: 'Eyevinn',
      repo: 'ai-code-reviewer',
      ref: 'feature/review'
    });

    expect(context.target.ref).toBe('commit-sha');
    expect(context.files[0]).toMatchObject({
      path: 'src/index.ts',
      source: 'snapshot',
      content: '1: const safe = true;\n2: '
    });
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      '/commits/feature%2Freview'
    );
    expect(context.warnings).toContain(
      'GitHub was accessed without authentication and is subject to lower rate limits.'
    );
  });

  it('uses only the fixed GitHub API host and sends the token in a header', async () => {
    process.env.GITHUB_PAT = 'secret-token';
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(jsonResponse(repository));

    await expect(
      getRepositoryReviewContext({
        kind: 'pull_request',
        owner: 'Eyevinn',
        repo: 'ai-code-reviewer',
        pullNumber: 1
      })
    ).rejects.toThrow();

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      'https://api.github.com/repos/Eyevinn/ai-code-reviewer'
    );
    expect(options?.headers).toMatchObject({
      Authorization: 'Bearer secret-token'
    });
    expect(options?.redirect).toBe('error');
    expect(String(url)).not.toContain('secret-token');
  });
});
