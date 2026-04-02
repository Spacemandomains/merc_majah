# Music Artist Directory — Merc Majah MCP Server

## Overview

A complete music artist directory system with a dedicated MCP (Model Context Protocol) server for rap artist **Merc Majah**. The MCP server allows AI agents (ChatGPT, Claude, Gemini, Grok, etc.) to look up authoritative, real-time information about the artist using the MCP protocol.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **MCP SDK**: @modelcontextprotocol/sdk v1.10+

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express REST API (artist CRUD + Merc Majah MCP endpoint)
│   ├── artist-admin/       # React + Vite admin web app
│   └── mcp-server/         # Standalone HTTP MCP server for Merc Majah (port 3001)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
```

## Artist Data Model

Each artist has:
- **Identity**: name, slug, bio, shortBio, genres, origin, formedYear
- **Media**: imageUrl
- **Social Links**: website, instagram, twitter, facebook, youtube, spotify, appleMusic, soundcloud, tiktok, bandcamp
- **Discography**: array of {title, year, type (album/ep/single/mixtape), spotifyUrl, appleMusicUrl, youtubeMusicUrl, tidalUrl, deezerUrl, amazonMusicUrl}
- **Music Videos**: array of {title, url, year, description}
- **Press Quotes**: array of {quote, source, year}
- **Business**: bookingEmail, pressEmail, labels, members, tags
- **LLM Context**: special free-text field written specifically for AI consumption

## Merc Majah MCP Server

### Primary HTTP Endpoint (via API Server — deployed & publicly accessible)

The MCP endpoint is embedded in the deployed API server at:

```
POST/GET/DELETE https://merc-majah.vercel.app/api/merc-majah/mcp
```

This is the URL to register with ChatGPT, Claude, Gemini, Grok, and other LLMs.

### Standalone MCP Server (development)

Also runs as a standalone Express server on **port 3001**:
- MCP endpoint: `http://localhost:3001/mcp`
- Health check: `http://localhost:3001/health`
- Workflow: "Merc Majah MCP Server"

### Tools exposed (Merc Majah only):

| Tool | Description |
|------|-------------|
| `get_profile` | Full artist profile — bio, discography, press, links, contact |
| `get_bio` | Biography, origin, history, artistic identity |
| `get_discography` | All releases with streaming links (filterable by type) |
| `get_music_videos` | Music videos with watch links |
| `get_social_links` | Social media profiles and streaming platform links |
| `get_press_quotes` | Press quotes and media coverage |
| `get_contact_info` | Booking and press contact emails |

### How to Register with LLMs

#### ChatGPT (GPT-4, GPT-4o)
1. Go to **Settings → Connectors → Add Connector**
2. Choose **"Custom"** → select **MCP**
3. Enter URL: `https://merc-majah.vercel.app/api/merc-majah/mcp`
4. Save — all 7 tools become available to ChatGPT

#### Claude (Anthropic)
1. Go to **Settings → Integrations → Add Integration**
2. Choose **"Remote MCP Server"**
3. Enter URL: `https://merc-majah.vercel.app/api/merc-majah/mcp`

#### Other LLMs (Gemini, Grok, etc.)
Each uses the same MCP URL. They support the MCP Streamable HTTP specification.

### Test the endpoint:
```bash
curl -X POST https://merc-majah.vercel.app/api/merc-majah/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Vercel Deployment

The project is configured for Vercel deployment at `merc-majah.vercel.app`.

### Files
- `vercel.json` — Build config, routing rules, CORS headers
- `api/index.mjs` — Vercel serverless function entry point (imports the bundled Express app)
- `artifacts/api-server/build-vercel.mjs` — esbuild bundler for the Vercel bundle
- `artifacts/api-server/src/vercel.ts` — Express app export (no `listen()` call)

### How to deploy

1. **Push code to GitHub** (commit everything including `pnpm-lock.yaml`)
2. **Create a Vercel project** connected to your GitHub repo
3. **Set environment variables** in Vercel project settings:
   - `DATABASE_URL` — Your PostgreSQL connection string (from Neon, Supabase, or any Postgres provider)
   - `NODE_ENV` — `production`
4. **Deploy** — Vercel runs the build command automatically:
   - Bundles the API server for serverless via esbuild
   - Builds the artist-admin React app
5. **Run database migrations** after first deploy:
   ```bash
   DATABASE_URL=<your-url> pnpm --filter @workspace/db run push
   ```

### Build command (run by Vercel automatically)
```bash
pnpm --filter @workspace/api-server run build:vercel && PORT=3000 BASE_PATH=/ pnpm --filter @workspace/artist-admin run build
```

### Routing
- `/api/*` → Express serverless function (all API + MCP routes)
- `/.well-known/*` → Static files (Smithery server card at `/.well-known/mcp/server-card.json`)
- Everything else → React SPA (`index.html`)

## Smithery Registration

1. Go to [smithery.ai/new](https://smithery.ai/new)
2. Choose **"URL"** tab
3. Enter: `https://merc-majah.vercel.app/api/merc-majah/mcp`
4. The `smithery.yaml` at the repo root will be picked up automatically if you use GitHub connect

## mcp.so Registration

Submit a GitHub issue at [github.com/mcp-so/mcp.so](https://github.com/mcp-so/mcp.so) with:
- **Name**: Merc Majah
- **MCP URL**: `https://merc-majah.vercel.app/api/merc-majah/mcp`
- **Description**: Official MCP server for rap artist Merc Majah

## General API Routes

Base path: `/api`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/artists` | List artists (paginated, filterable) |
| POST | `/artists` | Create artist |
| GET | `/artists/:id` | Get artist by ID |
| PUT | `/artists/:id` | Update artist |
| DELETE | `/artists/:id` | Delete artist |
| GET | `/artists/slug/:slug` | Get artist by slug |
| GET | `/artists/search?q=` | Full-text search |
| GET | `/genres` | List all genres |
| GET | `/stats` | Directory statistics |
| GET | `/healthz` | Health check |
| POST/GET/DELETE | `/merc-majah/mcp` | Merc Majah MCP (StreamableHTTP) |

## Admin Web App

React + Vite single-page app at `/` with:
- Dashboard with stats (total artists, genres, top genres chart, recently added)
- Artist roster with search, genre filter
- Full artist profile editor (all fields including discography, press quotes, social links, AI context)

## Development

```bash
# Push DB schema
pnpm --filter @workspace/db run push

# Run API server
pnpm --filter @workspace/api-server run dev

# Run admin app
pnpm --filter @workspace/artist-admin run dev

# Run standalone Merc Majah MCP server (port 3001)
pnpm --filter @workspace/mcp-server run dev

# Build MCP server for production
pnpm --filter @workspace/mcp-server run build

# Run codegen after OpenAPI changes
pnpm --filter @workspace/api-spec run codegen
```
