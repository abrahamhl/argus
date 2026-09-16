import { ModelProvider, Message, ToolCall } from './provider.js';
import { argusTools, argusToolExecutors } from './tools.js';
import { PolicyEngine } from '@argus/core';
import { appendFileSync } from 'node:fs';

const policyEngine = new PolicyEngine();

export interface AnalystOptions {
  provider: ModelProvider;
}

export interface AnalystClaim {
  text: string;
  evidenceIds: string[];
}

export interface AnalystResponse {
  summary: string;
  claims: AnalystClaim[];
  isComplete: boolean;
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

  async analyze(objective: string): Promise<AnalystResponse> {
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
3. Every factual statement about a target MUST reference one or more evidence IDs or finding IDs.
4. If you cannot fulfill the request using the tools, state what you are missing.

When you are finished and have gathered all necessary information, your final response MUST be a valid JSON object matching this schema, with NO markdown formatting around it:
{
  "summary": "High level summary of your findings",
  "claims": [
    { "text": "Specific factual claim", "evidenceIds": ["evd_123", "finding_abc"] }
  ],
  "isComplete": true
}`
      },
      {
        role: 'user',
        content: objective
      }
    ];

    let maxSteps = 5;
    let currentStep = 0;
    let lastResponseText = '';

    while (currentStep < maxSteps) {
      currentStep++;
      
      const response = await this.provider.generate(messages, argusTools);
      
      if (response.text) {
        lastResponseText = response.text;
        messages.push({ role: 'assistant', content: response.text });
      }

      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const call of response.toolCalls) {
          const traceEvent = {
            timestamp: new Date().toISOString(),
            tool: call.name,
            arguments: call.arguments,
            policyAllowed: false,
            error: null as string | null,
            durationMs: 0
          };
          const startTime = Date.now();
          try {
            this.checkPolicy(call);
            traceEvent.policyAllowed = true;
            
            const executor = argusToolExecutors[call.name];
            const result = await executor(call.arguments);
            
            traceEvent.durationMs = Date.now() - startTime;
            appendFileSync('argus_trace.jsonl', JSON.stringify(traceEvent) + '\n');
            
            messages.push({
              role: 'tool',
              name: call.name,
              content: JSON.stringify(result, null, 2)
            });
          } catch (err: any) {
            traceEvent.error = err.message;
            traceEvent.durationMs = Date.now() - startTime;
            appendFileSync('argus_trace.jsonl', JSON.stringify(traceEvent) + '\n');
            
            messages.push({
              role: 'tool',
              name: call.name,
              content: `Error executing tool: ${err.message}`
            });
          }
        }
      } else if (response.text) {
        break; // No more tool calls, we assume it's the final JSON response
      }
    }

    // Try to parse the final response as JSON
    try {
      // Strip markdown code blocks if the model ignored instructions
      const jsonStr = lastResponseText.replace(/^```json/m, '').replace(/```$/m, '').trim();
      const parsed = JSON.parse(jsonStr) as AnalystResponse;
      
      // Post-process: Reject claims without evidence references
      parsed.claims = parsed.claims.filter(claim => {
        if (!claim.evidenceIds || claim.evidenceIds.length === 0) {
          console.warn(`[POLICY_GATE] Dropped unsupported claim: ${claim.text}`);
          return false;
        }
        return true;
      });
      
      return parsed;
    } catch (err: any) {
      return {
        summary: `Failed to parse structured output. Raw response: ${lastResponseText}`,
        claims: [],
        isComplete: false
      };
    }
  }
}
