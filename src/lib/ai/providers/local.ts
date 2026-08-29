import { ChatMessage, ToolDefinition } from '../types';

export async function callLocalLLM(
  messages: ChatMessage[],
  tools?: ToolDefinition[],
  endpoint: string = process.env.LOCAL_LLM_URL || 'http://localhost:11434/api/chat',
  model: string = process.env.LOCAL_LLM_MODEL || 'llama3.2'
) {
  const payload: any = {
    model,
    messages,
    stream: false
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Local LLM responded with ${res.status}: ${await res.text()}`);
  }

  return await res.json();
}
