import { columnText, getBoardItems } from "@/lib/monday-mcp";
import type { QueryPlan } from "@/lib/gemini";

const DEALS = 5030844395;
const WORK_ORDERS = 5030844400;
const DEAL_OWNER = "text_mm6jm53r";
const DEAL_STATUS = "color_mm6jhdyv";
const DEAL_VALUE = "numeric_mm6j7tea";
const DEAL_TENTATIVE_CLOSE = "date_mm6j920e";
const DEAL_SECTOR = "dropdown_mm6jy9fn";
const DEAL_STAGE = "color_mm6j49a0";
const DEAL_PRODUCT = "text_mm6jf0w4";
const WORK_EXECUTION = "color_mm6js0w4";
const WORK_TO_BILL = "numeric_mm6j333y";
const WORK_RECEIVABLE = "numeric_mm6jeeq7";
const WORK_SOURCE = "long_text_mm6jkb9w";

const columns = {
  deals: { deal_name: "name", owner_code: DEAL_OWNER, client_code: "text_mm6j33th", deal_status: DEAL_STATUS, actual_close_date: "date_mm6j8qsn", closure_probability: "color_mm6jtc6v", deal_value: DEAL_VALUE, tentative_close_date: DEAL_TENTATIVE_CLOSE, deal_stage: DEAL_STAGE, product_deal: DEAL_PRODUCT, sector: DEAL_SECTOR, created_date: "date_mm6jkm28" },
  work_orders: { deal_name: "name", customer_code: "text_mm6jz90g", serial_number: "text_mm6jp0bq", nature_of_work: "dropdown_mm6jg2ar", execution_status: WORK_EXECUTION, data_delivery_date: "date_mm6jwa65", po_loi_date: "date_mm6jxrkj", document_type: "dropdown_mm6jfb6k", probable_start_date: "date_mm6jeh6w", probable_end_date: "date_mm6jn9vq", owner_code: "text_mm6j6bwr", sector: "dropdown_mm6je8yw", type_of_work: "text_mm6j2y3b", contract_value_excl_gst: "numeric_mm6j6vhr", billed_value_excl_gst: "numeric_mm6jvh4f", collected_amount_incl_gst: "numeric_mm6jcj0g", amount_to_bill_excl_gst: WORK_TO_BILL, amount_receivable: WORK_RECEIVABLE, invoice_status: "color_mm6jv63v", billing_status: "color_mm6jtfsr", collection_status: "color_mm6jhe89" },
} as const;

const sourceColumns = {
  work_orders: {
    last_executed_month: ["Last executed month of recurring project", "column_4"],
    skylark_platform_in_deliverables: ["Is any Skylark software platform part of the client deliverables in this deal?", "column_14"],
    last_invoice_date: ["Last invoice date", "column_15"],
    latest_invoice_no: ["latest invoice no.", "column_16"],
    amount_incl_gst: ["Amount in Rupees (Incl of GST) (Masked)", "column_18"],
    billed_value_incl_gst: ["Billed Value in Rupees (Incl of GST.) (Masked)", "column_20"],
    amount_to_bill_incl_gst: ["Amount to be billed in Rs. (Incl. of GST) (Masked)", "column_23"],
    ar_priority_account: ["AR Priority account", "column_25"],
    quantity_by_ops: ["Quantity by Ops", "column_26"],
    quantities_as_per_po: ["Quantities as per PO", "column_27"],
    quantity_billed: ["Quantity billed (till date)", "column_28"],
    balance_quantity: ["Balance in quantity", "column_29"],
    expected_billing_month: ["Expected Billing Month", "column_31"],
    actual_billing_month: ["Actual Billing Month", "column_32"],
    actual_collection_month: ["Actual Collection Month", "column_33"],
    wo_status_billed: ["WO Status (billed)", "column_34"],
    collection_date: ["Collection Date", "column_36"],
  },
} as const;

const columnHints: Record<keyof typeof columns, Record<string, { type: "number" | "category" | "date" | "text"; phrases: string[] }>> = {
  deals: {
    deal_name: { type: "text", phrases: ["deal name", "project name"] },
    owner_code: { type: "category", phrases: ["owner", "deal owner", "sales owner", "handled by", "handling"] },
    client_code: { type: "category", phrases: ["client", "customer"] },
    deal_status: { type: "category", phrases: ["deal status", "status", "open", "won", "lost"] },
    actual_close_date: { type: "date", phrases: ["actual close date", "closed date"] },
    closure_probability: { type: "category", phrases: ["closure probability", "probability"] },
    deal_value: { type: "number", phrases: ["deal value", "pipeline value", "sales value", "revenue", "value"] },
    tentative_close_date: { type: "date", phrases: ["tentative close date", "expected close", "close date"] },
    deal_stage: { type: "category", phrases: ["deal stage", "stage", "pipeline stage"] },
    product_deal: { type: "category", phrases: ["product", "product type", "product deal"] },
    sector: { type: "category", phrases: ["sector", "industry"] },
    created_date: { type: "date", phrases: ["created", "created date"] },
  },
  work_orders: {
    deal_name: { type: "text", phrases: ["work order name", "project name", "deal name"] },
    customer_code: { type: "category", phrases: ["customer", "client"] },
    serial_number: { type: "text", phrases: ["serial", "serial number"] },
    nature_of_work: { type: "category", phrases: ["nature", "nature of work"] },
    execution_status: { type: "category", phrases: ["execution status", "delivery status", "status", "completed"] },
    data_delivery_date: { type: "date", phrases: ["data delivery date", "delivery date"] },
    po_loi_date: { type: "date", phrases: ["po date", "loi date", "po", "loi"] },
    document_type: { type: "category", phrases: ["document", "document type"] },
    probable_start_date: { type: "date", phrases: ["start date", "probable start"] },
    probable_end_date: { type: "date", phrases: ["end date", "probable end"] },
    owner_code: { type: "category", phrases: ["owner", "work owner", "handled by", "handling"] },
    sector: { type: "category", phrases: ["sector", "industry"] },
    type_of_work: { type: "category", phrases: ["type of work", "work type", "product type", "product"] },
    contract_value_excl_gst: { type: "number", phrases: ["work order value", "contract value", "order value", "wo value", "value"] },
    billed_value_excl_gst: { type: "number", phrases: ["billed value", "billing value"] },
    collected_amount_incl_gst: { type: "number", phrases: ["collected amount", "collected value", "collection value"] },
    amount_to_bill_excl_gst: { type: "number", phrases: ["amount to bill", "to bill", "unbilled"] },
    amount_receivable: { type: "number", phrases: ["receivable", "receivables", "amount receivable"] },
    invoice_status: { type: "category", phrases: ["invoice status", "invoice"] },
    expected_billing_month: { type: "category", phrases: ["expected billing month"] },
    actual_billing_month: { type: "category", phrases: ["actual billing month"] },
    actual_collection_month: { type: "category", phrases: ["actual collection month"] },
    last_executed_month: { type: "category", phrases: ["last executed month", "recurring project month"] },
    ar_priority_account: { type: "category", phrases: ["ar priority", "priority account"] },
    wo_status_billed: { type: "category", phrases: ["wo status billed", "work order billed status"] },
    collection_date: { type: "date", phrases: ["collection date"] },
    billing_status: { type: "category", phrases: ["billing status"] },
    collection_status: { type: "category", phrases: ["collection status"] },
  },
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const amount = (value: string | null) => Number((value ?? "").replace(/[^0-9.-]/g, "")) || 0;
const labelled = (value: string | null) => (value ?? "Unspecified").trim() || "Unspecified";
type Entry = { label: string; count: number; value: number };

export type BusinessFacts = {
  reportType: "pipeline" | "leadership_update";
  source: "live monday.com Deals board" | "live monday.com Deals and Work Orders boards";
  scope: string;
  pipeline: { openDeals: number; recordedValue: number; leadingSector: string; leadingSectorValue: number; missingValueRecords: number; missingOwnerRecords: number; missingTentativeCloseDateRecords: number };
  topSectors: Entry[];
  topOwners: Entry[];
  topDealStages: Entry[];
  topProducts: Entry[];
  operations?: { workOrders: number; mostCommonExecutionStatus: string; mostCommonExecutionStatusCount: number; amountToBill: number; receivables: number };
};

function ranked(entries: Map<string, { count: number; value: number }>): Entry[] {
  return [...entries.entries()].map(([label, stats]) => ({ label, ...stats })).sort((a, b) => b.value - a.value || b.count - a.count);
}

function inCurrentQuarter(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && Math.floor(date.getMonth() / 3) === Math.floor(now.getMonth() / 3);
}

function requestedSector(question: string, sectors: string[]) {
  const normalized = question.toLowerCase();
  return sectors.find((sector) => normalized.includes(sector.toLowerCase()));
}

export async function getBusinessFacts(question: string): Promise<BusinessFacts> {
  const lower = question.toLowerCase();
  const needsWork = /work.?order|delivery|execution|billing|collection|receivable|operational|leadership|executive.?update/.test(lower);
  // Omit column IDs: the MCP reads every imported column, including the preserved Work Order source row.
  const [deals, workOrders] = await Promise.all([getBoardItems(DEALS), needsWork ? getBoardItems(WORK_ORDERS) : Promise.resolve([])]);
  const openDeals = deals.filter((item) => labelled(columnText(item, DEAL_STATUS)).toLowerCase() === "open");
  const sectorFilter = requestedSector(question, [...new Set(openDeals.map((item) => labelled(columnText(item, DEAL_SECTOR))).filter((sector) => sector !== "Unspecified"))]);
  const quarterRequested = /this quarter|current quarter|q[1-4]/.test(lower);
  const scopedDeals = openDeals.filter((item) => (!sectorFilter || labelled(columnText(item, DEAL_SECTOR)).toLowerCase() === sectorFilter.toLowerCase()) && (!quarterRequested || inCurrentQuarter(columnText(item, DEAL_TENTATIVE_CLOSE))));
  const sectors = new Map<string, { count: number; value: number }>();
  const owners = new Map<string, { count: number; value: number }>();
  const stages = new Map<string, { count: number; value: number }>();
  const products = new Map<string, { count: number; value: number }>();
  for (const item of scopedDeals) {
    const value = amount(columnText(item, DEAL_VALUE));
    for (const [map, label] of [[sectors, labelled(columnText(item, DEAL_SECTOR))], [owners, labelled(columnText(item, DEAL_OWNER))], [stages, labelled(columnText(item, DEAL_STAGE))], [products, labelled(columnText(item, DEAL_PRODUCT))]] as const) {
      const current = map.get(label) ?? { count: 0, value: 0 };
      map.set(label, { count: current.count + 1, value: current.value + value });
    }
  }
  const topSectors = ranked(sectors);
  const topOwners = ranked(owners);
  const topDealStages = ranked(stages);
  const topProducts = ranked(products);
  const leading = topSectors[0] ?? { label: "Unspecified", count: 0, value: 0 };
  const scopeParts = ["open deals", sectorFilter ? `sector: ${sectorFilter}` : "all sectors", quarterRequested ? "tentative close date in the current calendar quarter" : "all close-date periods"];
  const pipeline = {
    openDeals: scopedDeals.length,
    recordedValue: scopedDeals.reduce((total, item) => total + amount(columnText(item, DEAL_VALUE)), 0),
    leadingSector: leading.label,
    leadingSectorValue: leading.value,
    missingValueRecords: scopedDeals.filter((item) => !columnText(item, DEAL_VALUE)).length,
    missingOwnerRecords: scopedDeals.filter((item) => !columnText(item, DEAL_OWNER)).length,
    missingTentativeCloseDateRecords: scopedDeals.filter((item) => !columnText(item, DEAL_TENTATIVE_CLOSE)).length,
  };
  if (!needsWork) return { reportType: "pipeline", source: "live monday.com Deals board", scope: scopeParts.join("; "), pipeline, topSectors: topSectors.slice(0, 5), topOwners: topOwners.slice(0, 5), topDealStages: topDealStages.slice(0, 10), topProducts: topProducts.slice(0, 10) };

  const execution = new Map<string, { count: number; value: number }>();
  for (const item of workOrders) { const status = labelled(columnText(item, WORK_EXECUTION)); const current = execution.get(status) ?? { count: 0, value: 0 }; execution.set(status, { ...current, count: current.count + 1 }); }
  const commonExecution = ranked(execution)[0] ?? { label: "Unspecified", count: 0, value: 0 };
  return { reportType: "leadership_update", source: "live monday.com Deals and Work Orders boards", scope: scopeParts.join("; "), pipeline, topSectors: topSectors.slice(0, 5), topOwners: topOwners.slice(0, 5), topDealStages: topDealStages.slice(0, 10), topProducts: topProducts.slice(0, 10), operations: { workOrders: workOrders.length, mostCommonExecutionStatus: commonExecution.label, mostCommonExecutionStatusCount: commonExecution.count, amountToBill: workOrders.reduce((total, item) => total + amount(columnText(item, WORK_TO_BILL)), 0), receivables: workOrders.reduce((total, item) => total + amount(columnText(item, WORK_RECEIVABLE)), 0) } };
}

export function fallbackBusinessAnswer(facts: BusinessFacts): string {
  const owner = facts.topOwners[0];
  return `Live monday.com analysis\n\nScope: ${facts.scope}. ${facts.pipeline.openDeals} deals have ${money.format(facts.pipeline.recordedValue)} in recorded value. The leading sector is ${facts.pipeline.leadingSector} at ${money.format(facts.pipeline.leadingSectorValue)}.${owner ? ` The leading owner is ${owner.label} with ${owner.count} deals.` : ""}\n\nData quality caveat: ${facts.pipeline.missingValueRecords} records lack a usable value, ${facts.pipeline.missingOwnerRecords} lack an owner, and ${facts.pipeline.missingTentativeCloseDateRecords} lack a tentative close date.`;
}

function valueFor(item: Record<string, unknown>, board: keyof typeof columns, column: string): string | null {
  const columnId = (columns[board] as Record<string, string>)[column];
  if (columnId === "name") return typeof item.name === "string" ? item.name : null;
  if (columnId) return columnText(item, columnId);
  if (board === "work_orders" && column in sourceColumns.work_orders) {
    const raw = columnText(item, WORK_SOURCE);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const source = typeof parsed.text === "string" ? JSON.parse(parsed.text) as Record<string, unknown> : parsed;
      for (const key of sourceColumns.work_orders[column as keyof typeof sourceColumns.work_orders]) {
        const value = source[key];
        if (value !== undefined && value !== null && value !== "") return String(value);
      }
    } catch {
      return null;
    }
  }
  return columnText(item, columnId);
}

function inferColumn(question: string, board: keyof typeof columns, desired: "number" | "group"): string | undefined {
  const lower = question.toLowerCase();
  const candidates = Object.entries(columnHints[board]).filter(([, hint]) => desired === "number" ? hint.type === "number" : hint.type !== "number");
  let best: { column: string; score: number } | undefined;
  for (const [column, hint] of candidates) {
    const score = hint.phrases.reduce((total, phrase) => lower.includes(phrase) ? total + phrase.length : total, 0);
    if (score > (best?.score ?? 0)) best = { column, score };
  }
  return best?.column;
}

function completePlanFromQuestion(plan: QueryPlan, question?: string): QueryPlan {
  if (!question) return plan;
  const lower = question.toLowerCase();
  const board: keyof typeof columns = /work.?order|delivery|billing|collection|receivable|invoice|contract|po|loi/.test(lower) ? "work_orders" : /deal|pipeline|sales|probability|close/.test(lower) ? "deals" : plan.board;
  const completed: QueryPlan = { ...plan, board, filters: plan.filters ? [...plan.filters] : [] };
  const asksForGrouping = /highest|top|largest|biggest|strongest|compare|breakdown|grouped by|\bby\b|most/.test(lower);
  const asksForCount = /how many|count|number of|most deals|most work orders|handling the most/.test(lower);
  const asksForAverage = /average|avg|mean/.test(lower);

  if (!completed.groupBy && asksForGrouping) completed.groupBy = inferColumn(lower, board, "group");
  if (!completed.groupBys?.length && /versus| vs |compare|with/.test(lower)) {
    const groupBys = Object.entries(columnHints[board])
      .filter(([, hint]) => hint.type !== "number" && hint.phrases.some((phrase) => lower.includes(phrase)))
      .map(([column]) => column);
    if (groupBys.length > 1) completed.groupBys = groupBys;
  }
  if (!completed.measures?.length && /versus| vs |compare/.test(lower)) {
    const measures = Object.entries(columnHints[board])
      .filter(([, hint]) => hint.type === "number" && hint.phrases.some((phrase) => lower.includes(phrase)))
      .map(([column]) => column);
    if (measures.length > 1) completed.measures = measures;
  }
  if (completed.measures?.length && !completed.measure) completed.measure = completed.measures[0];
  if (completed.aggregation !== "count" && !completed.measure) completed.measure = inferColumn(lower, board, "number");
  if (!completed.measure && asksForCount) completed.aggregation = "count";
  if (completed.measure) completed.aggregation = asksForAverage ? "average" : completed.aggregation === "count" && !asksForCount ? "sum" : completed.aggregation;
  if (completed.board === "deals" && /pipeline|open deal|active deal|current deal/.test(lower) && !/lost|won|completed|closed/.test(lower)) {
    const hasStatusFilter = completed.filters?.some((filter) => filter.column === "deal_status");
    if (!hasStatusFilter) completed.filters = [...(completed.filters ?? []), { column: "deal_status", operator: "equals", value: "Open" }];
  }
  return completed;
}

export async function executeQueryPlan(plan: QueryPlan, question?: string) {
  plan = completePlanFromQuestion(plan, question);
  const aliases: Record<string, string> = { deals: "deals", deal: "deals", work_orders: "work_orders", "work orders": "work_orders", workorders: "work_orders", product_type: "product_deal", product: "product_deal", stage: "deal_stage", owner: "owner_code", deal_owner: "owner_code", value: "deal_value", pipeline_value: "deal_value", revenue: "deal_value", work_order_value: "contract_value_excl_gst", order_value: "contract_value_excl_gst", contract_value: "contract_value_excl_gst" };
  const normalizedBoard = aliases[String(plan.board).toLowerCase()] as QueryPlan["board"] | undefined;
  const normalizeColumn = (column?: unknown) => {
    if (typeof column !== "string") return undefined;
    const key = column.toLowerCase().replace(/\s+/g, "_");
    return aliases[key] ?? key;
  };
  const rawAggregation = plan.aggregation as unknown;
  const aggregationObject = rawAggregation && typeof rawAggregation === "object" ? rawAggregation as { operation?: unknown; type?: unknown; column?: unknown } : undefined;
  const measures = Array.isArray(plan.measures) ? plan.measures.map((measure) => normalizeColumn(measure)).filter((measure): measure is string => Boolean(measure)) : [];
  const groupBys = Array.isArray(plan.groupBys) ? plan.groupBys.map((groupBy) => normalizeColumn(groupBy)).filter((groupBy): groupBy is string => Boolean(groupBy)) : [];
  const measure = normalizeColumn(plan.measure ?? aggregationObject?.column) ?? measures[0];
  plan = { ...plan, board: normalizedBoard ?? plan.board, aggregation: (typeof rawAggregation === "string" ? rawAggregation.toLowerCase() : typeof aggregationObject?.operation === "string" ? aggregationObject.operation.toLowerCase() : typeof aggregationObject?.type === "string" ? aggregationObject.type.toLowerCase() : "count") as QueryPlan["aggregation"], measure, measures: measures.length ? measures : measure ? [measure] : undefined, groupBy: normalizeColumn(plan.groupBy), groupBys: groupBys.length ? groupBys : undefined, filters: Array.isArray(plan.filters) ? plan.filters.filter((filter) => filter && typeof filter === "object").map((filter) => ({ ...filter, column: normalizeColumn(filter.column) ?? filter.column })) : [], sort: plan.sort ?? (plan.groupBy ? plan.aggregation === "count" ? "count_desc" : "value_desc" : undefined), limit: typeof plan.limit === "number" && plan.limit > 0 ? Math.min(Math.floor(plan.limit), 25) : undefined };
  const map = columns[plan.board];
  const supportedColumns = new Set([...Object.keys(map ?? {}), ...(plan.board === "work_orders" ? Object.keys(sourceColumns.work_orders) : [])]);
  if (!map || !["count", "sum", "average"].includes(plan.aggregation) || (plan.aggregation !== "count" && !plan.measure) || (plan.measure && !supportedColumns.has(plan.measure)) || (plan.measures?.some((field) => !supportedColumns.has(field))) || (plan.groupBy && !supportedColumns.has(plan.groupBy)) || (plan.groupBys?.some((field) => !supportedColumns.has(field)))) throw new Error("The requested query uses an unsupported board, column, or operation.");
  const records = await getBoardItems(plan.board === "deals" ? DEALS : WORK_ORDERS);
  const filtered = records.filter((item) => (plan.filters ?? []).every((filter) => {
    if (!supportedColumns.has(filter.column)) return false;
    const actual = (valueFor(item, plan.board, filter.column) ?? "").toLowerCase();
    const expected = filter.value.toLowerCase();
    return filter.operator === "equals" ? actual === expected : actual.includes(expected);
  }));
  const groups = new Map<string, { count: number; total: number; missingMeasure: number }>();
  for (const item of filtered) {
    const label = plan.groupBy ? labelled(valueFor(item, plan.board, plan.groupBy)) : "All matching records";
    const bucket = groups.get(label) ?? { count: 0, total: 0, missingMeasure: 0 };
    const raw = plan.measure ? valueFor(item, plan.board, plan.measure) : null;
    bucket.count += 1;
    if (plan.aggregation !== "count") { if (!raw) bucket.missingMeasure += 1; else bucket.total += amount(raw); }
    groups.set(label, bucket);
  }
  let results = [...groups.entries()].map(([group, stats]) => ({ group, recordCount: stats.count, value: plan.aggregation === "count" ? stats.count : plan.aggregation === "average" ? (stats.count - stats.missingMeasure ? stats.total / (stats.count - stats.missingMeasure) : 0) : stats.total, missingMeasureRecords: stats.missingMeasure }));
  results = results.sort((a, b) => {
    if (plan.sort === "value_asc") return a.value - b.value;
    if (plan.sort === "count_desc") return b.recordCount - a.recordCount || b.value - a.value;
    if (plan.sort === "count_asc") return a.recordCount - b.recordCount || b.value - a.value;
    return b.value - a.value;
  });
  if (plan.limit) results = results.slice(0, plan.limit);
  const measureTotals = plan.aggregation === "count" ? undefined : (plan.measures ?? []).map((field) => {
    let total = 0;
    let missing = 0;
    for (const item of filtered) {
      const raw = valueFor(item, plan.board, field);
      if (!raw) missing += 1;
      else total += amount(raw);
    }
    return { field, total, formattedTotal: money.format(total), missingMeasureRecords: missing };
  });
  const comparisonGroups = plan.groupBys?.map((field) => {
    const buckets = new Map<string, number>();
    let missing = 0;
    for (const item of filtered) {
      const raw = valueFor(item, plan.board, field);
      if (!raw) missing += 1;
      const label = labelled(raw);
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
    return { field, groups: [...buckets.entries()].map(([group, recordCount]) => ({ group, recordCount })).sort((a, b) => b.recordCount - a.recordCount), missingRecords: missing };
  });
  return { plan, source: `live monday.com ${plan.board === "deals" ? "Deals" : "Work Orders"} board`, matchingRecords: filtered.length, results, comparisonGroups, measureTotals, currency: "INR", caveat: `${measureTotals?.reduce((sum, row) => sum + row.missingMeasureRecords, 0) ?? comparisonGroups?.reduce((sum, row) => sum + row.missingRecords, 0) ?? results.reduce((sum, row) => sum + row.missingMeasureRecords, 0)} matching record(s) have a missing value for the requested field(s).` };
}
