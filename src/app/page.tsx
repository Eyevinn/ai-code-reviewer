'use client';
import { useApiUrl } from '@/hooks/useApiUrl';
import { ReviewResponse } from '@/service/models';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Spinner
} from '@heroui/react';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import Review from './_components/Review';
import { generateReview } from './review';

export default function Page() {
  const [review, setReview] = useState<ReviewResponse | undefined>(undefined);
  const [err, setErr] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const apiUrl = useApiUrl();

  const handlePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr('');
    setReview(undefined);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const githubUrl = formData.get('url') as string;
    if (!githubUrl) {
      setErr('Please provide a valid URL');
      setIsLoading(false);
      return;
    }
    if (!apiUrl) {
      setErr('An Error occured, please try again later');
      setIsLoading(false);
      return;
    }
    try {
      const [generatedReview, reviewError] = await generateReview(
        githubUrl,
        apiUrl
      );
      if (reviewError) {
        setErr(reviewError);
        return;
      }
      setReview(generatedReview);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Review failed');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col gap-4 max-w-[45rem] py-8 h-full">
      <h1 className="text-4xl">AI Code Reviewer</h1>
      <Card
        className="max-w-[45rem] grow bg-stone-800 my-4 p-4 border border-zinc-600"
        shadow="md"
      >
        <CardHeader className="flex flex-col items-start gap-2">
          <h2 className="text-2xl">Review this code</h2>
          <p className="text-sm">
            Enter a GitHub repository or pull request URL to review
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handlePost} className="flex flex-col gap-4">
            <Input
              name="url"
              type="url"
              required
              variant="bordered"
              color="primary"
            />
            <Button
              type="submit"
              isDisabled={isLoading}
              endContent={<IconSearch />}
              variant="bordered"
              color="primary"
            >
              Review this code
            </Button>
          </form>
        </CardBody>
        <CardFooter className="text-sm italic">
          Please remember that the AI can make misstakes and faulty assumptions
        </CardFooter>
      </Card>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <p>Reviewing Repository, this could take a few minutes</p>
          <Spinner />
        </div>
      ) : (
        <Review review={review} error={err} />
      )}
    </div>
  );
}
