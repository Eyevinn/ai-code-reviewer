import { Value } from '@sinclair/typebox/value';
import { ReviewResponse, ReviewSchema } from '../service/models';
import { ActionResponse } from './utils';

export async function generateReview(
  githubUrl: string,
  apiUrl: string
): Promise<ActionResponse<ReviewResponse>> {
  const url = new URL(`${apiUrl}/review`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ githubUrl })
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => undefined)) as
      { reason?: unknown } | undefined;
    const reason =
      typeof error?.reason === 'string' ? error.reason : response.statusText;
    return [undefined, `Failed to generate review: ${reason}`];
  }
  const review = await response.json();
  if (!Value.Check(ReviewSchema, review)) {
    return [undefined, 'The review API returned an invalid response'];
  }
  return [review];
}
