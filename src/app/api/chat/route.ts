import { NextRequest, NextResponse } from "next/server";
import { executeQueryPlan } from "@/lib/insights";
import { conversationalReply, createQueryPlan, queryReply } from "@/lib/gemini";

export const runtime = "nodejs";

type ChatMessage = { role?: unknown; content?: unknown };

function describeError(error: unknown): string {
  if (error instanceof Error && typeof error.message === "string") return error.message;
  if (typeof error === "string") return error;
  try {
    const serialized = JSON.stringify(error);
    return serialized && serialized !== "{}" ? serialized.slice(0, 500) : "Please check the MCP connection and try again.";
  } catch {
    return "Please check the MCP connection and try again.";
  }
}

function cleanDisplayText(text: string): string {
  return text
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*+/g, "")
    .trim();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { question?: unknown; history?: ChatMessage[] } | null;
  if (!body || typeof body.question !== "string" || !body.question.trim()) return NextResponse.json({ error: "Please enter a business question." }, { status: 400 });
  const question = body.question.trim();
  const history = Array.isArray(body.history) ? body.history.filter((message) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string") as { role: "user" | "assistant"; content: string }[] : [];
  const needsContext = /\b(same|that|this|it|those|them|above|previous|in rupees|in inr)\b/i.test(question);
  const contextQuestion = needsContext && history.length > 1
    ? `${history.slice(0, -1).map((message) => `${message.role}: ${message.content}`).join("\n")}\nuser: ${question}`
    : question;
  const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/i.test(question);
  const isBusinessQuestion = /pipeline|deal|owner|sector|revenue|sales|work.?order|delivery|execution|billing|billed|collected|collection|receivable|amount|financial|contract|invoice|operational|leadership|executive.?update|forecast|stage|probability|close.?date/i.test(contextQuestion);

  if (isGreeting || !isBusinessQuestion) {
    try {
      const answer = await conversationalReply(question);
      if (answer) return NextResponse.json({ answer: cleanDisplayText(answer) });
    } catch (error) {
      console.error("Gemini conversational request failed", error);
    }
    return NextResponse.json({ answer: isGreeting ? "Hello! Ask me about pipeline, sectors, revenue, delivery, or a leadership update." : "I can analyse Skylark's live Deals and Work Orders data. Ask about pipeline, sectors, revenue, delivery, billing, or a leadership update." });
  }

  try {
    const plan = await createQueryPlan(contextQuestion);
    if (!plan) throw new Error("I could not translate that question into a safe data query. Please name the measure or grouping you need.");
    const result = await executeQueryPlan(plan, contextQuestion);
    const answer = await queryReply(question, result);
    const totals = result.measureTotals?.length ? ` Totals: ${result.measureTotals.map((row) => `${row.field}: ${row.formattedTotal}`).join("; ")}.` : "";
    const fallback = `${result.source}: ${result.matchingRecords} matching records.${totals} ${result.results.map((row) => `${row.group}: ${row.value} across ${row.recordCount} records`).join("; ")}. ${result.caveat}`;
    return NextResponse.json({ answer: cleanDisplayText(answer ?? fallback) });
  } catch (error) {
    console.error("monday MCP request failed", error);
    return NextResponse.json({ answer: `I couldn’t reach the monday.com data service. ${describeError(error)}` }, { status: 502 });
  }
}
