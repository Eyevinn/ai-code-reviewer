import { generateReview } from './review';

describe('frontend review client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('surfaces the API error reason', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: 'Too Many Requests',
      json: async () => ({ reason: 'Review rate limit exceeded' })
    } as Response);

    await expect(
      generateReview('https://github.com/Eyevinn/example', 'http://localhost')
    ).resolves.toEqual([
      undefined,
      'Failed to generate review: Review rate limit exceeded'
    ]);
  });

  it('rejects a successful response that does not match the schema', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ review: {} })
    } as Response);

    await expect(
      generateReview('https://github.com/Eyevinn/example', 'http://localhost')
    ).resolves.toEqual([
      undefined,
      'The review API returned an invalid response'
    ]);
  });
});
