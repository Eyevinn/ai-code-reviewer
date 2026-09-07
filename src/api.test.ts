import api from './api';
import { ReviewResponse } from './service/models';
import { generateReview } from './service/models/openai';

jest.mock('./service/models/openai', () => ({
  generateReview: jest.fn()
}));

const mockedGenerateReview = generateReview as jest.MockedFunction<
  typeof generateReview
>;

const reviewFixture: ReviewResponse = {
  review: {
    metadata: {
      repository_name: 'Eyevinn/ai-code-reviewer',
      creator: 'Eyevinn',
      last_commit_date: '2026-01-02T00:00:00Z',
      stars: 12,
      forks: 3,
      contributors: null
    },
    scope: {
      target_kind: 'repository',
      reference: 'commit-sha',
      base_reference: null,
      files_reviewed: ['src/index.ts'],
      truncated: false,
      warnings: []
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

describe('api', () => {
  const originalConcurrentLimit = process.env.MAX_CONCURRENT_REVIEWS;
  const originalRateLimit = process.env.REVIEW_RATE_LIMIT_MAX;

  afterEach(() => {
    jest.clearAllMocks();
    if (originalConcurrentLimit === undefined) {
      delete process.env.MAX_CONCURRENT_REVIEWS;
    } else {
      process.env.MAX_CONCURRENT_REVIEWS = originalConcurrentLimit;
    }
    if (originalRateLimit === undefined) {
      delete process.env.REVIEW_RATE_LIMIT_MAX;
    } else {
      process.env.REVIEW_RATE_LIMIT_MAX = originalRateLimit;
    }
  });

  it('responds with hello, world!', async () => {
    const server = api({ title: 'my awesome service' });
    const response = await server.inject({
      method: 'GET',
      url: '/api'
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Hello, world! I am my awesome service');
  });

  it('rejects URLs outside the supported GitHub targets', async () => {
    const server = api({ title: 'reviewer' });
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/review',
      payload: {
        githubUrl: 'https://github.com.evil.test/Eyevinn/ai-code-reviewer'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      reason: 'URL must point to a GitHub repository or pull request'
    });
    expect(mockedGenerateReview).not.toHaveBeenCalled();
  });

  it('returns a structured review for an accepted pull request URL', async () => {
    mockedGenerateReview.mockResolvedValue(reviewFixture);
    const server = api({ title: 'reviewer' });
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/review',
      payload: {
        githubUrl: 'https://github.com/Eyevinn/ai-code-reviewer/pull/42'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(reviewFixture);
    expect(mockedGenerateReview).toHaveBeenCalledWith(
      'https://github.com/Eyevinn/ai-code-reviewer/pull/42'
    );
  });

  it('rate-limits repeated review requests from the same client', async () => {
    process.env.REVIEW_RATE_LIMIT_MAX = '1';
    mockedGenerateReview.mockResolvedValue(reviewFixture);
    const server = api({ title: 'reviewer' });
    const request = {
      method: 'POST' as const,
      url: '/api/v1/review',
      payload: {
        githubUrl: 'https://github.com/Eyevinn/ai-code-reviewer'
      }
    };

    expect((await server.inject(request)).statusCode).toBe(200);
    const limited = await server.inject(request);

    expect(limited.statusCode).toBe(429);
    expect(limited.json()).toEqual({
      reason: 'Review rate limit exceeded; try again later'
    });
    expect(mockedGenerateReview).toHaveBeenCalledTimes(1);
  });

  it('rejects a review while the concurrency limit is occupied', async () => {
    process.env.MAX_CONCURRENT_REVIEWS = '1';
    process.env.REVIEW_RATE_LIMIT_MAX = '10';
    let resolveFirst!: (review: ReviewResponse) => void;
    mockedGenerateReview.mockImplementation(
      () =>
        new Promise<ReviewResponse>((resolve) => {
          resolveFirst = resolve;
        })
    );
    const server = api({ title: 'reviewer' });
    const request = {
      method: 'POST' as const,
      url: '/api/v1/review',
      payload: {
        githubUrl: 'https://github.com/Eyevinn/ai-code-reviewer'
      }
    };

    const first = server.inject(request);
    while (mockedGenerateReview.mock.calls.length === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    const limited = await server.inject(request);

    expect(limited.statusCode).toBe(429);
    expect(limited.json()).toEqual({
      reason: 'Too many reviews are already running; try again later'
    });

    resolveFirst(reviewFixture);
    expect((await first).statusCode).toBe(200);
  });

  it('does not allow an unconfigured cross-origin browser request', async () => {
    const server = api({ title: 'reviewer' });
    const response = await server.inject({
      method: 'GET',
      url: '/api',
      headers: { origin: 'https://attacker.example' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
