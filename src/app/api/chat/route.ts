import { NextRequest, NextResponse } from "next/server";
import { executeQueryPlan, getBusinessFacts, fallbackBusinessAnswer } from "@/lib/insights";
import { conversationalReply, createQueryPlan, queryReply, businessReply } from "@/lib/gemini";

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
  return text.trim();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { question?: unknown; history?: ChatMessage[] } | null;
  if (!body || typeof body.question !== "string" || !body.question.trim()) return NextResponse.json({ error: "Please enter a business question." }, { status: 400 });
  const question = body.question.trim();
  const history = Array.isArray(body.history) ? body.history.filter((message) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string") as { role: "user" | "assistant"; content: string }[] : [];
  
  const historyContext = history.length > 0
    ? history.slice(-6).map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`).join("\n")
    : undefined;

  const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/i.test(question);
  const isBusinessQuestion = /pipeline|deal|owner|sector|revenue|sales|work.?order|delivery|execution|billing|billed|collected|collection|receivable|amount|financial|contract|invoice|operational|leadership|executive.?update|forecast|stage|probability|close.?date|how|which|what|top|highest|compare|breakdown/i.test(question);

  if (isGreeting || !isBusinessQuestion) {
    try {
      const answer = await conversationalReply(question);
      if (answer) return NextResponse.json({ answer: cleanDisplayText(answer) });
    } catch (error) {
      console.error("Gemini conversational request failed", error);
    }
    return NextResponse.json({ answer: isGreeting ? "Hello! Ask me about pipeline, sector performance, revenue, work-order delivery, or a leadership update." : "I can analyse Skylark's live Deals and Work Orders data. Ask about pipeline, sectors, revenue, delivery, billing, or a leadership update." });
  }

  const isOverviewQuestion = /how is (our |the )?pipeline|pipeline looking|leadership update|executive update|leadership briefing|business update|overview of (our |the )?pipeline|weekly update/i.test(question);

  if (isOverviewQuestion) {
    try {
      const facts = await getBusinessFacts(question);
      const answer = await businessReply(question, facts);
      const fallback = fallbackBusinessAnswer(facts);
      return NextResponse.json({ answer: cleanDisplayText(answer ?? fallback) });
    } catch (error) {
      console.error("Business facts request failed", error);
      return NextResponse.json({ answer: `I couldn’t retrieve the data from monday.com. ${describeError(error)}` }, { status: 502 });
    }
  }

  try {
    const plan = await createQueryPlan(question, historyContext);
    if (!plan) throw new Error("I could not translate that question into a safe data query. Please name the measure or grouping you need.");
    const result = await executeQueryPlan(plan, question);
    const answer = await queryReply(question, result);
    const totals = result.measureTotals?.length ? `\n\n**Totals:** ${result.measureTotals.map((row) => `${row.field}: ${row.formattedTotal}`).join("; ")}` : "";
    const caveatLine = result.caveat ? `\n\n_${result.caveat}_` : "";
    const fallback = `**${result.source}** (${result.matchingRecords} matching records)${totals}\n\n${result.results.map((row) => `• **${row.group}:** ${row.formattedValue || row.value}${row.shareOfTotal ? ` (${row.shareOfTotal})` : ""} across ${row.recordCount} records`).join("\n")}${caveatLine}`;
    return NextResponse.json({ answer: cleanDisplayText(answer ?? fallback) });
  } catch (error) {
    console.error("monday MCP request failed", error);
    return NextResponse.json({ answer: `I couldn’t complete the analysis on monday.com. ${describeError(error)}` }, { status: 502 });
  }
}
