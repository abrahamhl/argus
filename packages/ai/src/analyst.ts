import { ModelProvider, Message, ToolCall } from './provider.js';
import { argusTools, argusToolExecutors } from './tools.js';
import { PolicyEngine } from '@argus/core';

const policyEngine = new PolicyEngine();

export interface AnalystOptions {
  provider: ModelProvider;
}

export class ArgusAnalyst {
  private provider: ModelProvider;

  constructor(options: AnalystOptions) {
    this.provider = options.provider;
  }

  // The Policy Gate validates if the LLM is attempting prohibited actions
  private checkPolicy(toolCall: ToolCall) {
    const allowedTools = argusTools.map(t => t.name);
    const valTool = policyEngine.validateToolName(toolCall.name, allowedTools);
    if (!valTool.allowed) {
      throw new Error(valTool.reason);
    }
  }

  async analyze(objective: string): Promise<string> {
    const valText = policyEngine.validateTextInput(objective);
    if (!valText.allowed) {
      throw new Error(valText.reason);
    }

    const messages: Message[] = [
      {
        role: 'system',
        content: `You are the ARGUS AI Analyst. Your job is to fulfill the user's objective using ONLY the provided tools.
        
CRITICAL RULES:
1. You MUST NEVER invent facts. 
2. You CANNOT change evidence, confidence, or deterministic severity.
3. Every factual statement about a target MUST reference one or more evidence IDs (e.g., [evd_123]) or finding IDs (e.g., [finding_abc]).
4. If you cannot fulfill the request using the tools, state what you are missing.`
      },
      {
        role: 'user',
        content: objective
      }
    ];

    let maxSteps = 5;
    let currentStep = 0;

    while (currentStep < maxSteps) {
      currentStep++;
      
      const response = await this.provider.generate(messages, argusTools);
      
      if (response.text) {
        messages.push({ role: 'assistant', content: response.text });
      }

      if (response.toolCalls && response.toolCalls.length > 0) {
        // We only process the first tool call per turn to keep it simple, or all.
        for (const call of response.toolCalls) {
          try {
            // 1. Policy Gate
            this.checkPolicy(call);

            // 2. Tool Execution
            const executor = argusToolExecutors[call.name];
            const result = await executor(call.arguments);
            
            messages.push({
              role: 'tool',
              name: call.name,
              content: JSON.stringify(result, null, 2)
            });
          } catch (err: any) {
            messages.push({
              role: 'tool',
              name: call.name,
              content: `Error executing tool: ${err.message}`
            });
          }
        }
      } else if (response.text) {
        // If there's text and no tool calls, the model is done or asking for clarification.
        return response.text;
      }
    }

    return messages[messages.length - 1].content || 'Max steps reached.';
  }
}
