type RpcResponse = { result?: unknown; error?: unknown };

const endpoint = process.env.MONDAY_MCP_URL ?? "https://mcp.monday.com/mcp";

function parseRpcBody(body: string): RpcResponse {
  const json = body.startsWith("data:") ? body.split("\n").find((line) => line.startsWith("data:"))?.slice(5).trim() : body;
  return JSON.parse(json ?? "{}") as RpcResponse;
}

function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  try {
    const serialized = JSON.stringify(error);
    return typeof serialized === "string" && serialized !== "{}" ? `monday MCP error: ${serialized}` : "The monday MCP server returned an unrecognised error.";
  } catch {
    return "The monday MCP server returned an unrecognised error.";
  }
}

async function rpc(method: string, params: unknown, sessionId?: string): Promise<{ response: RpcResponse; sessionId?: string }> {
  const token = process.env.MONDAY_MCP_TOKEN;
  if (!token) throw new Error("MONDAY_MCP_TOKEN is not configured.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(sessionId ? { "mcp-session-id": sessionId } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method, params }),
    cache: "no-store",
  });
  const responseText = await response.text();
  if (!response.ok) throw new Error(`monday MCP returned ${response.status}: ${responseText.slice(0, 300)}`);
  const parsed = parseRpcBody(responseText);
  if (parsed.error) throw new Error(`${method} failed: ${errorMessage(parsed.error)}`);
  return { response: parsed, sessionId: response.headers.get("mcp-session-id") ?? sessionId ?? undefined };
}

async function notify(method: string, params: unknown, sessionId?: string) {
  const token = process.env.MONDAY_MCP_TOKEN;
  if (!token) throw new Error("MONDAY_MCP_TOKEN is not configured.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(sessionId ? { "mcp-session-id": sessionId } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", method, params }),
    cache: "no-store",
  });
  if (!response.ok && response.status !== 202) throw new Error(`${method} notification failed with ${response.status}.`);
}

function toolText(result: unknown): string {
  const content = (result as { content?: Array<{ text?: string }> })?.content ?? [];
  return content.map((part) => part.text ?? "").join("\n");
}

function findItems(result: unknown): Array<Record<string, unknown>> {
  const text = toolText(result);
  const parsed = JSON.parse(text) as { data?: { items?: Array<Record<string, unknown>> }; items?: Array<Record<string, unknown>> };
  return parsed.data?.items ?? parsed.items ?? [];
}

async function resolveItemsTool(sessionId?: string) {
  const listed = await rpc("tools/list", {}, sessionId);
  const tools = ((listed.response.result as { tools?: Array<{ name?: string }> })?.tools ?? []);
  const tool = tools.find((entry) => entry.name === "get_board_items_page") ?? tools.find((entry) => entry.name?.endsWith("get_board_items_page"));
  if (!tool?.name) throw new Error("The connected monday MCP server does not expose get_board_items_page.");
  return tool.name;
}

export async function getBoardItems(boardId: number, columnIds?: string[]) {
  const start = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "skylark-bi-agent", version: "0.1.0" } });
  const sessionId = start.sessionId;
  await notify("notifications/initialized", {}, sessionId);
  const itemsTool = await resolveItemsTool(sessionId);
  const items: Array<Record<string, unknown>> = [];
  let cursor: string | undefined;
  do {
    const call = await rpc("tools/call", { name: itemsTool, arguments: { boardId, includeColumns: true, ...(columnIds?.length ? { columnIds } : {}), limit: 100, ...(cursor ? { cursor } : {}) } }, sessionId);
    items.push(...findItems(call.response.result));
    const raw = JSON.parse(toolText(call.response.result)) as { data?: { nextCursor?: string; next_cursor?: string }; pagination?: { nextCursor?: string; next_cursor?: string } };
    cursor = raw.data?.nextCursor ?? raw.data?.next_cursor ?? raw.pagination?.nextCursor ?? raw.pagination?.next_cursor;
  } while (cursor);
  return items;
}

export function columnText(item: Record<string, unknown>, columnId: string): string | null {
  const source = item.column_values ?? item.columnValues ?? [];
  if (!Array.isArray(source) && source && typeof source === "object") {
    const direct = (source as Record<string, unknown>)[columnId];
    if (typeof direct === "string") return direct;
    if (direct && typeof direct === "object") {
      const value = direct as { text?: unknown; value?: unknown; label?: unknown; labels?: unknown };
      if (typeof value.text === "string") return value.text;
      if (typeof value.value === "string") return value.value;
      if (typeof value.label === "string") return value.label;
      if (Array.isArray(value.labels)) return value.labels.filter((label): label is string => typeof label === "string").join(", ");
    }
  }
  const columns = (Array.isArray(source)
    ? source as Array<{ id?: string; text?: string | null; value?: string | null }>
    : Object.values(source as Record<string, unknown>) as Array<{ id?: string; text?: string | null; value?: string | null }>)
    .filter((value): value is { id?: string; text?: string | null; value?: string | null } => Boolean(value && typeof value === "object"));
  const column = columns.find((value) => value.id === columnId);
  if (!column) return null;
  if (typeof column.text === "string") return column.text;
  if (typeof column.value === "string") return column.value;
  return null;
}
