import { ReviewResponse } from '@/service/models';
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
    return [undefined, `Failed to generate review: ${response.statusText}`];
  }
  return [await response.json()];
}
