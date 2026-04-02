# Connecting FreqDirectory to AI Assistants

This guide covers how to connect the **FreqDirectory Music Artist MCP Server** to the top AI platforms. Once connected, LLMs will serve authoritative artist profiles directly from your directory when users ask about those artists.

---

## What You Need First

Before connecting to any platform, deploy the app so it has a permanent public URL. After deploying, your MCP server endpoint will be:

```
https://YOUR_DEPLOYED_DOMAIN/mcp
```

And the OpenAPI spec will be at:

```
https://YOUR_DEPLOYED_DOMAIN/api/openapi.json
```

### MCP Transport Notes

The `/mcp` endpoint uses **stateless StreamableHTTP transport** — each request is handled independently with no persistent session. This is the recommended approach for hosted read-only MCP servers and is supported by all major MCP clients. If you encounter a client that requires session-based connections, contact support to discuss a stateful deployment option.

---

## 1. Claude Desktop (Anthropic)

Claude Desktop supports MCP servers natively via its config file.

**Step 1: Find or create the config file**

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/claude/claude_desktop_config.json` |

**Step 2: Add the MCP server**

For the HTTP transport (recommended for hosted servers):

```json
{
  "mcpServers": {
    "music-artist-directory": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://YOUR_DEPLOYED_DOMAIN/mcp"
      ]
    }
  }
}
```

> **Note:** `mcp-remote` is a bridge that lets Claude Desktop connect to HTTP MCP servers. Install it once with `npm install -g mcp-remote` or let `npx` handle it automatically.

**Step 3:** Restart Claude Desktop. You'll see a tools icon in the chat interface confirming the connection.

---

## 2. ChatGPT Custom GPT (OpenAI)

ChatGPT Custom GPTs use "Actions" — which import an OpenAPI spec to define what the GPT can do.

**Step 1:** Go to [chat.openai.com](https://chat.openai.com) → your profile → **My GPTs** → **Create a GPT**.

**Step 2:** In the GPT editor, click **Configure** → **Add Actions**.

**Step 3:** Click **Import from URL** and enter:

```
https://YOUR_DEPLOYED_DOMAIN/api/openapi.json
```

ChatGPT will auto-populate all available API operations (list artists, get artist, search, genres, stats).

**Step 4:** Set authentication to **None** (the API is public read-only).

**Step 5:** Save and publish the GPT. It can now retrieve live artist profiles when asked.

---

## 3. Claude.ai (Claude Projects & Web)

For Claude.ai web (not Desktop), you can use the MCP server via Claude Projects if you have a Claude Pro or Team plan.

**Step 1:** Go to [claude.ai](https://claude.ai) → **Projects** → open or create a project.

**Step 2:** In the project settings, look for **Integrations** or **Tools** and add a custom MCP server with URL:

```
https://YOUR_DEPLOYED_DOMAIN/mcp
```

> **Note:** Claude.ai web MCP support is rolling out gradually. Check Anthropic's documentation for the latest availability.

---

## 4. Microsoft Copilot Studio

Microsoft Copilot Studio supports custom connectors via OpenAPI specs.

**Step 1:** Go to [copilotstudio.microsoft.com](https://copilotstudio.microsoft.com) and open or create a copilot.

**Step 2:** Navigate to **Actions** → **Add an action** → **Connector** → **Custom connector**.

**Step 3:** Select **Import from OpenAPI URL** and enter:

```
https://YOUR_DEPLOYED_DOMAIN/api/openapi.json
```

**Step 4:** Configure authentication as **No authentication** (or add API key if you secure it later).

**Step 5:** Map actions to topics or add them to the general knowledge actions list.

---

## 5. Gemini (Google AI Studio / Gemini Advanced)

Gemini supports function calling via the Google AI Studio API and Gemini Advanced Extensions.

**Option A — Google AI Studio API (developers)**

Use the Gemini API with function calling. Pass the tool definitions from the OpenAPI spec:

```javascript
const tools = [
  {
    functionDeclarations: [
      {
        name: "get_artist",
        description: "Get authoritative info about a music artist",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Artist name" },
            slug: { type: "STRING", description: "Artist slug" }
          }
        }
      },
      {
        name: "search_artists",
        description: "Search the music artist directory",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Search query" },
            genre: { type: "STRING", description: "Filter by genre" },
            limit: { type: "INTEGER", description: "Max results" }
          },
          required: ["query"]
        }
      }
    ]
  }
];
```

When Gemini calls these functions, proxy the call to:
```
GET https://YOUR_DEPLOYED_DOMAIN/api/artists/slug/{slug}
GET https://YOUR_DEPLOYED_DOMAIN/api/artists/search?q={query}
```

**Option B — Gemini Extensions (Gemini Advanced subscribers)**

Gemini Extensions use OpenAPI specs. Submit your spec URL at [ai.google.dev](https://ai.google.dev) via the Extensions program when it becomes publicly available.

---

## 6. Grok (xAI)

Grok supports tool calling via the xAI API (compatible with OpenAI SDK format).

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1"
});

const tools = [
  {
    type: "function",
    function: {
      name: "get_artist",
      description: "Get detailed info about a music artist from the directory",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Artist name" },
          slug: { type: "string", description: "Artist slug" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_artists",
      description: "Search the music artist directory",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          genre: { type: "string" },
          limit: { type: "integer", default: 5 }
        },
        required: ["query"]
      }
    }
  }
];

const response = await client.chat.completions.create({
  model: "grok-beta",
  messages: [{ role: "user", content: "Tell me about Arctic Monkeys" }],
  tools
});
```

Handle tool calls by calling `https://YOUR_DEPLOYED_DOMAIN/api/...` and returning results back to Grok.

---

## 7. Smithery Registry

Smithery is an MCP server registry that lets users discover and connect your server.

**Step 1:** Create an account at [smithery.ai](https://smithery.ai).

**Step 2:** Submit your server for listing:
- Repository URL: your GitHub repo URL
- The `smithery.yaml` file at the root of this repo describes the server configuration

**Step 3:** Smithery will read `smithery.yaml` and automatically populate:
- Server name and description
- Available tools list
- Connection method (HTTP endpoint at `/mcp`)

**Step 4:** After approval, users can find your server at `smithery.ai/servers/music-artist-directory` and connect with one click.

---

## 8. mcp.so Registry

mcp.so is a community directory of MCP servers.

**Step 1:** Go to [mcp.so](https://mcp.so) and sign in.

**Step 2:** Click **Submit a server** and fill in:

| Field | Value |
|-------|-------|
| Name | Music Artist Directory |
| Description | Authoritative music artist profiles for AI assistants |
| MCP Endpoint | `https://YOUR_DEPLOYED_DOMAIN/mcp` |
| Transport | HTTP (StreamableHTTP) |
| Tools | get_artist, search_artists, list_artists, list_genres, get_directory_stats |
| Category | Music / Entertainment |

**Step 3:** Submit for review. Once approved, LLM users browsing mcp.so can connect to your server directly.

---

## Quick Reference

| Platform | Connection Method | URL/Config |
|----------|-----------------|------------|
| Claude Desktop | stdio via `mcp-remote` | `https://YOUR_DEPLOYED_DOMAIN/mcp` |
| ChatGPT Custom GPT | OpenAPI Actions import | `https://YOUR_DEPLOYED_DOMAIN/api/openapi.json` |
| Copilot Studio | OpenAPI connector | `https://YOUR_DEPLOYED_DOMAIN/api/openapi.json` |
| Gemini API | Function declarations | `https://YOUR_DEPLOYED_DOMAIN/api/...` |
| Grok | Tool calling | `https://YOUR_DEPLOYED_DOMAIN/api/...` |
| Smithery | Registry listing | `smithery.yaml` at repo root |
| mcp.so | Registry submission | `https://YOUR_DEPLOYED_DOMAIN/mcp` |

---

## Testing the Connection

After deploying, verify the endpoints are live:

```bash
# Health check
curl https://YOUR_DEPLOYED_DOMAIN/api/healthz

# OpenAPI spec (for ChatGPT/Copilot import)
curl https://YOUR_DEPLOYED_DOMAIN/api/openapi.json

# MCP handshake (for Smithery/mcp.so verification)
curl -X POST https://YOUR_DEPLOYED_DOMAIN/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# List all MCP tools
curl -X POST https://YOUR_DEPLOYED_DOMAIN/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## Local Development (stdio transport)

For local testing with Claude Desktop using the stdio transport directly:

```bash
# Build the MCP server
pnpm --filter @workspace/mcp-server run build

# Test it directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node artifacts/mcp-server/dist/index.mjs
```

Claude Desktop config for local stdio:

```json
{
  "mcpServers": {
    "music-artist-directory-local": {
      "command": "node",
      "args": ["/path/to/your/workspace/artifacts/mcp-server/dist/index.mjs"],
      "env": {
        "DATABASE_URL": "your-database-url"
      }
    }
  }
}
```
