# Decision Log — Skylark Intelligence

## Decisions and assumptions

**Use the monday.com MCP server.** The brief permits MCP or API. MCP is the better prototype choice because it supplies an authenticated, typed tool surface over the source system and reduces custom GraphQL/authentication work. The app uses only `get_board_items_page`; no mutation tool is available to the agent path.

**Keep calculations deterministic.** The agent fetches board rows through MCP, then code performs filtering, summation, grouping, and missing-value checks. An LLM may improve explanation later, but should not be the source of financial arithmetic. This makes results testable and easier to explain.

**Create typed, separate source boards.** Deals and Work Orders are separate boards as required. Dates, values, statuses, and sectors are native typed fields so MCP filters and aggregations remain useful. The wide Work Orders sheet also retains its uncommon columns in `Source row`, preserving the supplied record without overwhelming the board layout.

**Treat blank values as unknown, not zero.** Amounts missing from a record are excluded from totals and counted as a caveat. This is more honest than treating absent data as a zero-value deal or completed project.

**Interpret “leadership updates” as an on-demand executive brief.** The agent produces a concise sales + operations summary: open pipeline and sector concentration, execution status, unbilled amount, receivables, and data-quality watch-outs. It is grounded in board values rather than a generic narrative.

## Trade-offs

The prototype loads relevant board rows before calculating answers. This is straightforward and reliable for the supplied data volume, but a larger production board would use MCP filters, server-side aggregations, and a short-lived cache. A personal API token is suitable for the evaluator’s prototype; a real multi-user deployment requires OAuth and encrypted token storage.

The first version recognizes high-value founder intents—pipeline and leadership/operations questions—instead of attempting unrestricted natural-language analytics. This narrower approach maximizes correctness within the six-hour time limit.

## With more time

I would add OAuth connection flow, conversation-aware clarification, semantic synonym mapping for sectors/stages, date-period parsing (including fiscal quarters), visual trend cards, audit logs, rate-limit-aware caching, and automated data-quality monitoring. I would also add tests that compare metrics against a fixed fixture derived from the imported boards.
