# Merc Majah MCP Server

> Official Model Context Protocol (MCP) server for rap artist **Merc Majah** — built for AI agents.

[![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-blue)](https://modelcontextprotocol.io)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://merc-majah.vercel.app)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF)](https://stripe.com)

---

## What this is

This server lets AI assistants (ChatGPT, Claude, Gemini, Grok, and others) look up authoritative, real-time information about Merc Majah using the [Model Context Protocol](https://modelcontextprotocol.io). When a user asks an AI about the artist, it calls this server to get accurate data instead of hallucinating.

**MCP Endpoint:**
```
POST https://merc-majah.vercel.app/api/merc-majah/mcp
```

---

## Tools

| Tool | Description |
|------|-------------|
| `get_profile` | Full artist profile — bio, discography, press, links, contact |
| `get_bio` | Biography, origin, history, artistic identity |
| `get_discography` | All releases with streaming links (filterable by type) |
| `get_music_videos` | Music videos with watch links |
| `get_social_links` | Social media profiles and streaming platform links |
| `get_press_quotes` | Press quotes and media coverage |
| `get_contact_info` | Booking and press contact emails |
| `get_merch` | Official merchandise item with description and buy link |
| `buy_merchandise` | Machine-to-machine Stripe checkout — returns direct payment link |

---

## Register with AI Platforms

### ChatGPT
1. Settings → Connectors → Add Connector → Custom → MCP
2. URL: `https://merc-majah.vercel.app/api/merc-majah/mcp`

### Claude (Anthropic)
1. Settings → Integrations → Add Integration → Remote MCP Server
2. URL: `https://merc-majah.vercel.app/api/merc-majah/mcp`

### Smithery AI
Submit at [smithery.ai/new](https://smithery.ai/new) — `smithery.yaml` is included in this repo for automatic discovery.

### mcp.so
Submit a GitHub issue at [mcp.so](https://mcp.so) with the MCP URL above.

### Test the endpoint
```bash
curl -X POST https://merc-majah.vercel.app/api/merc-majah/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## Merchandise

The `get_merch` and `buy_merchandise` tools surface the **Majah Life Tee Shirt** ($25) to users through their AI assistant. Payment is handled by Stripe — the AI returns a direct checkout link that completes without leaving the conversation flow.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Protocol | MCP Streamable HTTP (`@modelcontextprotocol/sdk`) |
| API Server | Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Frontend | React + Vite + Tailwind CSS |
| Payments | Stripe (restricted key + Payment Links) |
| Deployment | Vercel (serverless) |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
merc_majah/
├── api/
│   └── index.mjs                    # Vercel serverless function entry point
├── artifacts/
│   ├── api-server/                  # Express REST API + MCP endpoint
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── merc-majah-mcp.ts   # MCP server with all 9 tools
│   │   │   │   └── merch.ts            # REST endpoint for merch data
│   │   │   └── vercel.ts           # Vercel-compatible app export
│   │   └── build-vercel.mjs        # esbuild bundler for Vercel
│   ├── artist-admin/               # React admin dashboard
│   │   └── public/
│   │       └── .well-known/mcp/
│   │           └── server-card.json   # Smithery auto-scan config
│   └── mcp-server/                 # Standalone HTTP MCP server (dev, port 3001)
├── lib/
│   ├── api-spec/                   # OpenAPI spec + Orval codegen
│   ├── api-client-react/           # Generated React Query hooks
│   ├── api-zod/                    # Generated Zod schemas
│   └── db/                        # Drizzle ORM schema + DB connection
├── smithery.yaml                   # Smithery AI registration config
├── vercel.json                     # Vercel deployment config
└── .env.example                    # Required environment variables
```

---

## Deploy to Vercel

1. Import this repo at [vercel.com/new](https://vercel.com/new)
2. Add environment variables (see `.env.example`):
   - `DATABASE_URL` — PostgreSQL connection string
   - `STRIPE_RESTRICTED_KEY` — Stripe restricted API key
   - `STRIPE_MERCH_PAYMENT_LINK` — Stripe Payment Link URL
   - `MERCH_ITEM_NAME`, `MERCH_ITEM_PRICE`, `MERCH_ITEM_DESCRIPTION`
3. Deploy — Vercel auto-detects `vercel.json` and runs the build

---

## Local Development

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Run the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Run the admin dashboard
pnpm --filter @workspace/artist-admin run dev

# Run the standalone MCP server (port 3001)
pnpm --filter @workspace/mcp-server run dev
```

---

## Artist Data

Artist profiles are managed through the admin dashboard and stored in PostgreSQL. Each profile includes:

- Biography, short bio, genres, origin, formed year
- Discography with streaming links (Spotify, Apple Music, YouTube Music, Tidal, Deezer, Amazon Music)
- Music videos with watch links
- Press quotes and media coverage
- Social media and streaming platform links
- Booking and press contact emails
- LLM context field (custom text written specifically for AI consumption)

---

## License

MIT
