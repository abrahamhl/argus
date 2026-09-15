#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { argusTools, argusToolExecutors } from '@argus/ai';

const server = new Server({
  name: 'argus-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

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
  const executor = argusToolExecutors[name];
  
  if (!executor) {
    throw new Error(`Tool not found: ${name}`);
  }

  try {
    const result = await executor(request.params.arguments || {});
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (err: any) {
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
