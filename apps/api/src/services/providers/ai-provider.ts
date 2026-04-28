export type AIMessageRole = "system" | "user" | "assistant";

export type AIMessage = {
  role: AIMessageRole;
  content: string;
  reasoning_details?: unknown;
};

export type AIGenerateRequest = {
  messages: AIMessage[];
};

export type AIGenerateResponse = {
  model: string;
  message: AIMessage;
  history: AIMessage[];
};

export interface AIProvider {
  readonly name: string;
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
}