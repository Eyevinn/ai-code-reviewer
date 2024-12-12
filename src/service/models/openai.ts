import OpenAI from 'openai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages';
import { ReviewSchema } from '../models';
import { REVIEW_PROMPT } from './review_prompt';

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || 'DID_NOT_SET_OPENAI_API_KEY';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const myAssistantName = process.env.OPENAI_REVIEW_ASST;

export enum ThreadType {
  OSAAS_REVIEWER = 'osaas_reviewer'
}

// Function to create or get assistant
async function getOrCreateAssistant() {
  const assistants = await openai.beta.assistants.list();
  const existingAssistant = assistants.data.find(
    (a) => a.name === myAssistantName
  );

  if (existingAssistant) {
    return existingAssistant.id;
  }

  const assistant = await openai.beta.assistants.create({
    name: 'Code Review Assistant',
    instructions: REVIEW_PROMPT,
    model: 'gpt-4o-mini',
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'Code_Review_Schema',
        schema: ReviewSchema,
        strict: true
      }
    }
  });

  return assistant.id;
}

function getLatestAssistantMessage(
  messages: OpenAI.Beta.Threads.Messages.Message[]
) {
  return messages
    .find((m) => m.role === 'assistant')
    ?.content.find((c): c is TextContentBlock => c.type === 'text')?.text.value;
}

async function runAssistant(
  assistantId: string,
  threadId: string,
  additional_instructions?: string
) {
  const messages = await openai.beta.threads.messages.list(threadId);
  const lastMessenger = messages.data[0].role;

  if (lastMessenger !== 'user') {
    throw new Error(
      `[openai:runAssistant(${assistantId}, ${threadId})] Last message wasn't from user, it was from ${lastMessenger}. Throwing error to prevent infinite loop`
    );
  }

  await openai.beta.threads.runs.createAndPoll(threadId, {
    assistant_id: assistantId,
    additional_instructions
  });
}

export async function generateReview(
  githubUrl: string
): Promise<typeof ReviewSchema> {
  const assistantId = await getOrCreateAssistant();
  const threadId = (await openai.beta.threads.create()).id;

  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: `Please review this GitHub repository: ${githubUrl}`
  });

  await runAssistant(assistantId, threadId);

  const messages = await openai.beta.threads.messages.list(threadId);
  const review = getLatestAssistantMessage(messages.data);

  if (!review) {
    throw new Error(`[openai:generateReview(${githubUrl})] No review found`);
  }
  const response: typeof ReviewSchema = JSON.parse(review);
  return response;
}
