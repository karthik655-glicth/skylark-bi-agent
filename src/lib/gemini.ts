import { GoogleGenAI } from "@google/genai";
import type { BusinessFacts } from "@/lib/insights";

export type QueryPlan = {
  board: "deals" | "work_orders";
  aggregation: "count" | "sum" | "average";
  measure?: string;
  measures?: string[];
  groupBy?: string;
  groupBys?: string[];
  filters?: Array<{ column: string; operator: "equals" | "contains"; value: string }>;
  sort?: "value_desc" | "value_asc" | "count_desc" | "count_asc";
  limit?: number;
};

const dataDictionary = `
Canonical Boards & Columns for Skylark Drones:

Board 1: "deals" (Sales & Pipeline)
- deal_name (text): Name/title of the deal or project
- owner_code (text): Sales representative / deal owner
- client_code (text): Customer / client code
- deal_status (status): "Open", "Won", "Lost"
- actual_close_date (date): Date the deal was officially closed
- closure_probability (status): Confidence level ("High", "Medium", "Low")
- deal_value (number): Value of the deal in Indian Rupees (INR) - ONLY numeric measure on deals
- tentative_close_date (date): Expected/projected closing date
- deal_stage (status): Pipeline stage (e.g., "Proposal", "Negotiation", "Lead", "Discovery")
- product_deal (text): Drone or software product offering (e.g., "Spectra", "Drone Mission", "Surveys")
- sector (dropdown): Industry vertical (e.g., "Mining", "Solar", "Utilities", "Infrastructure", "Agriculture")
- created_date (date): Date deal was created

Board 2: "work_orders" (Operations, Execution, Billing & Collections)
- deal_name (text): Work order or project name
- customer_code (text): Customer / client code
- serial_number (text): Work order serial number
- nature_of_work (dropdown): Scope of work (e.g., "Recurring", "One-time", "Pilot")
- execution_status (status): Delivery/Execution status (e.g., "Completed", "In Progress", "Yet to Start", "On Hold")
- data_delivery_date (date): Date data deliverables were submitted
- po_loi_date (date): Purchase Order / Letter of Intent date
- document_type (dropdown): "PO", "LOI", "Work Order", "Contract"
- probable_start_date (date): Estimated project start date
- probable_end_date (date): Estimated project completion date
- owner_code (text): Operations / Project owner managing delivery
- sector (dropdown): Industry vertical (e.g., "Mining", "Renewables", "Infrastructure")
- type_of_work (text): Specific drone service / product type
- contract_value_excl_gst (number): Total contract / work order value (excl. GST)
- billed_value_excl_gst (number): Total amount invoiced / billed to date (excl. GST)
- collected_amount_incl_gst (number): Total payments collected / received (incl. GST)
- amount_to_bill_excl_gst (number): Remaining unbilled amount / to be billed (excl. GST)
- amount_receivable (number): Outstanding unpaid / receivable amount from customer
- invoice_status (status): Status of invoice (e.g., "Issued", "Pending", "Paid")
- billing_status (status): "Billed", "Unbilled", "Partially Billed"
- collection_status (status): "Collected", "Pending", "Overdue"
- expected_billing_month (month/category): Projected month for invoicing
- actual_billing_month (month/category): Actual month invoiced
- actual_collection_month (month/category): Actual month payment was collected
- ar_priority_account (category): High-priority Accounts Receivable tag
- last_executed_month (month/category): Last active operations month

Rules:
- Deals/Pipeline questions use board "deals".
- Work Order/Execution/Billing/Receivables/Operations questions use board "work_orders".
- Questions asking for "highest", "top", "rank", "compare", "breakdown", "by <category>" MUST set "groupBy" to the category column and "sort": "value_desc" or "count_desc".
- "open pipeline" or "current pipeline" -> filter deal_status equals "Open".
- "unbilled" or "to bill" -> measure "amount_to_bill_excl_gst".
- "receivables" or "outstanding" -> measure "amount_receivable".
- "billed value" -> measure "billed_value_excl_gst".
- "collected amount" or "collections" -> measure "collected_amount_incl_gst".
- "work order value" or "contract value" -> measure "contract_value_excl_gst".
- "deal value" or "pipeline value" -> measure "deal_value".
- If comparing two metrics (e.g. billed vs collected), set measures to ["billed_value_excl_gst", "collected_amount_incl_gst"].
- Return ONLY the JSON query plan matching the schema.`;

const queryPlanSchema = {
  type: "object",
  properties: {
    board: { type: "string", enum: ["deals", "work_orders"] },
    aggregation: { type: "string", enum: ["count", "sum", "average"] },
    measure: {
      type: "string",
      enum: [
        "deal_value",
        "contract_value_excl_gst",
        "billed_value_excl_gst",
        "collected_amount_incl_gst",
        "amount_to_bill_excl_gst",
        "amount_receivable",
      ],
    },
    measures: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "deal_value",
          "contract_value_excl_gst",
          "billed_value_excl_gst",
          "collected_amount_incl_gst",
          "amount_to_bill_excl_gst",
          "amount_receivable",
        ],
      },
    },
    groupBy: {
      type: "string",
      enum: [
        "deal_name",
        "owner_code",
        "client_code",
        "deal_status",
        "actual_close_date",
        "closure_probability",
        "tentative_close_date",
        "deal_stage",
        "product_deal",
        "sector",
        "created_date",
        "customer_code",
        "serial_number",
        "nature_of_work",
        "execution_status",
        "data_delivery_date",
        "po_loi_date",
        "document_type",
        "probable_start_date",
        "probable_end_date",
        "type_of_work",
        "invoice_status",
        "billing_status",
        "collection_status",
        "last_executed_month",
        "skylark_platform_in_deliverables",
        "last_invoice_date",
        "latest_invoice_no",
        "amount_incl_gst",
        "billed_value_incl_gst",
        "amount_to_bill_incl_gst",
        "ar_priority_account",
        "quantity_by_ops",
        "quantities_as_per_po",
        "quantity_billed",
        "balance_quantity",
        "expected_billing_month",
        "actual_billing_month",
        "actual_collection_month",
        "wo_status_billed",
        "collection_date",
      ],
    },
    groupBys: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "deal_name",
          "owner_code",
          "client_code",
          "deal_status",
          "actual_close_date",
          "closure_probability",
          "tentative_close_date",
          "deal_stage",
          "product_deal",
          "sector",
          "created_date",
          "customer_code",
          "serial_number",
          "nature_of_work",
          "execution_status",
          "data_delivery_date",
          "po_loi_date",
          "document_type",
          "probable_start_date",
          "probable_end_date",
          "type_of_work",
          "invoice_status",
          "billing_status",
          "collection_status",
          "last_executed_month",
          "skylark_platform_in_deliverables",
          "last_invoice_date",
          "latest_invoice_no",
          "ar_priority_account",
          "expected_billing_month",
          "actual_billing_month",
          "actual_collection_month",
          "wo_status_billed",
          "collection_date",
        ],
      },
    },
    filters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          column: { type: "string" },
          operator: { type: "string", enum: ["equals", "contains"] },
          value: { type: "string" },
        },
        required: ["column", "operator", "value"],
      },
    },
    sort: { type: "string", enum: ["value_desc", "value_asc", "count_desc", "count_asc"] },
    limit: { type: "number" },
  },
  required: ["board", "aggregation"],
};

const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export async function conversationalReply(question: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: `You are Skylark Drones' executive business-intelligence assistant. The user said: "${question}".

If this is a greeting, greet them warmly and suggest 3 high-impact questions they can ask about sales pipeline, sector performance, revenue, work-order execution, or leadership briefings. If unrelated to BI, politely explain that you provide live intelligence from Skylark's Deals and Work Orders boards. Keep the response concise and professional.`,
  });

  return response.text?.trim() || null;
}

export async function createQueryPlan(question: string, history?: string): Promise<QueryPlan | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const contextBlock = history ? `Conversation context:\n${history}\n\n` : "";
  const response = await ai.models.generateContent({
    model,
    config: {
      responseMimeType: "application/json",
      responseSchema: queryPlanSchema,
    },
    contents: `Convert the user's business question into one safe JSON query plan.\n\n${dataDictionary}\n\n${contextBlock}Current question: ${question}`,
  });
  try { return JSON.parse(response.text ?? "") as QueryPlan; } catch { return null; }
}

export async function businessReply(question: string, facts: BusinessFacts) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: `You are Skylark Drones' Chief BI Officer presenting directly to executive leadership / founders.
Synthesize the verified facts below into a high-impact leadership briefing.

Formatting & Style Instructions:
1. Executive Summary: Start with a crisp 1-2 sentence bottom line with key headline metrics in **bold**.
2. Structured Breakdown: Use clean Markdown tables to present sector breakdowns, top deal owners, and operational progress (e.g. | Sector | Deals | Pipeline Value |).
3. Strategic Insights: Provide 2-3 concise bullet points highlighting key business drivers, concentration risks, or operational momentum.
4. Data Note: ONLY include a caveat/note if there are actually missing values (> 0) reported in the facts. If there are 0 missing records, DO NOT mention any caveats or data quality disclaimers.
5. Currency: Format all monetary amounts in Indian Rupees (e.g. Rs 12.5 Cr or Rs 45 Lakhs). Never use dollars ($).

User question: ${question}

Verified facts:
${JSON.stringify(facts)}`,
  });
  return response.text?.trim() || null;
}

export async function queryReply(question: string, result: unknown) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: `You are Skylark Drones' Chief BI Officer presenting directly to executive leadership / founders.
Answer the user's business question using ONLY this verified, live monday.com query result. Do not invent numbers.

Formatting & Style Instructions:
1. Direct Answer: Start with a clear, direct answer in 1-2 sentences with key figures in **bold**.
2. Table Breakdown: Whenever multiple items, sectors, owners, stages, or comparisons are present in the results, format them as a clean Markdown table (e.g. | Sector | Records | Total Value | Share (%) |).
3. Key Takeaways: Provide 2-3 concise bullet points highlighting the main takeaways, top contributors, or business context.
4. Data Note: ONLY include a data caveat note if the "caveat" field in the verified result is present and non-null. If "caveat" is null or missing records is 0, DO NOT mention any caveats or data quality disclaimers.
5. Currency: Format all monetary amounts in Indian Rupees with Rs or INR (e.g. Rs 4.5 Cr, Rs 75 Lakhs, Rs 2,50,000). Never use $.

User Question: ${question}

Verified result:
${JSON.stringify(result)}`,
  });
  return response.text?.trim() || null;
}
