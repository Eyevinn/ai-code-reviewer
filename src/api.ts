import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Static, Type } from '@sinclair/typebox';
import fastify, { FastifyPluginCallback } from 'fastify';
import { ErrorResponse } from './api/errors';
import { ReviewResponse, ReviewSchema } from './service/models';
import { generateReview } from './service/models/openai';

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
    description: 'The GitHub repo URL to analyze'
  })
});
type ReviewRequestBody = Static<typeof ReviewRequestSchema>;

export interface ReviewOptions {
  title: string;
}

const createReview: FastifyPluginCallback<ReviewOptions> = (
  fastify,
  opts,
  next
) => {
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
          500: ErrorResponse
        }
      }
    },
    async (request, reply) => {
      const { githubUrl } = request.body;
      try {
        const review = await generateReview(githubUrl);
        reply.send({ review: review.review });
      } catch (error) {
        if (error instanceof Error) {
          reply
            .status(500)
            .send({ reason: `An error occurred: ${error.message}` });
        } else {
          reply.status(500).send({ reason: 'An unknown error occurred' });
        }
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
    ignoreTrailingSlash: true
  }).withTypeProvider<TypeBoxTypeProvider>();

  // register the cors plugin, configure it for better security
  api.register(cors);

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
