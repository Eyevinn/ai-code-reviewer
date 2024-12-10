import OpenAI from 'openai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages';

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || 'DID_NOT_SET_OPENAI_API_KEY';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export enum ThreadType {
  OSAAS_REVIEWER = 'osaas_reviewer'
}

export const Assistants = {
  [ThreadType.OSAAS_REVIEWER]:
    process.env.OPENAI_REVIEW_ASST || 'asst_WMThAHiv8huPr2SBAeLX34rm'
} as const;

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

export async function generateReview(githubUrl: string) {
  const threadId = (await openai.beta.threads.create()).id;
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: githubUrl
  });

  await runAssistant(Assistants[ThreadType.OSAAS_REVIEWER], threadId);

  const messages = await openai.beta.threads.messages.list(threadId);
  const review = getLatestAssistantMessage(messages.data);

  if (!review) {
    throw new Error(`[openai:generateReview(${githubUrl})] No review found`);
  }
  return JSON.parse(review);
}
