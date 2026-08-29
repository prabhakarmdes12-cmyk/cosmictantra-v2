export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: Role;
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export type AIModelTier = 'FREE' | 'FLASH_LITE' | 'ADVANCED';

export interface AIProviderConfig {
  provider: 'local' | 'openrouter' | 'google' | 'openai' | 'deterministic';
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

export interface ProvenanceMeta {
  calculation?: string;
  location?: string;
  source?: string;
  darshan?: string;
  scholar?: string;
  interpretation?: string;
}

export interface AIResponse {
  text: string;
  provenance: ProvenanceMeta;
  structuredCard?: any;
  quickChips?: Array<{ label: string; action: string; href?: string }>;
  toolCallsExecuted?: string[];
}
