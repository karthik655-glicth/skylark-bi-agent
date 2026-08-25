# Skylark Intelligence

A read-only, conversational business-intelligence prototype for Skylark Drones. It turns live monday.com Deals and Work Orders into founder-level pipeline and leadership answers.

## Architecture

```text
Next.js chat UI → server route → official monday.com MCP (Streamable HTTP)
                                      ↓
                         typed board rows + deterministic metrics
                                      ↓
                         executive narrative with data caveats
```

The browser never receives a monday.com credential. The server initializes an MCP session, calls only `get_board_items_page`, follows pagination, and calculates totals itself. This avoids allowing an LLM to invent arithmetic or mutate the source boards.

## monday.com setup completed

Two private, read-only source boards were created in the Main workspace:

- `Skylark — Deals` (`5030844395`)
- `Skylark — Work Orders` (`5030844400`)

The supplied spreadsheets were imported into typed columns: dates remain dates, monetary values remain numbers, and stages/statuses/sectors are native monday.com labels. Less frequently analysed Work Order fields are preserved in the `Source row` field.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Create a **personal monday.com API token** for prototype use and set `MONDAY_MCP_TOKEN`. The app uses the official Streamable HTTP endpoint `https://mcp.monday.com/mcp`.
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open `http://localhost:3000`.

For a hosted prototype, deploy this folder to Vercel and configure the same variables in the deployment settings. Never commit `.env.local` or expose its value through a `NEXT_PUBLIC_` variable.

## Supported questions

- Pipeline health and sector concentration
- Deal value and data-quality caveats
- Work-order execution, billing, collections, and receivables
- A compact leadership update joining sales and operations

## Production follow-ups

Replace the personal prototype token with monday OAuth, persist only encrypted user-scoped tokens, restrict MCP tools to read operations at the gateway, add a short cache and audit log, and move board IDs to environment configuration.
