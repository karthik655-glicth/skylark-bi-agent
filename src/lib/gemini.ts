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
Deals columns: deal_name (text), owner_code (text), client_code (text), deal_status (status), actual_close_date (date), closure_probability (status), deal_value (number), tentative_close_date (date), deal_stage (status), product_deal (text), sector (dropdown), created_date (date).
Work Orders columns: deal_name (text), customer_code (text), serial_number (text), nature_of_work (dropdown), execution_status (status), data_delivery_date (date), po_loi_date (date), document_type (dropdown), probable_start_date (date), probable_end_date (date), owner_code (text), sector (dropdown), type_of_work (text), contract_value_excl_gst (number), billed_value_excl_gst (number), collected_amount_incl_gst (number), amount_to_bill_excl_gst (number), amount_receivable (number), invoice_status (status), billing_status (status), collection_status (status), last_executed_month (month/category), skylark_platform_in_deliverables (category), last_invoice_date (date), latest_invoice_no (text), amount_incl_gst (number), billed_value_incl_gst (number), amount_to_bill_incl_gst (number), ar_priority_account (category), quantity_by_ops (number), quantities_as_per_po (number), quantity_billed (number), balance_quantity (number), expected_billing_month (month/category), actual_billing_month (month/category), actual_collection_month (month/category), wo_status_billed (status), collection_date (date).
Allowed operations: count records, sum number columns, average number columns, optionally group by one column, compare multiple grouped category columns with "groupBys", optionally filter by exact value or text contains. Use only listed canonical column names.

Planning rules:
- Questions about pipeline/deals/sales use board "deals".
- Questions about work orders/delivery/billing/collections/receivables/contracts use board "work_orders".
- "highest", "top", "largest", "strongest", "compare", "breakdown", "grouped by", or "by <category>" require groupBy when the user names a category. Never aggregate into a single total for these questions.
- "work order value" means measure "contract_value_excl_gst".
- "billed value" means measure "billed_value_excl_gst".
- "collected amount" means measure "collected_amount_incl_gst".
- "pipeline value", "deal value", or deal revenue means measure "deal_value".
- If the user asks to compare two numeric metrics, put both in "measures".
- If the user asks to compare two category/date columns, put both in "groupBys" and use aggregation "count".
- "most deals" or "most work orders" means aggregation "count" grouped by the requested category.
- "current pipeline" or "open pipeline" means add filter deal_status equals Open.
- Do not answer the question. Return the query plan only.

Examples:
Question: Which sectors have the highest work order value?
Plan: {"board":"work_orders","aggregation":"sum","measure":"contract_value_excl_gst","groupBy":"sector","sort":"value_desc"}
Question: Compare deal values by product type.
Plan: {"board":"deals","aggregation":"sum","measure":"deal_value","groupBy":"product_deal","sort":"value_desc"}
Question: What is the current pipeline value grouped by deal stage?
Plan: {"board":"deals","aggregation":"sum","measure":"deal_value","groupBy":"deal_stage","filters":[{"column":"deal_status","operator":"equals","value":"Open"}],"sort":"value_desc"}
Question: Which owners are handling the most work orders?
Plan: {"board":"work_orders","aggregation":"count","groupBy":"owner_code","sort":"count_desc"}
Question: What is the total billed value versus collected amount?
Plan: {"board":"work_orders","aggregation":"sum","measures":["billed_value_excl_gst","collected_amount_incl_gst"]}
Question: Compare expected billing month with actual billing month.
Plan: {"board":"work_orders","aggregation":"count","groupBys":["expected_billing_month","actual_billing_month"]}`;

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

const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

export async function conversationalReply(question: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: `You are Skylark's friendly business-intelligence assistant. The user said: "${question}".

If this is a greeting, greet them briefly and suggest questions about pipeline, sectors, revenue, work-order delivery, billing, or leadership updates. If it is unrelated to business intelligence, politely state that you can analyse Skylark's live Deals and Work Orders data. Keep the response below 60 words.`,
  });

  return response.text?.trim() || null;
}

export async function createQueryPlan(question: string): Promise<QueryPlan | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    config: {
      responseMimeType: "application/json",
      responseSchema: queryPlanSchema,
    },
    contents: `Convert the user's business question into one safe JSON query plan.\n\n${dataDictionary}\n\nUser question: ${question}`,
  });
  try { return JSON.parse(response.text ?? "") as QueryPlan; } catch { return null; }
}

export async function businessReply(question: string, facts: BusinessFacts) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: `You are Skylark's founder-facing business-intelligence assistant. Answer the user's question using ONLY the verified facts below, which were just calculated from monday.com. Do not invent metrics, trends, dates, filters, comparisons, or causes. Do not say the data is for a quarter unless the facts say it is. Use Indian rupee formatting.\n\nReturn plain text only: do not use Markdown syntax, including # headings, ** bold markers, *, backticks, tables, or bullet characters. Use short section titles followed by normal sentences.\n\nUser question: ${question}\n\nVerified facts:\n${JSON.stringify(facts)}\n\nWrite a concise answer with: (1) direct answer, (2) 2-3 useful executive insights, and (3) a data-quality caveat. Mention the source is live monday.com data.`,
  });
  return response.text?.trim() || null;
}

export async function queryReply(question: string, result: unknown) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: `Answer the user's business question using ONLY this verified, live monday.com query result. Do not invent data or say a requested column is absent. Use plain text, no Markdown. State the direct result, a brief insight, and the supplied caveat. All money is Indian rupees. Format every amount with Rs or INR only; never use dollars or the $ symbol.\n\nQuestion: ${question}\n\nVerified result: ${JSON.stringify(result)}`,
  });
  return response.text?.trim() || null;
}
