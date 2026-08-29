import { ChatMessage, ToolDefinition } from '../types';

export async function callOpenRouter(
  messages: ChatMessage[],
  tools?: ToolDefinition[],
  apiKey: string = process.env.OPENROUTER_API_KEY || '',
  model: string = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free'
) {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const payload: any = {
    model,
    messages
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://cosmictantra.com',
      'X-Title': 'CosmicTantra Kashi Sahayak'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`OpenRouter responded with ${res.status}: ${await res.text()}`);
  }

  return await res.json();
}
