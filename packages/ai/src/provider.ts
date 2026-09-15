export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any; // JSON schema
}

export interface ToolCall {
  name: string;
  arguments: any;
}

export interface ProviderResponse {
  text?: string;
  toolCalls?: ToolCall[];
}

export interface ModelProvider {
  generate(messages: Message[], tools?: ToolDefinition[]): Promise<ProviderResponse>;
}

export class OllamaProvider implements ModelProvider {
  private baseUrl: string;
  private model: string;

  constructor(model: string = 'llama3', baseUrl: string = 'http://127.0.0.1:11434') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(messages: Message[], tools?: ToolDefinition[]): Promise<ProviderResponse> {
    const payload: any = {
      model: this.model,
      messages: messages.map(m => {
        const msg: any = { role: m.role, content: m.content };
        if (m.name && m.role === 'tool') {
          // Ollama requires tool outputs to match specific formats depending on the model, 
          // we'll try to follow standard chat completion API conventions.
          msg.name = m.name;
        }
        return msg;
      }),
      stream: false
    };

    if (tools && tools.length > 0) {
      payload.tools = tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      }));
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.statusText}`);
    }

    const data = await res.json() as any;
    const message = data.message;

    const response: ProviderResponse = {};
    
    if (message.content) {
      response.text = message.content;
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      response.toolCalls = message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        arguments: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments
      }));
    }

    return response;
  }
}
