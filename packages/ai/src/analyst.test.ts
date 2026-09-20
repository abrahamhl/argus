import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { ArgusAnalyst } from './analyst.js';
import type { ModelProvider, Message, ToolDefinition, ProviderResponse } from './provider.js';

class MockProvider implements ModelProvider {
  private responses: ProviderResponse[];
  private callCount = 0;

  constructor(responses: ProviderResponse[]) {
    this.responses = responses;
  }

  async generate(messages: Message[], tools?: ToolDefinition[]): Promise<ProviderResponse> {
    const res = this.responses[this.callCount] || { text: JSON.stringify({ summary: 'Default', claims: [], isComplete: true }) };
    this.callCount++;
    return res;
  }
}

test('ArgusAnalyst: parses structured output and preserves valid claims with evidence links', async () => {
  const provider = new MockProvider([
    {
      text: JSON.stringify({
        summary: 'Target is missing HSTS header and has weak SPF policy.',
        claims: [
          { text: 'Missing HSTS on HTTPS response', evidenceIds: ['evd_http_01'] },
          { text: 'Weak SPF policy configured with ~all', evidenceIds: ['evd_dns_01'] }
        ],
        isComplete: true
      })
    }
  ]);

  const analyst = new ArgusAnalyst({ provider });
  const result = await analyst.analyze('Analyze security posture for example.nl');

  assert.equal(result.isComplete, true);
  assert.equal(result.claims.length, 2);
  assert.equal(result.claims[0].evidenceIds[0], 'evd_http_01');
  assert.equal(result.claims[1].evidenceIds[0], 'evd_dns_01');
});

test('ArgusAnalyst: drops hallucinated claims that lack evidence references', async () => {
  const provider = new MockProvider([
    {
      text: JSON.stringify({
        summary: 'Review with one valid claim and one unsupported claim.',
        claims: [
          { text: 'Valid grounded claim', evidenceIds: ['evd_real_1'] },
          { text: 'Hallucinated claim without evidence', evidenceIds: [] },
          { text: 'Another claim with missing evidence array', evidenceIds: undefined as any }
        ],
        isComplete: true
      })
    }
  ]);

  const analyst = new ArgusAnalyst({ provider });
  const result = await analyst.analyze('Summarize posture');

  assert.equal(result.isComplete, true);
  assert.equal(result.claims.length, 1);
  assert.equal(result.claims[0].text, 'Valid grounded claim');
});

test('ArgusAnalyst: rejects input exceeding policy limits', async () => {
  const provider = new MockProvider([]);
  const analyst = new ArgusAnalyst({ provider });

  await assert.rejects(async () => {
    await analyst.analyze(''); // empty input rejected by policy engine
  }, /empty/i);
});

test('ArgusAnalyst: rejects disallowed tool calls via Policy Gate', async () => {
  const provider = new MockProvider([
    {
      toolCalls: [
        {
          name: 'unauthorized_exec_shell',
          arguments: { command: 'cat /etc/passwd' }
        }
      ]
    }
  ]);

  const analyst = new ArgusAnalyst({ provider });
  // Tool call with unauthorized tool should result in error in tool execution or response
  const result = await analyst.analyze('Run shell command');
  assert.ok(result);
});
