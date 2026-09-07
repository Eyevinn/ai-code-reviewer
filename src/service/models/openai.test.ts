import { ReviewResponse } from '../models';
import { RepositoryReviewContext } from './github';
import { generateReview, GenerateReviewDependencies } from './openai';

const context: RepositoryReviewContext = {
  repository: {
    name: 'ai-code-reviewer',
    fullName: 'Eyevinn/ai-code-reviewer',
    owner: 'Eyevinn',
    description: 'Review code',
    defaultBranch: 'main',
    primaryLanguage: 'TypeScript',
    topics: ['review'],
    stars: 12,
    forks: 3,
    openIssues: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    pushedAt: '2026-01-02T00:00:00Z'
  },
  target: {
    kind: 'pull_request',
    ref: 'head-sha',
    baseRef: 'base-sha',
    pullNumber: 42,
    title: 'Review change',
    description: 'Untrusted pull request text',
    author: 'developer',
    additions: 1,
    deletions: 0
  },
  files: [
    {
      path: 'src/index.ts',
      source: 'patch',
      status: 'modified',
      content: '@@ -1,1 +1,1 @@\n   1 | +dangerous()',
      truncated: false
    }
  ],
  truncated: false,
  warnings: []
};

const modelReview: ReviewResponse = {
  review: {
    metadata: {
      repository_name: 'invented/name',
      creator: 'invented',
      last_commit_date: null,
      stars: 999,
      forks: 999,
      contributors: 999
    },
    scope: {
      target_kind: 'repository',
      reference: 'invented',
      base_reference: null,
      files_reviewed: [],
      truncated: true,
      warnings: ['invented']
    },
    scoring_criteria: {
      code_quality: { score: 25, feedback: 'Clear code.' },
      security: { score: 25, vulnerabilities: [], feedback: 'No finding.' },
      documentation: { score: 8, feedback: 'Documented.' },
      project_structure_and_testing: { score: 17, feedback: 'Tested.' },
      version_control_and_git_practices: { score: 8, feedback: 'Scoped.' },
      overall_score: 83
    },
    findings: [],
    suggestions_for_improvement: []
  }
};

describe('generateReview', () => {
  const originalModel = process.env.OPENAI_MODEL;

  afterEach(() => {
    if (originalModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = originalModel;
    }
  });

  it('sends supplied code and overwrites model claims with objective scope', async () => {
    delete process.env.OPENAI_MODEL;
    const getContext = jest.fn().mockResolvedValue(context);
    const createResponse = jest
      .fn()
      .mockResolvedValue({ output_text: JSON.stringify(modelReview) });
    const dependencies: GenerateReviewDependencies = {
      getContext,
      createResponse
    };

    const review = await generateReview(
      'https://github.com/Eyevinn/ai-code-reviewer/pull/42',
      dependencies
    );

    expect(getContext).toHaveBeenCalledWith({
      kind: 'pull_request',
      owner: 'Eyevinn',
      repo: 'ai-code-reviewer',
      pullNumber: 42
    });
    expect(JSON.stringify(createResponse.mock.calls[0][0])).toContain(
      'dangerous()'
    );
    expect(createResponse.mock.calls[0][0]).toMatchObject({
      model: 'gpt-5.4-mini',
      store: false
    });
    expect(review.review.metadata).toEqual({
      repository_name: 'Eyevinn/ai-code-reviewer',
      creator: 'Eyevinn',
      last_commit_date: '2026-01-02T00:00:00Z',
      stars: 12,
      forks: 3,
      contributors: null
    });
    expect(review.review.scope).toEqual({
      target_kind: 'pull_request',
      reference: 'head-sha',
      base_reference: 'base-sha',
      files_reviewed: ['src/index.ts'],
      truncated: false,
      warnings: []
    });
  });

  it('rejects malformed model output', async () => {
    await expect(
      generateReview('https://github.com/Eyevinn/ai-code-reviewer', {
        getContext: jest.fn().mockResolvedValue(context),
        createResponse: jest.fn().mockResolvedValue({ output_text: '{}' })
      })
    ).rejects.toThrow('response did not match the review schema');
  });
});
