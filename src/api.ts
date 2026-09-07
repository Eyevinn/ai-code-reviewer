import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Static, Type } from '@sinclair/typebox';
import fastify, { FastifyPluginCallback } from 'fastify';
import { ErrorResponse } from './api/errors';
import { ReviewResponse, ReviewSchema } from './service/models';
import { generateReview } from './service/models/openai';
import { parseGitHubUrl } from './utils/regEx';

const HelloWorld = Type.String({
  description: 'The magical words!'
});

export interface HealthcheckOptions {
  title: string;
}
const healthcheck: FastifyPluginCallback<HealthcheckOptions> = (
  fastify,
  opts,
  next
) => {
  fastify.get<{ Reply: Static<typeof HelloWorld> }>(
    '/',
    {
      schema: {
        description: 'Say hello',
        response: {
          200: HelloWorld
        }
      }
    },
    async (_, reply) => {
      reply.send('Hello, world! I am ' + opts.title);
    }
  );
  next();
};

const ReviewRequestSchema = Type.Object({
  githubUrl: Type.String({
    format: 'url',
    description: 'The GitHub repository or pull request URL to analyze'
  })
});
type ReviewRequestBody = Static<typeof ReviewRequestSchema>;

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export interface ReviewOptions {
  title: string;
}

const createReview: FastifyPluginCallback<ReviewOptions> = (
  fastify,
  opts,
  next
) => {
  const maximumConcurrentReviews = positiveInteger(
    process.env.MAX_CONCURRENT_REVIEWS,
    2
  );
  let activeReviews = 0;

  fastify.post<{
    Body: ReviewRequestBody;
    Reply: ReviewResponse | ErrorResponse;
  }>(
    '/review',
    {
      schema: {
        description:
          'Generate a review from a given GitHub repository URL using OpenAI',
        body: ReviewRequestSchema,
        response: {
          200: ReviewSchema,
          400: ErrorResponse,
          429: ErrorResponse,
          500: ErrorResponse
        }
      },
      config: {
        rateLimit: {
          max: positiveInteger(process.env.REVIEW_RATE_LIMIT_MAX, 10),
          timeWindow: '1 hour'
        }
      }
    },
    async (request, reply) => {
      const { githubUrl } = request.body;
      if (!parseGitHubUrl(githubUrl)) {
        return reply.status(400).send({
          reason: 'URL must point to a GitHub repository or pull request'
        });
      }
      if (activeReviews >= maximumConcurrentReviews) {
        return reply.status(429).send({
          reason: 'Too many reviews are already running; try again later'
        });
      }

      activeReviews += 1;
      try {
        const review = await generateReview(githubUrl);
        return reply.send({ review: review.review });
      } catch (error) {
        if (error instanceof Error) {
          return reply
            .status(500)
            .send({ reason: `An error occurred: ${error.message}` });
        }
        return reply.status(500).send({ reason: 'An unknown error occurred' });
      } finally {
        activeReviews -= 1;
      }
    }
  );
  next();
};

export interface ApiOptions {
  title: string;
}

export default (opts: ApiOptions) => {
  const api = fastify({
    trustProxy: process.env.TRUST_PROXY === 'true',
    routerOptions: {
      ignoreTrailingSlash: true
    }
  }).withTypeProvider<TypeBoxTypeProvider>();

  const corsOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  api.register(cors, {
    origin: corsOrigins,
    methods: ['GET', 'POST']
  });
  api.register(rateLimit, {
    global: false,
    errorResponseBuilder: () => ({
      statusCode: 429,
      reason: 'Review rate limit exceeded; try again later'
    })
  });

  // register the swagger plugins, it will automagically do magic
  api.register(swagger, {
    swagger: {
      info: {
        title: opts.title,
        description: 'hello',
        version: 'v1'
      }
    }
  });
  api.register(swaggerUI, {
    routePrefix: '/api/docs'
  });

  api.register(healthcheck, { prefix: '/api', title: opts.title });
  api.register(createReview, { prefix: '/api/v1', title: opts.title });

  return api;
};
