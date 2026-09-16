#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { argusTools, argusToolExecutors } from '@argus/ai';

import { PolicyEngine } from '@argus/core';
import { appendFileSync } from 'node:fs';

/**
 * MCP Remote Auth Requirements:
 * When exposing this MCP server over a network transport (e.g., SSE),
 * operators MUST implement mutual TLS (mTLS) or strong bearer token authentication.
 * The standard stdio transport assumes local process isolation.
 */
const server = new Server({
  name: 'argus-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

const policyEngine = new PolicyEngine();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: argusTools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.parameters
    }))
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  
  const auditEvent = {
    timestamp: new Date().toISOString(),
    tool: name,
    arguments: request.params.arguments,
    policyAllowed: false,
    error: null as string | null,
    durationMs: 0
  };
  const startTime = Date.now();
  
  try {
    const allowedTools = argusTools.map(t => t.name);
    const valTool = policyEngine.validateToolName(name, allowedTools);
    if (!valTool.allowed) {
      throw new Error(valTool.reason);
    }
  
    const executor = argusToolExecutors[name];
    if (!executor) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    auditEvent.policyAllowed = true;
    
    const result = await executor(request.params.arguments || {});
    auditEvent.durationMs = Date.now() - startTime;
    appendFileSync('argus_mcp_audit.jsonl', JSON.stringify(auditEvent) + '\n');
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (err: any) {
    auditEvent.error = err.message;
    auditEvent.durationMs = Date.now() - startTime;
    appendFileSync('argus_mcp_audit.jsonl', JSON.stringify(auditEvent) + '\n');
    
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Error executing tool: ${err.message}`
      }]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[ARGUS-MCP] Server running on stdio');
}

main().catch((err) => {
  console.error('[ARGUS-MCP] Fatal error:', err);
  process.exit(1);
});
