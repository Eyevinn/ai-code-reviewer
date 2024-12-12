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
} from '@nextui-org/react';
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
      const review = await generateReview(githubUrl, apiUrl);
      setReview(review[0]);
      setIsLoading(false);
    } catch (error) {
      const err = JSON.stringify(error);
      setErr(err);
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
          <p className="text-sm">Please enter a github url to review</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handlePost} className="flex flex-col gap-4">
            <Input name="url" variant="bordered" color="primary" />
            <Button
              type="submit"
              endContent={<IconSearch />}
              variant="bordered"
              color="primary"
            >
              Review this repository
            </Button>
          </form>
        </CardBody>
        <CardFooter className="text-sm italic">
          Please remember that the AI can make misstakes and falty assumptions
        </CardFooter>
      </Card>
      {isLoading ? <Spinner /> : <Review review={review} error={err} />}
    </div>
  );
}
