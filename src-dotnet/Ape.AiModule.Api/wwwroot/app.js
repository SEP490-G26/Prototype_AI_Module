const appState = {
  providers: {},
  providerList: [],
  prompts: [],
  presets: {},
  lastResults: {},
  batchResults: [],
  matrixResults: [],
  summaryResults: [],
  sessionList: [],
  openedSession: null,
  historyDetail: null,
  historyList: [],
  historyMasterList: [],
  compareMeta: null
};

const functionSources = {
  gatekeeper: {
    promptKey: "gatekeeper",
    policyUrl: "/api/ai-module/gatekeeper/policy",
    rubricUrl: "/api/ai-module/gatekeeper/rubric",
    groundTruthUrl: "/api/ai-module/gatekeeper/ground-truth",
    sourceElementId: "gatekeeper-source"
  },
  extracted: {
    promptKey: "extract_content_vision",
    policyUrl: "/api/ai-module/extracted-content/policy",
    rubricUrl: "/api/ai-module/extracted-content/rubric",
    groundTruthUrl: "/api/ai-module/extracted-content/ground-truth",
    sourceElementId: "extracted-source"
  },
  embedding: {
    promptKey: "auto_tagging",
    policyUrl: "/api/ai-module/embedding-tagging/policy",
    rubricUrl: "/api/ai-module/embedding-tagging/rubric",
    groundTruthUrl: "/api/ai-module/embedding-tagging/ground-truth",
    sourceElementId: "embedding-source"
  },
  generation: {
    generationPromptKey: "question_generation",
    reviewPromptKey: "question_review",
    rubricUrl: (subject, questionType) => `/api/ai-module/question-generation/rubric?subject=${encodeURIComponent(subject)}&questionType=${encodeURIComponent(questionType)}`,
    groundTruthUrl: (subject, questionType) => `/api/ai-module/question-generation/ground-truth?subject=${encodeURIComponent(subject)}&questionType=${encodeURIComponent(questionType)}`,
    sourceElementId: "generation-source"
  },
  mentor: {
    promptKey: "code_mentor",
    policyUrl: "/api/ai-module/code-mentor/policy",
    rubricUrl: "/api/ai-module/code-mentor/rubric",
    groundTruthUrl: "/api/ai-module/code-mentor/ground-truth",
    sourceElementId: "mentor-source"
  }
};

const compareConfigs = {
  gatekeeper: {
    endpoint: "/api/ai-module/gatekeeper",
    buildPayload: () => buildGatekeeperPayload(document.getElementById("gatekeeper-form")),
    targets: [
      { value: "primary", label: "Primary gatekeeper model" }
    ],
    helpText: "Uses the current Gatekeeper form payload and swaps only the gatekeeper model.",
    applyTarget: (payload, model) => ({ ...payload, model })
  },
  extracted: {
    endpoint: "/api/ai-module/extracted-content",
    buildPayload: () => buildExtractedPayload(document.getElementById("extracted-form")),
    targets: [
      { value: "vision", label: "Vision model" }
    ],
    helpText: "Uses the current Extracted Content payload and swaps only the vision model.",
    applyTarget: (payload, model) => ({ ...payload, visionModel: model })
  },
  embedding: {
    endpoint: "/api/ai-module/embedding-tagging",
    buildPayload: () => buildEmbeddingPayload(document.getElementById("embedding-form")),
    targets: [
      { value: "embedding", label: "Embedding model" },
      { value: "tagging", label: "Auto-tagging model" },
      { value: "both", label: "Both embedding + tagging" }
    ],
    helpText: "Choose whether to compare the embedding model, the tagging model, or force the same selected model into both fields.",
    applyTarget: (payload, model, target) => {
      if (target === "embedding") {
        return { ...payload, embeddingModel: model };
      }

      if (target === "both") {
        return { ...payload, embeddingModel: model, taggingModel: model };
      }

      return { ...payload, taggingModel: model };
    }
  },
  generation: {
    endpoint: "/api/ai-module/generation-review",
    buildPayload: () => buildGenerationPayload(document.getElementById("generation-form")),
    targets: [
      { value: "generator", label: "A1 generator model" },
      { value: "reviewer", label: "A2 reviewer model" },
      { value: "both", label: "Both generator + reviewer" }
    ],
    helpText: "Compare A1 only, A2 only, or force the same selected model into both A1 and A2.",
    applyTarget: (payload, model, target) => {
      if (target === "generator") {
        return { ...payload, generatorModel: model };
      }

      if (target === "reviewer") {
        return { ...payload, reviewerModel: model };
      }

      return { ...payload, generatorModel: model, reviewerModel: model };
    }
  },
  mentor: {
    endpoint: "/api/ai-module/code-mentor",
    buildPayload: () => buildMentorPayload(document.getElementById("mentor-form")),
    targets: [
      { value: "primary", label: "Mentor model" }
    ],
    helpText: "Uses the current Code Mentor payload and swaps only the mentor model.",
    applyTarget: (payload, model) => ({ ...payload, mentorModel: model })
  },
  ingestion: {
    endpoint: "/api/ai-module/ingestion",
    buildPayload: () => buildIngestionPayload(document.getElementById("ingestion-form")),
    targets: [
      { value: "gatekeeper", label: "Gatekeeper model" },
      { value: "vision", label: "Vision model" },
      { value: "embedding", label: "Embedding model" },
      { value: "tagging", label: "Auto-tagging model" }
    ],
    helpText: "Uses the current Ingestion payload and swaps only the selected stage model.",
    applyTarget: (payload, model, target) => {
      if (target === "vision") {
        return { ...payload, visionModel: model };
      }

      if (target === "embedding") {
        return { ...payload, embeddingModel: model };
      }

      if (target === "tagging") {
        return { ...payload, taggingModel: model };
      }

      return { ...payload, gatekeeperModel: model };
    }
  }
};

const matrixConfigs = {
  gatekeeper: {
    endpoint: "/api/ai-module/gatekeeper",
    buildPayload: () => buildGatekeeperPayload(document.getElementById("gatekeeper-form")),
    targets: [{ value: "primary", label: "Primary gatekeeper model" }],
    applyTarget: (payload, model) => ({ ...payload, model }),
    capabilityHint: ""
  },
  extracted: {
    endpoint: "/api/ai-module/extracted-content",
    buildPayload: () => buildExtractedPayload(document.getElementById("extracted-form")),
    targets: [{ value: "vision", label: "Vision model" }],
    applyTarget: (payload, model) => ({ ...payload, visionModel: model }),
    capabilityHint: "vision"
  },
  embedding: {
    endpoint: "/api/ai-module/embedding-tagging",
    buildPayload: () => buildEmbeddingPayload(document.getElementById("embedding-form")),
    targets: [
      { value: "embedding", label: "Embedding model" },
      { value: "tagging", label: "Auto-tagging model" }
    ],
    applyTarget: (payload, model, target) => target === "embedding" ? { ...payload, embeddingModel: model } : { ...payload, taggingModel: model },
    capabilityHint: ""
  },
  generation: {
    endpoint: "/api/ai-module/generation-review",
    buildPayload: () => buildGenerationPayload(document.getElementById("generation-form")),
    targets: [
      { value: "generator", label: "A1 generator model" },
      { value: "reviewer", label: "A2 reviewer model" }
    ],
    applyTarget: (payload, model, target) => target === "reviewer" ? { ...payload, reviewerModel: model } : { ...payload, generatorModel: model },
    capabilityHint: ""
  },
  mentor: {
    endpoint: "/api/ai-module/code-mentor",
    buildPayload: () => buildMentorPayload(document.getElementById("mentor-form")),
    targets: [{ value: "primary", label: "Mentor model" }],
    applyTarget: (payload, model) => ({ ...payload, mentorModel: model }),
    capabilityHint: ""
  },
  ingestion: {
    endpoint: "/api/ai-module/ingestion",
    buildPayload: () => buildIngestionPayload(document.getElementById("ingestion-form")),
    targets: [
      { value: "gatekeeper", label: "Gatekeeper model" },
      { value: "vision", label: "Vision model" },
      { value: "embedding", label: "Embedding model" },
      { value: "tagging", label: "Auto-tagging model" }
    ],
    applyTarget: (payload, model, target) => {
      if (target === "vision") return { ...payload, visionModel: model };
      if (target === "embedding") return { ...payload, embeddingModel: model };
      if (target === "tagging") return { ...payload, taggingModel: model };
      return { ...payload, gatekeeperModel: model };
    },
    capabilityHint: ""
  }
};

function $(selector) {
  return document.querySelector(selector);
}

function setJson(targetId, data) {
  const element = document.getElementById(targetId);
  if (element) {
    element.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }
}

function setHtml(targetId, html) {
  const element = document.getElementById(targetId);
  if (element) {
    element.innerHTML = html;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function stringifyJson(value) {
  return JSON.stringify(value, null, 2);
}

function parseCsvList(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value) {
  return String(value).toLowerCase() === "true";
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? safeJsonParse(text, text) : null;

  if (!response.ok) {
    const error = typeof data === "string"
      ? { status: response.status, message: data }
      : { status: response.status, ...data };
    throw error;
  }

  return data;
}

async function postJson(url, payload) {
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function putJson(url, payload) {
  return fetchJson(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function postForm(url, formData) {
  const response = await fetch(url, {
    method: "POST",
    body: formData
  });
  const text = await response.text();
  const data = text ? safeJsonParse(text, text) : null;

  if (!response.ok) {
    throw (typeof data === "string" ? { status: response.status, message: data } : { status: response.status, ...data });
  }

  return data;
}

function collectNumbers(node, predicate, bucket = []) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectNumbers(item, predicate, bucket);
    }
    return bucket;
  }

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "number" && predicate(key, value)) {
        bucket.push({ key, value });
      } else {
        collectNumbers(value, predicate, bucket);
      }
    }
  }

  return bucket;
}

function summarizeMetrics(data) {
  const costNumbers = collectNumbers(data, (key) => key.toLowerCase().includes("cost") || key.toLowerCase().includes("usd"));
  const tokenNumbers = collectNumbers(data, (key) => key.toLowerCase().includes("token"));
  const latencyNumbers = collectNumbers(data, (key) => key.toLowerCase().includes("latency") || key.toLowerCase().includes("duration") || key.toLowerCase().includes("ms"));

  const cost = costNumbers.reduce((sum, item) => sum + item.value, 0);
  const tokens = tokenNumbers.reduce((sum, item) => sum + item.value, 0);
  const latency = latencyNumbers.length > 0 ? Math.max(...latencyNumbers.map((item) => item.value)) : null;

  return { cost, tokens, latency };
}

function formatCurrency(value) {
  return typeof value === "number" ? value.toFixed(6) : "";
}

function getTotals(data) {
  return data?.totals ?? data?.Totals ?? null;
}

function getUsageSource(data) {
  const totals = getTotals(data);
  return totals?.usageCapture?.usageSource ?? totals?.UsageCapture?.UsageSource ?? "";
}

function getNormalizedError(data) {
  const totals = getTotals(data);
  return totals?.error ?? totals?.Error ?? null;
}

function inferTone(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return "neutral";
  }

  if (["accepted", "pass", "passed", "supported", "ok", "valid", "complete", "completed"].includes(normalized)) {
    return "success";
  }

  if (["needs_revision", "warning", "ambiguous", "partial", "review"].includes(normalized)) {
    return "warning";
  }

  if (["rejected", "unsupported", "blocked", "invalid", "error", "failed", "fail"].includes(normalized)) {
    return "danger";
  }

  return "neutral";
}

function renderBadge(value, tone = null) {
  const resolvedTone = tone ?? inferTone(value);
  return `<span class="status-badge status-badge--${escapeHtml(resolvedTone)}">${escapeHtml(value)}</span>`;
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function exportJsonFile(prefix, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${prefix}-${new Date().toISOString().replaceAll(":", "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildSummaryText(prefix, data) {
  const metrics = summarizeMetrics(data);
  const lines = [
    `function=${prefix}`,
    `tokens=${metrics.tokens}`,
    `cost_usd=${formatCurrency(metrics.cost)}`,
    `latency_ms=${metrics.latency !== null ? Number(metrics.latency).toFixed(2) : ""}`
  ];

  if (prefix === "generation") {
    lines.push(`questions=${Array.isArray(data.questions) ? data.questions.length : 0}`);
    lines.push(`review_status=${data.review?.reviewStatus ?? data.reviewStatus ?? ""}`);
    lines.push(`attempts_used=${data.attemptsUsed ?? ""}`);
  }

  if (prefix === "mentor") {
    lines.push(`verdict=${data.feedback?.verdict ?? data.verdict ?? ""}`);
  }

  return lines.join("\n");
}

function buildMetricsText(prefix, data) {
  const usageLogs = Array.isArray(data?.usageLogs) ? data.usageLogs : [];
  const stageLogs = Array.isArray(data?.stageLogs) ? data.stageLogs : [];
  const lines = [`function=${prefix}`];

  for (const log of usageLogs) {
    lines.push([
      log.stageName ?? "",
      log.modelName ?? "",
      log.inputTokens ?? "",
      log.outputTokens ?? "",
      formatCurrency(log.inputCostUsd ?? 0),
      formatCurrency(log.outputCostUsd ?? 0),
      formatCurrency(log.costUsd ?? 0)
    ].join("\t"));
  }

  if (usageLogs.length === 0) {
    for (const log of stageLogs) {
      lines.push([
        log.stageName ?? "",
        log.status ?? "",
        log.cost?.inputTokens ?? "",
        log.cost?.outputTokens ?? "",
        formatCurrency(log.cost?.inputCostUsd ?? 0),
        formatCurrency(log.cost?.outputCostUsd ?? 0),
        formatCurrency(log.cost?.totalCostUsd ?? 0)
      ].join("\t"));
    }
  }

  return lines.join("\n");
}

function toTsvCell(value) {
  return String(value ?? "").replaceAll("\t", " ").replaceAll("\r", " ").replaceAll("\n", " ");
}

function inferStatusFromResult(prefix, data) {
  if (prefix === "gatekeeper") {
    return data.verdict?.verdict ?? data.verdict ?? "";
  }

  if (prefix === "generation") {
    return data.review?.reviewStatus ?? data.reviewStatus ?? "";
  }

  if (prefix === "mentor") {
    return data.feedback?.verdict ?? data.verdict ?? "";
  }

  if (prefix === "ingestion") {
    return data.document?.gatekeeper?.verdict ?? "";
  }

  if (prefix === "pipeline") {
    return data.generationReview?.review?.reviewStatus ?? "";
  }

  return data.status ?? "";
}

function inferModelSummaryFromResult(prefix, data) {
  const usageLogs = Array.isArray(data?.usageLogs) ? data.usageLogs : [];
  if (usageLogs.length > 0) {
    return usageLogs.map((item) => `${item.stageName}:${item.modelName}`).join(" | ");
  }

  if (prefix === "gatekeeper") {
    return data.verdict?.modelName ?? "";
  }

  if (prefix === "mentor") {
    return data.feedback?.modelName ?? "";
  }

  return "";
}

function buildTsvHeader() {
  return [
    "function",
    "status",
    "model_summary",
    "usage_source",
    "error_code",
    "error_category",
    "input_tokens",
    "output_tokens",
    "total_tokens",
    "input_cost_usd",
    "output_cost_usd",
    "total_cost_usd",
    "latency_ms",
    "question_count",
    "chunk_count",
    "attempts_used"
  ].join("\t");
}

function buildTsvRow(prefix, data) {
  const usageLogs = Array.isArray(data?.usageLogs) ? data.usageLogs : [];
  const inputTokens = usageLogs.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0);
  const outputTokens = usageLogs.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0);
  const inputCost = usageLogs.reduce((sum, item) => sum + (item.inputCostUsd ?? 0), 0);
  const outputCost = usageLogs.reduce((sum, item) => sum + (item.outputCostUsd ?? 0), 0);
  const metrics = summarizeMetrics(data);
  const questionCount = Array.isArray(data?.questions) ? data.questions.length : Array.isArray(data?.generationReview?.questions) ? data.generationReview.questions.length : 0;
  const chunkCount = Array.isArray(data?.chunks) ? data.chunks.length : Array.isArray(data?.document?.chunks) ? data.document.chunks.length : Array.isArray(data?.ingestion?.document?.chunks) ? data.ingestion.document.chunks.length : 0;

  return [
    prefix,
    inferStatusFromResult(prefix, data),
    inferModelSummaryFromResult(prefix, data),
    getUsageSource(data),
    getNormalizedError(data)?.code ?? "",
    getNormalizedError(data)?.category ?? "",
    inputTokens,
    outputTokens,
    inputTokens + outputTokens,
    formatCurrency(inputCost),
    formatCurrency(outputCost),
    formatCurrency(metrics.cost),
    metrics.latency !== null ? Number(metrics.latency).toFixed(2) : "",
    questionCount,
    chunkCount,
    data?.attemptsUsed ?? data?.generationReview?.attemptsUsed ?? ""
  ].map(toTsvCell).join("\t");
}

function buildHistoryTsvRow(detail) {
  const summary = detail?.summary ?? {};
  const totals = summary.totals ?? {};
  const inputTokens = totals.inputTokens ?? 0;
  const outputTokens = totals.outputTokens ?? 0;
  return [
    summary.functionName ?? summary.FunctionName ?? "",
    summary.status ?? summary.Status ?? "",
    summary.modelSummary ?? summary.ModelSummary ?? "",
    summary.usageSource ?? summary.UsageSource ?? "",
    summary.error?.code ?? summary.Error?.Code ?? "",
    summary.error?.category ?? summary.Error?.Category ?? "",
    inputTokens,
    outputTokens,
    inputTokens + outputTokens,
    formatCurrency(totals.inputCostUsd ?? 0),
    formatCurrency(totals.outputCostUsd ?? 0),
    formatCurrency(totals.totalCostUsd ?? 0),
    totals.latencyMs ?? "",
    "",
    "",
    ""
  ].map(toTsvCell).join("\t");
}

function buildCompareTsv(aMeta, bMeta) {
  const header = [
    "function",
    "slot",
    "model",
    "status",
    "input_tokens",
    "output_tokens",
    "total_tokens",
    "total_cost_usd",
    "latency_ms"
  ].join("\t");

  const rows = [aMeta, bMeta].map((item) => [
    item.functionName,
    item.slot,
    item.model,
    item.status,
    item.inputTokens,
    item.outputTokens,
    item.totalTokens,
    formatCurrency(item.totalCostUsd),
    item.latencyMs
  ].map(toTsvCell).join("\t"));

  return `${header}\n${rows.join("\n")}`;
}

function buildBatchTsv(results) {
  const header = [
    "function",
    "preset_id",
    "preset_label",
    "status",
    "error_code",
    "error_category",
    "attempts_used",
    "retries_used",
    "input_tokens",
    "output_tokens",
    "total_tokens",
    "total_cost_usd",
    "latency_ms",
    "model_summary"
  ].join("\t");

  const rows = (Array.isArray(results) ? results : []).map((item) => [
    item.functionName ?? "",
    item.presetId ?? "",
    item.presetLabel ?? "",
    item.status ?? "",
    item.normalizedError?.code ?? "",
    item.normalizedError?.category ?? "",
    item.attemptsUsed ?? 1,
    item.retriesUsed ?? 0,
    item.inputTokens ?? "",
    item.outputTokens ?? "",
    item.totalTokens ?? "",
    formatCurrency(item.totalCostUsd ?? 0),
    item.latencyMs ?? "",
    item.modelSummary ?? ""
  ].map(toTsvCell).join("\t"));

  return `${header}\n${rows.join("\n")}`;
}

function buildMatrixTsv(results) {
  const header = [
    "function",
    "target",
    "model",
    "status",
    "error_code",
    "error_category",
    "attempts_used",
    "retries_used",
    "input_tokens",
    "output_tokens",
    "total_tokens",
    "total_cost_usd",
    "latency_ms",
    "model_summary"
  ].join("\t");

  const rows = (Array.isArray(results) ? results : []).map((item) => [
    item.functionName ?? "",
    item.target ?? "",
    item.model ?? "",
    item.status ?? "",
    item.normalizedError?.code ?? "",
    item.normalizedError?.category ?? "",
    item.attemptsUsed ?? 1,
    item.retriesUsed ?? 0,
    item.inputTokens ?? "",
    item.outputTokens ?? "",
    item.totalTokens ?? "",
    formatCurrency(item.totalCostUsd ?? 0),
    item.latencyMs ?? "",
    item.modelSummary ?? ""
  ].map(toTsvCell).join("\t"));

  return `${header}\n${rows.join("\n")}`;
}

function buildSummaryTsv(results) {
  const header = [
    "function",
    "model_summary",
    "runs",
    "input_tokens",
    "output_tokens",
    "total_tokens",
    "total_cost_usd",
    "avg_cost_usd",
    "avg_latency_ms"
  ].join("\t");

  const rows = (Array.isArray(results) ? results : []).map((item) => [
    item.functionName ?? "",
    item.modelSummary ?? "",
    item.runs ?? 0,
    item.inputTokens ?? 0,
    item.outputTokens ?? 0,
    item.totalTokens ?? 0,
    formatCurrency(item.totalCostUsd ?? 0),
    formatCurrency(item.avgCostUsd ?? 0),
    item.avgLatencyMs ?? ""
  ].map(toTsvCell).join("\t"));

  return `${header}\n${rows.join("\n")}`;
}

function buildSessionDetailTsv(session) {
  const batchResults = session?.batchResults ?? session?.BatchResults ?? [];
  const matrixResults = session?.matrixResults ?? session?.MatrixResults ?? [];
  const lines = [];

  if (Array.isArray(batchResults) && batchResults.length > 0) {
    lines.push("# batch");
    lines.push(buildBatchTsv(batchResults));
  }

  if (Array.isArray(matrixResults) && matrixResults.length > 0) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push("# matrix");
    lines.push(buildMatrixTsv(matrixResults));
  }

  return lines.join("\n");
}

function getRunnerRetryConfig() {
  return {
    retryCount: Math.max(0, Number($("#runner-retry-count")?.value || 0)),
    baseDelayMs: Math.max(0, Number($("#runner-retry-delay-ms")?.value || 0))
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stringifyError(error) {
  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
}

function tryReadRetryAfterMs(error) {
  const text = stringifyError(error);
  const secondsMatch = text.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i);
  if (secondsMatch) {
    return Math.ceil(Number(secondsMatch[1]) * 1000);
  }

  const msMatch = text.match(/retry after\s+([0-9]+)\s*ms/i);
  if (msMatch) {
    return Number(msMatch[1]);
  }

  return null;
}

function isRetryableError(error) {
  const status = Number(error?.status);
  if ([408, 409, 425, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const text = stringifyError(error).toLowerCase();
  return text.includes("quota exceeded")
    || text.includes("rate limit")
    || text.includes("retry in")
    || text.includes("temporar")
    || text.includes("service unavailable")
    || text.includes("high demand")
    || text.includes("timeout")
    || text.includes("network");
}

async function runWithRetry(work, options = {}) {
  const retryCount = Math.max(0, Number(options.retryCount ?? 0));
  const baseDelayMs = Math.max(0, Number(options.baseDelayMs ?? 0));
  let attemptsUsed = 0;
  let lastError = null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    attemptsUsed = attempt + 1;
    try {
      const result = await work(attemptsUsed);
      return { ok: true, result, attemptsUsed, retriesUsed: attempt };
    } catch (error) {
      lastError = error;
      if (attempt >= retryCount || !isRetryableError(error)) {
        break;
      }

      const retryAfterMs = tryReadRetryAfterMs(error);
      const delayMs = retryAfterMs ?? (baseDelayMs * Math.pow(2, attempt));
      await sleep(delayMs);
    }
  }

  return { ok: false, error: lastError, attemptsUsed, retriesUsed: Math.max(0, attemptsUsed - 1) };
}

function normalizeRunnerError(error, stage = "runner") {
  const status = Number(error?.status);
  const rawMessage = stringifyError(error);
  const lowered = rawMessage.toLowerCase();

  let category = "unknown";
  let code = "unknown";

  if (lowered.includes("quota exceeded")) {
    category = "quota_exceeded";
    code = "quota_exceeded";
  } else if (lowered.includes("rate limit") || status === 429) {
    category = "rate_limited";
    code = "rate_limited";
  } else if (lowered.includes("service unavailable") || lowered.includes("high demand") || status === 503) {
    category = "provider_unavailable";
    code = "provider_unavailable";
  } else if (lowered.includes("timeout") || status === 408 || status === 504) {
    category = "timeout";
    code = "timeout";
  } else if (lowered.includes("not found") || lowered.includes("model is not found") || status === 404) {
    category = "invalid_model";
    code = "invalid_model";
  } else if (lowered.includes("bad request") || status === 400) {
    category = "invalid_request";
    code = "invalid_request";
  } else if (lowered.includes("network")) {
    category = "network";
    code = "network";
  } else if (status >= 500) {
    category = "provider_error";
    code = "provider_error";
  }

  return {
    category,
    code,
    providerStatus: Number.isFinite(status) ? status : null,
    retryable: isRetryableError(error),
    stage,
    rawMessage
  };
}

function setSelectOptions(selectId, items, labelBuilder, valueBuilder) {
  const select = document.getElementById(selectId);
  if (!select) {
    return;
  }

  const list = Array.isArray(items) ? items : [];
  select.innerHTML = list.map((item, index) => {
    const value = valueBuilder ? valueBuilder(item, index) : String(index);
    const label = labelBuilder ? labelBuilder(item, index) : value;
    return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
  }).join("");
}

function renderSummaryCards(targetId, cards) {
  const html = cards
    .filter((card) => card && card.value !== undefined && card.value !== null && card.value !== "")
    .map((card) => `
      <article class="summary-card">
        <span class="summary-label">${escapeHtml(card.label)}</span>
        <strong class="summary-value">${card.badge ? renderBadge(card.value, card.tone) : escapeHtml(card.value)}</strong>
      </article>
    `)
    .join("");

  setHtml(targetId, html || '<article class="summary-card"><span class="summary-label">No summary</span><strong class="summary-value">Run a request</strong></article>');
}

function renderKeyValueTable(targetId, title, source) {
  if (!source || typeof source !== "object") {
    setHtml(targetId, `<div class="placeholder">${escapeHtml(title)} is not available.</div>`);
    return;
  }

  const rows = Object.entries(source)
    .slice(0, 20)
    .map(([key, value]) => {
      const display = Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value);
      return `<div class="kv-row"><span>${escapeHtml(key)}</span><strong>${escapeHtml(display)}</strong></div>`;
    })
    .join("");

  setHtml(targetId, `<div class="kv-block"><h4>${escapeHtml(title)}</h4>${rows}</div>`);
}

function renderUsageLogSection(usageLogs) {
  if (!Array.isArray(usageLogs) || usageLogs.length === 0) {
    return "";
  }

  const rows = usageLogs.map((log) => `
    <tr>
      <td>${escapeHtml(log.stageName ?? "")}</td>
      <td>${escapeHtml(log.modelName ?? "")}</td>
      <td>${escapeHtml(String(log.inputTokens ?? ""))}</td>
      <td>${escapeHtml(String(log.outputTokens ?? ""))}</td>
      <td>${escapeHtml(formatCurrency(log.inputCostUsd ?? 0))}</td>
      <td>${escapeHtml(formatCurrency(log.outputCostUsd ?? 0))}</td>
      <td>${escapeHtml(formatCurrency(log.costUsd ?? 0))}</td>
    </tr>
  `).join("");

  return `
    <div class="result-section">
      <h4>Usage logs</h4>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Model</th>
              <th>In Tok</th>
              <th>Out Tok</th>
              <th>In Cost</th>
              <th>Out Cost</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderStageLogSection(stageLogs) {
  if (!Array.isArray(stageLogs) || stageLogs.length === 0) {
    return "";
  }

  const rows = stageLogs.map((log) => `
    <tr>
      <td>${escapeHtml(log.stageName ?? "")}</td>
      <td>${escapeHtml(log.status ?? "")}</td>
      <td>${escapeHtml(String(log.cost?.inputTokens ?? ""))}</td>
      <td>${escapeHtml(String(log.cost?.outputTokens ?? ""))}</td>
      <td>${escapeHtml(formatCurrency(log.cost?.totalCostUsd ?? 0))}</td>
      <td>${escapeHtml(String(log.cost?.latencyMs ?? ""))}</td>
    </tr>
  `).join("");

  return `
    <div class="result-section">
      <h4>Stage logs</h4>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Status</th>
              <th>In Tok</th>
              <th>Out Tok</th>
              <th>Total Cost</th>
              <th>Latency</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function formatResultBlock(data) {
  if (!data || typeof data !== "object") {
    return `<div class="placeholder">No result.</div>`;
  }

  const sections = [];

  if (data.verdict || data.reviewStatus) {
    const decision = data.verdict ?? data.reviewStatus;
    sections.push(`<div class="result-section"><h4>Decision</h4><p>${renderBadge(decision)}</p></div>`);
  }

  if (data.reason) {
    sections.push(`<div class="result-section"><h4>Reason</h4><p>${escapeHtml(data.reason)}</p></div>`);
  }

  if (data.detectedTopics || data.topicTags) {
    const tags = data.detectedTopics ?? data.topicTags;
    sections.push(`<div class="result-section"><h4>Tags</h4><p>${escapeHtml(Array.isArray(tags) ? tags.join(", ") : JSON.stringify(tags))}</p></div>`);
  }

  if (data.normalizedMarkdown || data.rawText) {
    sections.push(`<div class="result-section"><h4>Content preview</h4><pre>${escapeHtml((data.normalizedMarkdown ?? data.rawText).slice(0, 1800))}</pre></div>`);
  }

  if (data.extracted?.normalizedMarkdown) {
    sections.push(`<div class="result-section"><h4>Extracted markdown</h4><pre>${escapeHtml(data.extracted.normalizedMarkdown.slice(0, 2200))}</pre></div>`);
  }

  if (Array.isArray(data.questions)) {
    const items = data.questions.map((question, index) => `
      <article class="list-card">
        <h4>${index + 1}. ${escapeHtml(question.title ?? "Untitled question")}</h4>
        <p><strong>${escapeHtml(question.type ?? "")}</strong> | ${escapeHtml(question.difficulty ?? "")}</p>
        <p>${escapeHtml(question.description ?? "")}</p>
        <p class="muted">Tags: ${escapeHtml((question.topic_tags ?? []).join(", "))}</p>
      </article>
    `).join("");
    sections.push(`<div class="result-section"><h4>A1 Generated Questions</h4><div class="card-stack">${items}</div></div>`);
  }

  if (data.review || data.reviewStatus) {
    const review = data.review ?? data;
    sections.push(`
      <div class="result-section">
        <h4>A2 Review</h4>
        <p><strong>Status:</strong> ${renderBadge(review.reviewStatus ?? "")}</p>
        <p><strong>Score:</strong> ${escapeHtml(String(review.score ?? ""))}</p>
        <p><strong>Schema valid:</strong> ${escapeHtml(String(review.schemaValid ?? ""))}</p>
        <p><strong>Content grounded:</strong> ${escapeHtml(String(review.contentGrounded ?? ""))}</p>
      </div>
    `);
  }

  if (Array.isArray(data.mappedFeQuestions) || Array.isArray(data.mappedPeQuestions)) {
    sections.push(`
      <div class="result-section">
        <h4>Final mapped output</h4>
        <p><strong>FE records:</strong> ${escapeHtml(String(data.mappedFeQuestions?.length ?? 0))}</p>
        <p><strong>PE records:</strong> ${escapeHtml(String(data.mappedPeQuestions?.length ?? 0))}</p>
      </div>
    `);
  }

  if (data.feedback) {
    sections.push(`
      <div class="result-section">
        <h4>Mentor feedback</h4>
        <p><strong>Verdict:</strong> ${renderBadge(data.feedback.verdict ?? "")}</p>
        <p><strong>Complexity:</strong> ${escapeHtml(data.feedback.complexity ?? "")}</p>
        <p><strong>Confidence:</strong> ${escapeHtml(String(data.feedback.confidence ?? ""))}</p>
      </div>
    `);
  }

  if (Array.isArray(data.chunks)) {
    const items = data.chunks.slice(0, 8).map((chunk) => `
      <article class="list-card">
        <h4>${escapeHtml(chunk.id ?? chunk.chunkId ?? `chunk-${chunk.chunkIndex ?? "?"}`)}</h4>
        <p class="muted">${escapeHtml(chunk.sectionTitle ?? chunk.chunkType ?? "chunk")}</p>
        <p>${escapeHtml((chunk.normalizedText ?? chunk.contentText ?? chunk.rawText ?? "").slice(0, 320))}</p>
        <p class="muted">Tags: ${escapeHtml((chunk.topicTags ?? chunk.topic_tags ?? []).join(", "))}</p>
      </article>
    `).join("");
    sections.push(`<div class="result-section"><h4>Chunks</h4><div class="card-stack">${items}</div></div>`);
  }

  if (data.document?.chunks && Array.isArray(data.document.chunks)) {
    const items = data.document.chunks.slice(0, 8).map((chunk) => `
      <article class="list-card">
        <h4>${escapeHtml(chunk.id ?? chunk.chunkId ?? `chunk-${chunk.chunkIndex ?? "?"}`)}</h4>
        <p class="muted">${escapeHtml(chunk.sectionTitle ?? chunk.chunkType ?? "chunk")}</p>
        <p>${escapeHtml((chunk.normalizedText ?? chunk.contentText ?? chunk.rawText ?? "").slice(0, 320))}</p>
        <p class="muted">Tags: ${escapeHtml((chunk.topicTags ?? chunk.topic_tags ?? []).join(", "))}</p>
      </article>
    `).join("");
    sections.push(`<div class="result-section"><h4>Stored chunks</h4><div class="card-stack">${items}</div></div>`);
  }

  if (Array.isArray(data.issues)) {
    sections.push(`<div class="result-section"><h4>Issues</h4><ul>${data.issues.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`);
  }

  if (Array.isArray(data.suggestions)) {
    sections.push(`<div class="result-section"><h4>Suggestions</h4><ul>${data.suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`);
  }

  if (Array.isArray(data.feedback?.issues)) {
    sections.push(`<div class="result-section"><h4>Mentor issues</h4><ul>${data.feedback.issues.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`);
  }

  if (Array.isArray(data.feedback?.suggestions)) {
    sections.push(`<div class="result-section"><h4>Mentor suggestions</h4><ul>${data.feedback.suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`);
  }

  if (data.document) {
    sections.push(`
      <div class="result-section">
        <h4>Ingestion overview</h4>
        <p><strong>Document ID:</strong> ${escapeHtml(data.document.documentId ?? "")}</p>
        <p><strong>Gatekeeper:</strong> ${renderBadge(data.document.gatekeeper?.verdict ?? "")}</p>
        <p><strong>Parser:</strong> ${escapeHtml(data.document.extractedContent?.parserName ?? "")}</p>
        <p><strong>Chunk count:</strong> ${escapeHtml(String(data.document.chunks?.length ?? 0))}</p>
      </div>
    `);
  }

  if (data.ingestion || data.generationReview) {
    sections.push(`
      <div class="result-section">
        <h4>Full pipeline overview</h4>
        <p><strong>Gatekeeper:</strong> ${renderBadge(data.ingestion?.document?.gatekeeper?.verdict ?? "")}</p>
        <p><strong>Extract parser:</strong> ${escapeHtml(data.ingestion?.document?.extractedContent?.parserName ?? "")}</p>
        <p><strong>Chunks:</strong> ${escapeHtml(String(data.ingestion?.document?.chunks?.length ?? 0))}</p>
        <p><strong>Generation review:</strong> ${renderBadge(data.generationReview?.review?.reviewStatus ?? "")}</p>
        <p><strong>Questions:</strong> ${escapeHtml(String(data.generationReview?.questions?.length ?? 0))}</p>
      </div>
    `);
  }

  sections.push(renderStageLogSection(data.stageLogs));
  sections.push(renderUsageLogSection(data.usageLogs));

  if (sections.length === 0) {
    sections.push(`<div class="placeholder">Structured preview is not available for this response shape. Use Raw JSON below.</div>`);
  }

  return sections.join("");
}

function renderOutput(prefix, data) {
  appState.lastResults[prefix] = data;
  setJson(`${prefix}-json`, data);
  setHtml(`${prefix}-result`, formatResultBlock(data));

  const metrics = summarizeMetrics(data);
  const cards = [
    { label: "Total tokens", value: metrics.tokens > 0 ? metrics.tokens.toLocaleString() : null },
    { label: "Total cost (USD)", value: metrics.cost > 0 ? metrics.cost.toFixed(6) : null },
    { label: "Latency (ms)", value: metrics.latency !== null ? Number(metrics.latency).toFixed(2) : null }
  ];

  if (prefix === "gatekeeper") {
    cards.unshift(
      { label: "Verdict", value: data.verdict, badge: true },
      { label: "Primary domain", value: data.primaryDomain },
      { label: "Confidence", value: data.confidence }
    );
  }

  if (prefix === "extracted") {
    cards.unshift(
      { label: "Parser", value: data.parserName },
      { label: "Mode", value: data.extractionMode },
      { label: "Images", value: data.embeddedImageCount }
    );
  }

  if (prefix === "embedding") {
    cards.unshift(
      { label: "Chunks", value: Array.isArray(data.chunks) ? data.chunks.length : null },
      { label: "Embedding model", value: data.embeddingTotals?.modelName ?? data.chunks?.[0]?.embeddingModel },
      { label: "Tagging model", value: data.taggingTotals?.modelName ?? data.chunks?.[0]?.taggingModel }
    );
  }

  if (prefix === "generation") {
    cards.unshift(
      { label: "Review status", value: data.review?.reviewStatus ?? data.reviewStatus, badge: true },
      { label: "Questions", value: Array.isArray(data.questions) ? data.questions.length : null },
      { label: "Attempts used", value: data.attemptsUsed }
    );
  }

  if (prefix === "mentor") {
    cards.unshift(
      { label: "Verdict", value: data.verdict, badge: true },
      { label: "Complexity", value: data.complexity },
      { label: "Confidence", value: data.confidence }
    );
  }

  if (prefix === "ingestion") {
    cards.unshift(
      { label: "Document ID", value: data.document?.documentId ?? data.documentId },
      { label: "Chunks", value: Array.isArray(data.embedding?.chunks) ? data.embedding.chunks.length : Array.isArray(data.chunks) ? data.chunks.length : null },
      { label: "Gatekeeper", value: data.gatekeeper?.verdict, badge: true }
    );
  }

  if (prefix === "pipeline") {
    cards.unshift(
      { label: "Pipeline", value: data.status ?? "completed", badge: true },
      { label: "Document ID", value: data.ingestion?.document?.documentId ?? data.document?.documentId },
      { label: "Questions", value: Array.isArray(data.generationReview?.questions) ? data.generationReview.questions.length : null }
    );
  }

  renderSummaryCards(`${prefix}-summary`, cards);
}

function getHistoryValue(source, lowerKey, pascalKey) {
  return source?.[lowerKey] ?? source?.[pascalKey];
}

function getHistoryResponse(detail) {
  return getHistoryValue(detail, "response", "Response");
}

function getHistorySummary(detail) {
  return getHistoryValue(detail, "summary", "Summary");
}

function renderHistoryListParsed(list) {
  const container = document.getElementById("history-list-parsed");
  if (!container) {
    return;
  }

  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = '<div class="placeholder">No history items loaded.</div>';
    return;
  }

  container.innerHTML = list.map((item) => {
    const runId = item.runId ?? item.RunId ?? "";
    const functionName = item.functionName ?? item.FunctionName ?? "";
    const status = item.status ?? item.Status ?? "";
    const modelSummary = item.modelSummary ?? item.ModelSummary ?? "";
    const totals = item.totals ?? item.Totals ?? {};
    const recordedAt = item.recordedAt ?? item.RecordedAt ?? "";

    return `
      <article class="list-card">
        <h4>${escapeHtml(runId)}</h4>
        <p><strong>${escapeHtml(functionName)}</strong> ${status ? `| ${renderBadge(status)}` : ""}</p>
        <p class="muted">${escapeHtml(recordedAt)}</p>
        <p>${escapeHtml(modelSummary || "No model summary")}</p>
        <p class="muted">Tokens: ${escapeHtml(String((totals.inputTokens ?? 0) + (totals.outputTokens ?? 0)))} | Cost: ${escapeHtml(formatCurrency(totals.totalCostUsd ?? 0))}</p>
      </article>
    `;
  }).join("");
}

function getPresetList(key) {
  return Array.isArray(appState.presets?.[key]) ? appState.presets[key] : [];
}

function getSelectedPreset(key) {
  const select = document.getElementById(`${key}-preset`);
  if (!select) {
    return null;
  }

  return getPresetList(key).find((item) => item.id === select.value) ?? null;
}

function applyGatekeeperPreset(preset) {
  const form = document.getElementById("gatekeeper-form");
  if (!form || !preset) {
    return;
  }

  form.fileName.value = preset.fileName ?? form.fileName.value;
  form.subject.value = preset.subject ?? form.subject.value;
  form.language.value = preset.language ?? form.language.value;
  form.rawContent.value = preset.rawContent ?? form.rawContent.value;
}

function applyExtractedPreset(preset) {
  const form = document.getElementById("extracted-form");
  if (!form || !preset) {
    return;
  }

  form.fileName.value = preset.fileName ?? form.fileName.value;
  form.subject.value = preset.subject ?? form.subject.value;
  form.language.value = preset.language ?? form.language.value;
  form.mode.value = preset.mode ?? form.mode.value;
  form.rawContent.value = preset.rawContent ?? form.rawContent.value;
}

function applyEmbeddingPreset(preset) {
  const form = document.getElementById("embedding-form");
  if (!form || !preset) {
    return;
  }

  form.fileName.value = preset.fileName ?? form.fileName.value;
  form.subject.value = preset.subject ?? form.subject.value;
  form.language.value = preset.language ?? form.language.value;
  form.mode.value = preset.mode ?? form.mode.value;
  form.allowedTags.value = preset.allowedTags ?? form.allowedTags.value;
  form.content.value = preset.content ?? form.content.value;
}

function applyGenerationPreset(preset) {
  const form = document.getElementById("generation-form");
  if (!form || !preset) {
    return;
  }

  form.courseId.value = preset.courseId ?? form.courseId.value;
  form.documentId.value = preset.documentId ?? form.documentId.value;
  form.subject.value = preset.subject ?? form.subject.value;
  form.difficulty.value = preset.difficulty ?? form.difficulty.value;
  form.questionType.value = preset.questionType ?? form.questionType.value;
  form.count.value = String(preset.count ?? form.count.value);
  form.mode.value = preset.mode ?? form.mode.value;
  form.maxAttempts.value = String(preset.maxAttempts ?? form.maxAttempts.value);
  form.isPublic.value = String(preset.isPublic ?? form.isPublic.value);
  form.chunks.value = stringifyJson(preset.chunks ?? []);
}

function applyMentorPreset(preset) {
  const form = document.getElementById("mentor-form");
  if (!form || !preset) {
    return;
  }

  form.submissionId.value = preset.submissionId ?? form.submissionId.value;
  form.subject.value = preset.subject ?? form.subject.value;
  form.language.value = preset.language ?? form.language.value;
  form.problem.value = preset.problem ?? form.problem.value;
  form.code.value = preset.code ?? form.code.value;
  form.sourceFiles.value = stringifyJson(preset.sourceFiles ?? []);
}

function applyIngestionPreset(preset) {
  const form = document.getElementById("ingestion-form");
  if (!form || !preset) {
    return;
  }

  form.fileName.value = preset.fileName ?? form.fileName.value;
  form.subject.value = preset.subject ?? form.subject.value;
  form.language.value = preset.language ?? form.language.value;
  form.mode.value = preset.mode ?? form.mode.value;
  form.allowedTags.value = preset.allowedTags ?? form.allowedTags.value;
  form.rawContent.value = preset.rawContent ?? form.rawContent.value;
}

function applyPreset(functionKey, preset) {
  if (!preset) {
    return;
  }

  if (functionKey === "gatekeeper") {
    applyGatekeeperPreset(preset);
  } else if (functionKey === "extracted") {
    applyExtractedPreset(preset);
  } else if (functionKey === "embedding") {
    applyEmbeddingPreset(preset);
  } else if (functionKey === "generation") {
    applyGenerationPreset(preset);
  } else if (functionKey === "mentor") {
    applyMentorPreset(preset);
  } else if (functionKey === "ingestion") {
    applyIngestionPreset(preset);
  }
}

async function loadPresets() {
  const presets = await fetchJson("/data/benchmark-presets.json");
  appState.presets = presets ?? {};

  ["gatekeeper", "extracted", "embedding", "generation", "mentor", "ingestion"].forEach((key) => {
    const items = getPresetList(key);
    setSelectOptions(`${key}-preset`, items, (item) => item.label ?? item.id, (item) => item.id);
  });
}

function bindPresetLoaders() {
  document.querySelectorAll("[data-load-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const functionKey = button.dataset.loadPreset;
      applyPreset(functionKey, getSelectedPreset(functionKey));
    });
  });
}

function applyUploadResultToForm(target, result) {
  if (!result) {
    return;
  }

  if (target === "gatekeeper") {
    const form = document.getElementById("gatekeeper-form");
    form.fileName.value = result.fileName ?? form.fileName.value;
    form.rawContent.value = result.extractedText ?? result.suggestedRawContent ?? form.rawContent.value;
  }

  if (target === "extracted") {
    const form = document.getElementById("extracted-form");
    form.fileName.value = result.fileName ?? form.fileName.value;
    form.rawContent.value = result.extractedText ?? result.suggestedRawContent ?? form.rawContent.value;
    if (result.suggestedMode) {
      form.mode.value = result.suggestedMode;
    }
  }

  if (target === "embedding") {
    const form = document.getElementById("embedding-form");
    form.fileName.value = result.fileName ?? form.fileName.value;
    form.content.value = result.extractedText ?? result.suggestedRawContent ?? form.content.value;
    if (result.suggestedMode) {
      form.mode.value = result.suggestedMode;
    }
  }
}

function bindUploadInputs() {
  [
    { inputId: "gatekeeper-upload", target: "gatekeeper", outputId: "gatekeeper-upload-json" },
    { inputId: "extracted-upload", target: "extracted", outputId: "extracted-upload-json" },
    { inputId: "embedding-upload", target: "embedding", outputId: "embedding-upload-json" }
  ].forEach(({ inputId, target, outputId }) => {
    document.getElementById(inputId)?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        setJson(outputId, { status: "uploading", fileName: file.name });
        const formData = new FormData();
        formData.append("file", file);
        const result = await postForm("/api/ai-module/uploads/ingest", formData);
        setJson(outputId, result);
        applyUploadResultToForm(target, result);
      } catch (error) {
        setJson(outputId, { error });
      }
    });
  });
}

function getBatchConfig(functionName) {
  return functionName === "gatekeeper"
    ? { endpoint: "/api/ai-module/gatekeeper", buildPayload: () => buildGatekeeperPayload(document.getElementById("gatekeeper-form")) }
    : functionName === "extracted"
      ? { endpoint: "/api/ai-module/extracted-content", buildPayload: () => buildExtractedPayload(document.getElementById("extracted-form")) }
      : functionName === "embedding"
        ? { endpoint: "/api/ai-module/embedding-tagging", buildPayload: () => buildEmbeddingPayload(document.getElementById("embedding-form")) }
        : functionName === "generation"
          ? { endpoint: "/api/ai-module/generation-review", buildPayload: () => buildGenerationPayload(document.getElementById("generation-form")) }
          : functionName === "mentor"
            ? { endpoint: "/api/ai-module/code-mentor", buildPayload: () => buildMentorPayload(document.getElementById("mentor-form")) }
            : functionName === "ingestion"
              ? { endpoint: "/api/ai-module/ingestion", buildPayload: () => buildIngestionPayload(document.getElementById("ingestion-form")) }
              : null;
}

function renderBatchResults(results) {
  appState.batchResults = Array.isArray(results) ? results : [];
  setJson("batch-results-json", appState.batchResults);

  const container = document.getElementById("batch-results-parsed");
  if (!container) {
    return;
  }

  if (appState.batchResults.length === 0) {
    container.innerHTML = '<div class="placeholder">No batch result yet.</div>';
    return;
  }

  container.innerHTML = appState.batchResults.map((item) => `
    <article class="list-card">
      <h4>${escapeHtml(item.presetLabel ?? item.presetId ?? "preset")}</h4>
      <p><strong>${escapeHtml(item.functionName ?? "")}</strong> | ${renderBadge(item.status ?? "")}</p>
      <p class="muted">Tokens: ${escapeHtml(String(item.totalTokens ?? 0))} | Cost: ${escapeHtml(formatCurrency(item.totalCostUsd ?? 0))} | Latency: ${escapeHtml(String(item.latencyMs ?? ""))}</p>
      <p class="muted">Attempts: ${escapeHtml(String(item.attemptsUsed ?? 1))} | Retries: ${escapeHtml(String(item.retriesUsed ?? 0))}</p>
      <p>${escapeHtml(item.modelSummary ?? "")}</p>
    </article>
  `).join("");
}

function renderMatrixResults(results) {
  appState.matrixResults = Array.isArray(results) ? results : [];
  setJson("matrix-results-json", appState.matrixResults);

  const container = document.getElementById("matrix-results-parsed");
  if (!container) {
    return;
  }

  if (appState.matrixResults.length === 0) {
    container.innerHTML = '<div class="placeholder">No matrix result yet.</div>';
    return;
  }

  container.innerHTML = appState.matrixResults.map((item) => `
    <article class="list-card">
      <h4>${escapeHtml(item.model ?? "model")}</h4>
      <p><strong>${escapeHtml(item.functionName ?? "")}</strong> | <strong>${escapeHtml(item.target ?? "")}</strong> | ${renderBadge(item.status ?? "")}</p>
      <p class="muted">Tokens: ${escapeHtml(String(item.totalTokens ?? 0))} | Cost: ${escapeHtml(formatCurrency(item.totalCostUsd ?? 0))} | Latency: ${escapeHtml(String(item.latencyMs ?? ""))}</p>
      <p class="muted">Attempts: ${escapeHtml(String(item.attemptsUsed ?? 1))} | Retries: ${escapeHtml(String(item.retriesUsed ?? 0))}</p>
      <p>${escapeHtml(item.modelSummary ?? "")}</p>
    </article>
  `).join("");
}

function renderSummaryResults(results) {
  appState.summaryResults = Array.isArray(results) ? results : [];
  setJson("summary-json", appState.summaryResults);

  const tbody = document.getElementById("summary-table-body");
  if (tbody) {
    tbody.innerHTML = appState.summaryResults.map((item) => `
      <tr>
        <td>${escapeHtml(item.functionName ?? "")}</td>
        <td>${escapeHtml(item.modelSummary ?? "")}</td>
        <td>${escapeHtml(String(item.runs ?? 0))}</td>
        <td>${escapeHtml(String(item.inputTokens ?? 0))}</td>
        <td>${escapeHtml(String(item.outputTokens ?? 0))}</td>
        <td>${escapeHtml(String(item.totalTokens ?? 0))}</td>
        <td>${escapeHtml(formatCurrency(item.totalCostUsd ?? 0))}</td>
        <td>${escapeHtml(formatCurrency(item.avgCostUsd ?? 0))}</td>
        <td>${escapeHtml(String(item.avgLatencyMs ?? ""))}</td>
      </tr>
    `).join("");
  }

  const totalRuns = appState.summaryResults.reduce((sum, item) => sum + (item.runs ?? 0), 0);
  const totalCost = appState.summaryResults.reduce((sum, item) => sum + (item.totalCostUsd ?? 0), 0);
  const totalTokens = appState.summaryResults.reduce((sum, item) => sum + (item.totalTokens ?? 0), 0);

  renderSummaryCards("summary-overview-cards", [
    { label: "Function-model rows", value: appState.summaryResults.length },
    { label: "Total runs", value: totalRuns },
    { label: "Total tokens", value: totalTokens.toLocaleString() },
    { label: "Total cost (USD)", value: formatCurrency(totalCost) }
  ]);
}

function renderSessionList(items) {
  const list = Array.isArray(items) ? items : [];
  appState.sessionList = list;
  const select = document.getElementById("session-select");
  if (!select) {
    return;
  }

  select.innerHTML = list.map((item) => `
    <option value="${escapeHtml(item.sessionId ?? item.SessionId ?? "")}">
      ${escapeHtml(item.name ?? item.Name ?? "")} | ${escapeHtml(item.createdAt ?? item.CreatedAt ?? "")}
    </option>
  `).join("");
}

async function runBatchPresets() {
  const functionName = $("#batch-function")?.value;
  const config = getBatchConfig(functionName);
  if (!config) {
    return;
  }

  const presetLimit = Number($("#batch-max-count")?.value || 10);
  const retryConfig = getRunnerRetryConfig();
  const presets = getPresetList(functionName).slice(0, presetLimit);
  const results = [];
  renderBatchResults([]);
  setJson("batch-results-json", { status: "running", functionName, presetCount: presets.length, ...retryConfig });

  for (const preset of presets) {
    applyPreset(functionName, preset);
    const payload = config.buildPayload();
    const execution = await runWithRetry(
      () => postJson(config.endpoint, payload),
      retryConfig
    );

    if (execution.ok) {
      const response = execution.result;
      const usageLogs = Array.isArray(response?.usageLogs) ? response.usageLogs : [];
      const inputTokens = usageLogs.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0);
      const outputTokens = usageLogs.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0);
      const metrics = summarizeMetrics(response);
      const normalizedFunction = functionName === "generation" ? "generation" : functionName;

      results.push({
        functionName,
        presetId: preset.id,
        presetLabel: preset.label,
        status: inferStatusFromResult(normalizedFunction, response),
        modelSummary: inferModelSummaryFromResult(normalizedFunction, response),
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        totalCostUsd: metrics.cost,
        latencyMs: metrics.latency !== null ? Number(metrics.latency).toFixed(2) : "",
        attemptsUsed: execution.attemptsUsed,
        retriesUsed: execution.retriesUsed,
        response
      });
    } else {
      results.push({
        functionName,
        presetId: preset.id,
        presetLabel: preset.label,
        status: "error",
        modelSummary: "",
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCostUsd: 0,
        latencyMs: "",
        attemptsUsed: execution.attemptsUsed,
        retriesUsed: execution.retriesUsed,
        normalizedError: normalizeRunnerError(execution.error, "batch"),
        error: execution.error
      });
    }

    renderBatchResults(results);
  }
}

function bindBatchRunner() {
  $("#batch-run-presets")?.addEventListener("click", runBatchPresets);

  $("#batch-export-json")?.addEventListener("click", () => {
    if (!Array.isArray(appState.batchResults) || appState.batchResults.length === 0) {
      return;
    }

    exportJsonFile("batch-presets", appState.batchResults);
  });

  $("#batch-copy-tsv")?.addEventListener("click", async () => {
    if (!Array.isArray(appState.batchResults) || appState.batchResults.length === 0) {
      return;
    }

    await copyText(buildBatchTsv(appState.batchResults));
  });
}

function refreshMatrixTargetOptions() {
  const functionName = $("#matrix-function")?.value;
  const config = matrixConfigs[functionName];
  const targetSelect = $("#matrix-target");
  if (!config || !targetSelect) {
    return;
  }

  targetSelect.innerHTML = (config.targets ?? []).map((item) =>
    `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`
  ).join("");
}

function refreshMatrixProviderFilter() {
  const providerSelect = $("#matrix-provider-filter");
  if (!providerSelect) {
    return;
  }

  const options = ['<option value="">all</option>']
    .concat(Object.keys(appState.providers).map((provider) => `<option value="${escapeHtml(provider)}">${escapeHtml(provider)}</option>`));
  providerSelect.innerHTML = options.join("");
}

function fillMatrixModelsFromCatalog() {
  const providerFilter = ($("#matrix-provider-filter")?.value ?? "").trim().toLowerCase();
  const functionName = $("#matrix-function")?.value;
  const config = matrixConfigs[functionName];
  const models = [];

  for (const [provider, catalog] of Object.entries(appState.providers)) {
    if (providerFilter && provider !== providerFilter) {
      continue;
    }

    const items = catalog.models ?? catalog.Models ?? [];
    for (const item of items) {
      const id = item.id ?? item.Id;
      const capabilities = item.capabilities ?? item.Capabilities ?? [];
      if (!id) {
        continue;
      }

      if (config?.capabilityHint && !capabilities.some((cap) => String(cap).toLowerCase().includes(config.capabilityHint))) {
        continue;
      }

      models.push(id);
    }
  }

  $("#matrix-model-list").value = Array.from(new Set(models)).join("\n");
}

async function runMatrixBenchmarks() {
  const functionName = $("#matrix-function")?.value;
  const target = $("#matrix-target")?.value ?? "primary";
  const config = matrixConfigs[functionName];
  if (!config) {
    return;
  }

  const retryConfig = getRunnerRetryConfig();
  const models = ($("#matrix-model-list")?.value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const results = [];
  renderMatrixResults([]);
  setJson("matrix-results-json", { status: "running", functionName, target, modelCount: models.length, ...retryConfig });

  for (const model of models) {
    const basePayload = config.buildPayload();
    const payload = config.applyTarget(basePayload, model, target);
    const execution = await runWithRetry(
      () => postJson(config.endpoint, payload),
      retryConfig
    );

    if (execution.ok) {
      const response = execution.result;
      const usageLogs = Array.isArray(response?.usageLogs) ? response.usageLogs : [];
      const inputTokens = usageLogs.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0);
      const outputTokens = usageLogs.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0);
      const metrics = summarizeMetrics(response);
      const normalizedFunction = functionName === "generation" ? "generation" : functionName;

      results.push({
        functionName,
        target,
        model,
        status: inferStatusFromResult(normalizedFunction, response),
        modelSummary: inferModelSummaryFromResult(normalizedFunction, response),
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        totalCostUsd: metrics.cost,
        latencyMs: metrics.latency !== null ? Number(metrics.latency).toFixed(2) : "",
        attemptsUsed: execution.attemptsUsed,
        retriesUsed: execution.retriesUsed,
        response
      });
    } else {
      results.push({
        functionName,
        target,
        model,
        status: "error",
        modelSummary: "",
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCostUsd: 0,
        latencyMs: "",
        attemptsUsed: execution.attemptsUsed,
        retriesUsed: execution.retriesUsed,
        normalizedError: normalizeRunnerError(execution.error, "matrix"),
        error: execution.error
      });
    }

    renderMatrixResults(results);
  }
}

function bindMatrixRunner() {
  $("#matrix-function")?.addEventListener("change", refreshMatrixTargetOptions);
  $("#matrix-fill-models")?.addEventListener("click", fillMatrixModelsFromCatalog);
  $("#matrix-run")?.addEventListener("click", runMatrixBenchmarks);

  $("#matrix-export-json")?.addEventListener("click", () => {
    if (!Array.isArray(appState.matrixResults) || appState.matrixResults.length === 0) {
      return;
    }
    exportJsonFile("matrix-benchmark", appState.matrixResults);
  });

  $("#matrix-copy-tsv")?.addEventListener("click", async () => {
    if (!Array.isArray(appState.matrixResults) || appState.matrixResults.length === 0) {
      return;
    }
    await copyText(buildMatrixTsv(appState.matrixResults));
  });
}

function normalizeSummaryItem(item) {
  const totals = item.totals ?? item.Totals ?? {};
  const inputTokens = totals.inputTokens ?? 0;
  const outputTokens = totals.outputTokens ?? 0;
  const totalCostUsd = totals.totalCostUsd ?? 0;
  const latencyMs = totals.latencyMs ?? 0;

  return {
    functionName: item.functionName ?? item.FunctionName ?? "",
    modelSummary: item.modelSummary ?? item.ModelSummary ?? "unknown",
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    totalCostUsd,
    latencyMs
  };
}

async function loadSummaryDashboard() {
  const functions = ["gatekeeper", "extracted-content", "embedding-tagging", "generation-review", "code-mentor", "ingestion", "full-pipeline"];
  const all = [];

  setJson("summary-json", { status: "loading", functions });

  for (const functionName of functions) {
    try {
      const items = await fetchJson(`/api/ai-module/history/${functionName}?take=200`);
      for (const item of (Array.isArray(items) ? items : [])) {
        all.push(normalizeSummaryItem(item));
      }
    } catch (error) {
      all.push({
        functionName,
        modelSummary: "error",
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCostUsd: 0,
        latencyMs: 0,
        error
      });
    }
  }

  const grouped = new Map();
  for (const item of all) {
    const key = `${item.functionName}||${item.modelSummary}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        functionName: item.functionName,
        modelSummary: item.modelSummary,
        runs: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCostUsd: 0,
        totalLatencyMs: 0
      });
    }

    const bucket = grouped.get(key);
    bucket.runs += 1;
    bucket.inputTokens += item.inputTokens ?? 0;
    bucket.outputTokens += item.outputTokens ?? 0;
    bucket.totalTokens += item.totalTokens ?? 0;
    bucket.totalCostUsd += item.totalCostUsd ?? 0;
    bucket.totalLatencyMs += item.latencyMs ?? 0;
  }

  const results = Array.from(grouped.values())
    .map((item) => ({
      functionName: item.functionName,
      modelSummary: item.modelSummary,
      runs: item.runs,
      inputTokens: item.inputTokens,
      outputTokens: item.outputTokens,
      totalTokens: item.totalTokens,
      totalCostUsd: item.totalCostUsd,
      avgCostUsd: item.runs > 0 ? item.totalCostUsd / item.runs : 0,
      avgLatencyMs: item.runs > 0 ? (item.totalLatencyMs / item.runs).toFixed(2) : ""
    }))
    .sort((a, b) => (a.functionName.localeCompare(b.functionName) || b.totalCostUsd - a.totalCostUsd));

  renderSummaryResults(results);
}

function bindSummaryDashboard() {
  $("#summary-load-history")?.addEventListener("click", loadSummaryDashboard);
  $("#summary-export-json")?.addEventListener("click", () => {
    if (!Array.isArray(appState.summaryResults) || appState.summaryResults.length === 0) {
      return;
    }
    exportJsonFile("history-cost-summary", appState.summaryResults);
  });
  $("#summary-copy-tsv")?.addEventListener("click", async () => {
    if (!Array.isArray(appState.summaryResults) || appState.summaryResults.length === 0) {
      return;
    }
    await copyText(buildSummaryTsv(appState.summaryResults));
  });
}

async function loadBenchmarkSessions() {
  const take = Number($("#session-take")?.value || 20);
  const items = await fetchJson(`/api/ai-module/benchmark-sessions?take=${take}`);
  renderSessionList(items);
}

async function saveBenchmarkSession() {
  const payload = {
    name: $("#session-name")?.value ?? "",
    notes: $("#session-notes")?.value ?? "",
    summaryResults: appState.summaryResults,
    batchResults: appState.batchResults,
    matrixResults: appState.matrixResults
  };

  const result = await postJson("/api/ai-module/benchmark-sessions", payload);
  appState.openedSession = result;
  setJson("session-json", result);
  await loadBenchmarkSessions();
}

async function openBenchmarkSession() {
  const sessionId = $("#session-select")?.value;
  if (!sessionId) {
    return;
  }

  const result = await fetchJson(`/api/ai-module/benchmark-sessions/${encodeURIComponent(sessionId)}`);
  appState.openedSession = result;
  setJson("session-json", result);
}

function bindBenchmarkSessions() {
  $("#session-save")?.addEventListener("click", async () => {
    try {
      await saveBenchmarkSession();
    } catch (error) {
      setJson("session-json", { error });
    }
  });

  $("#session-refresh")?.addEventListener("click", async () => {
    try {
      await loadBenchmarkSessions();
    } catch (error) {
      setJson("session-json", { error });
    }
  });

  $("#session-open")?.addEventListener("click", async () => {
    try {
      await openBenchmarkSession();
    } catch (error) {
      setJson("session-json", { error });
    }
  });

  $("#session-export-json")?.addEventListener("click", () => {
    if (!appState.openedSession) {
      return;
    }

    exportJsonFile("benchmark-session", appState.openedSession);
  });

  $("#session-copy-summary-tsv")?.addEventListener("click", async () => {
    if (!appState.openedSession) {
      return;
    }

    const summaryResults = appState.openedSession.summaryResults ?? appState.openedSession.SummaryResults ?? [];
    await copyText(buildSummaryTsv(summaryResults));
  });

  $("#session-copy-detail-tsv")?.addEventListener("click", async () => {
    if (!appState.openedSession) {
      return;
    }

    await copyText(buildSessionDetailTsv(appState.openedSession));
  });
}

function renderHistoryDetail(detail) {
  appState.historyDetail = detail;
  const summary = getHistorySummary(detail) ?? {};
  const response = getHistoryResponse(detail);

  renderSummaryCards("history-summary", [
    { label: "Run ID", value: summary.runId ?? summary.RunId },
    { label: "Function", value: summary.functionName ?? summary.FunctionName },
    { label: "Status", value: summary.status ?? summary.Status, badge: true },
    { label: "Model", value: summary.modelSummary ?? summary.ModelSummary },
    { label: "Usage Source", value: summary.usageSource ?? summary.UsageSource ?? "" },
    { label: "Error", value: summary.error?.code ?? summary.Error?.Code ?? "", badge: Boolean(summary.error ?? summary.Error) },
    { label: "Cost (USD)", value: summary.totals ? formatCurrency(summary.totals.totalCostUsd ?? 0) : summary.Totals ? formatCurrency(summary.Totals.totalCostUsd ?? 0) : null }
  ]);

  setHtml("history-detail-result", formatResultBlock(response));
  setJson("history-detail-json", detail);
}

function setBusy(targetId, message = "Running...") {
  setJson(targetId, message);
}

function renderProviderCards() {
  const container = $("#provider-cards");
  if (!container) {
    return;
  }

  const html = appState.providerList.map((catalog) => {
    const summary = catalog.summary ?? catalog.Summary ?? {};
    const provider = summary.provider ?? summary.Provider;
    const enabled = summary.enabled ?? summary.Enabled;
    const hasApiKey = summary.hasApiKey ?? summary.HasApiKey;
    const baseUrl = summary.baseUrl ?? summary.BaseUrl;
    const defaultTextModel = summary.defaultTextModel ?? summary.DefaultTextModel;

    return `
      <article class="provider-card">
        <div>
          <h4>${escapeHtml(provider)}</h4>
          <p>${enabled ? "enabled" : "disabled"} | ${hasApiKey ? "api key present" : "missing key"}</p>
        </div>
        <p class="muted">${escapeHtml(baseUrl ?? "")}</p>
        <p class="muted">default text model: ${escapeHtml(defaultTextModel ?? "n/a")}</p>
        <div class="action-row">
          <button class="secondary" data-ping-provider="${escapeHtml(provider)}">Ping</button>
        </div>
        <pre class="mini-json">${escapeHtml(JSON.stringify((catalog.models ?? catalog.Models ?? []).slice(0, 6), null, 2))}</pre>
      </article>
    `;
  }).join("");

  container.innerHTML = html || '<div class="placeholder">No providers loaded.</div>';
}

function getProviderModelOptions(providerName) {
  const catalog = appState.providers[String(providerName).toLowerCase()];
  if (!catalog) {
    return [];
  }

  const models = catalog.models ?? catalog.Models ?? [];
  return models.map((model) => ({
    id: model.id ?? model.Id,
    name: model.name ?? model.Name,
    capabilities: model.capabilities ?? model.Capabilities ?? []
  }));
}

function fillModelSelect(selectId, providerName, preferredModel = null) {
  const select = document.getElementById(selectId);
  if (!select) {
    return;
  }

  const options = getProviderModelOptions(providerName);
  const capabilityHint = select.dataset.capability;
  const filtered = capabilityHint
    ? options.filter((item) => item.capabilities.some((capability) => capability.toLowerCase().includes(capabilityHint.toLowerCase())))
    : options;
  const source = filtered.length > 0 ? filtered : options;

  select.innerHTML = source.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.id)}</option>`).join("");

  if (preferredModel && source.some((item) => item.id === preferredModel)) {
    select.value = preferredModel;
  }
}

function bindProviderSelectors() {
  document.querySelectorAll("[data-provider-select]").forEach((select) => {
    if (select.dataset.bound === "true") {
      return;
    }

    select.addEventListener("change", () => {
      fillModelSelect(select.dataset.modelTarget, select.value);
    });
    select.dataset.bound = "true";
  });
}

function populateProviderSelectors() {
  const providerNames = Object.keys(appState.providers);

  document.querySelectorAll("[data-provider-select]").forEach((select) => {
    const current = select.value;
    select.innerHTML = providerNames.map((provider) => `<option value="${escapeHtml(provider)}">${escapeHtml(provider)}</option>`).join("");

    if (current && providerNames.includes(current)) {
      select.value = current;
    } else if (providerNames.length > 0) {
      if (select.name.toLowerCase().includes("embedding") || select.name.toLowerCase().includes("tagging")) {
        select.value = providerNames.includes("cohere") ? "cohere" : providerNames[0];
      } else {
        select.value = providerNames.includes("openai") ? "openai" : providerNames[0];
      }
    }

    fillModelSelect(select.dataset.modelTarget, select.value);
  });
}

async function loadProviders() {
  const providers = await fetchJson("/api/ai-module/providers");
  const list = Array.isArray(providers) ? providers : [];

  appState.providerList = [];
  appState.providers = {};

  for (const summary of list) {
    const providerName = (summary.provider ?? summary.Provider ?? "").toLowerCase();
    const catalog = await fetchJson(`/api/ai-module/providers/${providerName}/models`);
    appState.providers[providerName] = catalog;
    appState.providerList.push(catalog);
  }

  renderProviderCards();
  setJson("provider-raw", appState.providerList);
  populateProviderSelectors();
  bindProviderSelectors();
}

async function pingProvider(provider) {
  const result = await fetchJson(`/api/ai-module/providers/${provider}/ping`);
  alert(`${result.provider}: ${result.success ? "OK" : "FAILED"}\n${result.message}`);
}

async function reloadProviderConfig() {
  await postJson("/api/ai-module/providers/reload", {});
  await loadProviders();
}

async function loadPrompts() {
  const prompts = await fetchJson("/api/ai-module/prompts");
  appState.prompts = Array.isArray(prompts) ? prompts : [];
  renderPromptList();
  populatePromptStudio();
  setJson("prompt-raw", appState.prompts);
}

function renderPromptList() {
  const container = $("#prompt-list");
  if (!container) {
    return;
  }

  const html = appState.prompts.map((prompt) => `
    <article class="list-card compact">
      <h4>${escapeHtml(prompt.key ?? prompt.Key)}</h4>
      <p>${escapeHtml(prompt.description ?? prompt.Description)}</p>
      <p class="muted">version: ${escapeHtml(prompt.version ?? prompt.Version)}</p>
    </article>
  `).join("");

  container.innerHTML = html || '<div class="placeholder">No prompts loaded.</div>';
}

function getPromptByKey(key) {
  return appState.prompts.find((item) => String(item.key ?? item.Key).toLowerCase() === String(key).toLowerCase()) ?? null;
}

function populatePromptStudio() {
  const select = $("#prompt-key");
  if (!select) {
    return;
  }

  const current = select.value;
  select.innerHTML = appState.prompts.map((prompt) => {
    const key = prompt.key ?? prompt.Key;
    return `<option value="${escapeHtml(key)}">${escapeHtml(key)}</option>`;
  }).join("");

  if (current && getPromptByKey(current)) {
    select.value = current;
  }

  if (!select.value && appState.prompts.length > 0) {
    select.value = appState.prompts[0].key ?? appState.prompts[0].Key;
  }

  fillPromptStudioForm(select.value);
}

function fillPromptStudioForm(key) {
  const prompt = getPromptByKey(key);
  if (!prompt) {
    return;
  }

  $("#prompt-version").value = prompt.version ?? prompt.Version ?? "";
  $("#prompt-description").value = prompt.description ?? prompt.Description ?? "";
  $("#prompt-system").value = prompt.systemPrompt ?? prompt.SystemPrompt ?? "";
  $("#prompt-user").value = prompt.userPrompt ?? prompt.UserPrompt ?? "";
  $("#prompt-active").value = String(prompt.isActive ?? prompt.IsActive ?? true);
  setJson("prompt-studio-json", prompt);
}

async function loadFunctionSource(target, sourceType) {
  const config = functionSources[target];
  if (!config) {
    return;
  }

  let payload;

  if (target === "generation") {
    const form = document.getElementById("generation-form");
    const subject = form.subject.value;
    const questionType = form.questionType.value;

    if (sourceType === "generationPrompt") {
      payload = getPromptByKey(config.generationPromptKey) ?? await fetchJson(`/api/ai-module/prompts/${config.generationPromptKey}`);
    } else if (sourceType === "reviewPrompt") {
      payload = getPromptByKey(config.reviewPromptKey) ?? await fetchJson(`/api/ai-module/prompts/${config.reviewPromptKey}`);
    } else if (sourceType === "rubric") {
      payload = await fetchJson(config.rubricUrl(subject, questionType));
    } else if (sourceType === "groundTruth") {
      payload = await fetchJson(config.groundTruthUrl(subject, questionType));
    }
  } else {
    if (sourceType === "prompt") {
      payload = getPromptByKey(config.promptKey) ?? await fetchJson(`/api/ai-module/prompts/${config.promptKey}`);
    } else if (sourceType === "policy") {
      payload = await fetchJson(config.policyUrl);
    } else if (sourceType === "rubric") {
      payload = await fetchJson(config.rubricUrl);
    } else if (sourceType === "groundTruth") {
      payload = await fetchJson(config.groundTruthUrl);
    }
  }

  setJson(config.sourceElementId, payload ?? { message: "No source available." });
}

function buildGatekeeperPayload(form) {
  return {
    userId: form.userId.value,
    fileName: form.fileName.value,
    subject: form.subject.value,
    language: form.language.value,
    rawContent: form.rawContent.value,
    model: form.model.value
  };
}

function buildExtractedPayload(form) {
  return {
    userId: form.userId.value,
    fileName: form.fileName.value,
    subject: form.subject.value,
    language: form.language.value,
    rawContent: form.rawContent.value,
    mode: form.mode.value,
    visionModel: form.visionModel.value || null
  };
}

function buildEmbeddingPayload(form) {
  return {
    userId: form.userId.value,
    fileName: form.fileName.value,
    subject: form.subject.value,
    language: form.language.value,
    content: form.content.value,
    mode: form.mode.value,
    embeddingModel: form.embeddingModel.value,
    taggingModel: form.taggingModel.value,
    allowedTags: parseCsvList(form.allowedTags.value)
  };
}

function parseChunks(text) {
  const chunks = safeJsonParse(text, []);
  return Array.isArray(chunks) ? chunks : [];
}

function buildGenerationPayload(form) {
  return {
    userId: form.userId.value,
    courseId: form.courseId.value || null,
    documentId: form.documentId.value || null,
    isPublic: parseBoolean(form.isPublic.value),
    subject: form.subject.value,
    difficulty: form.difficulty.value,
    questionType: form.questionType.value,
    count: Number(form.count.value),
    mode: form.mode.value,
    generatorModel: form.generatorModel.value,
    reviewerModel: form.reviewerModel.value,
    maxAttempts: Number(form.maxAttempts.value),
    chunks: parseChunks(form.chunks.value)
  };
}

function buildMentorPayload(form) {
  const sourceFiles = safeJsonParse(form.sourceFiles.value, []);
  return {
    submissionId: form.submissionId.value,
    userId: form.userId.value,
    subject: form.subject.value,
    language: form.language.value,
    problem: form.problem.value,
    code: form.code.value,
    sourceFiles: Array.isArray(sourceFiles) ? sourceFiles : [],
    mentorModel: form.mentorModel.value
  };
}

function buildIngestionPayload(form) {
  return {
    userId: form.userId.value,
    fileName: form.fileName.value,
    subject: form.subject.value,
    language: form.language.value,
    rawContent: form.rawContent.value,
    mode: form.mode.value,
    gatekeeperModel: form.gatekeeperModel.value,
    embeddingModel: form.embeddingModel.value,
    taggingModel: form.taggingModel.value,
    visionModel: form.visionModel.value || null,
    allowedTags: parseCsvList(form.allowedTags.value)
  };
}

async function handleFormSubmit(formId, outputPrefix, url, builder) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setBusy(`${outputPrefix}-json`);
      const payload = builder(form);
      const result = await postJson(url, payload);
      renderOutput(outputPrefix, result);
      await loadHistoryList(mapOutputPrefixToHistoryKey(outputPrefix)).catch(() => null);

      if (outputPrefix === "ingestion") {
        const documentId = result.document?.documentId ?? result.documentId;
        if (documentId) {
          document.getElementById("generation-form").documentId.value = documentId;
        }
      }
    } catch (error) {
      renderOutput(outputPrefix, { error });
    }
  });
}

function bindDebugButtons() {
  document.querySelectorAll("[data-run-debug]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.dataset.runDebug;
      try {
        if (target === "gatekeeper") {
          setBusy("gatekeeper-json");
          const payload = buildGatekeeperPayload(document.getElementById("gatekeeper-form"));
          renderOutput("gatekeeper", await postJson("/api/ai-module/gatekeeper/debug", payload));
          await loadHistoryList("gatekeeper").catch(() => null);
        }
        if (target === "extracted") {
          setBusy("extracted-json");
          const payload = buildExtractedPayload(document.getElementById("extracted-form"));
          renderOutput("extracted", await postJson("/api/ai-module/extracted-content/debug", payload));
          await loadHistoryList("extracted-content").catch(() => null);
        }
        if (target === "embedding") {
          setBusy("embedding-json");
          const payload = buildEmbeddingPayload(document.getElementById("embedding-form"));
          renderOutput("embedding", await postJson("/api/ai-module/embedding-tagging/debug", payload));
          await loadHistoryList("embedding-tagging").catch(() => null);
        }
        if (target === "mentor") {
          setBusy("mentor-json");
          const payload = buildMentorPayload(document.getElementById("mentor-form"));
          renderOutput("mentor", await postJson("/api/ai-module/code-mentor/debug", payload));
          await loadHistoryList("code-mentor").catch(() => null);
        }
      } catch (error) {
        renderOutput(target, { error });
      }
    });
  });
}

function bindSourceButtons() {
  document.querySelectorAll("[data-source-button]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const target = button.dataset.target;
      const source = button.dataset.source;
      try {
        await loadFunctionSource(target, source);
      } catch (error) {
        setJson(functionSources[target].sourceElementId, { error });
      }
    });
  });
}

function bindNavigation() {
  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.tabTarget;
      document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      document.getElementById(targetId).classList.add("is-active");
    });
  });
}

async function runGenerationExport() {
  try {
    setBusy("generation-json");
    const payload = buildGenerationPayload(document.getElementById("generation-form"));
    const result = await postJson("/api/ai-module/generation-review/export", payload);
    renderOutput("generation", result);
    await loadHistoryList("generation-review").catch(() => null);
  } catch (error) {
    renderOutput("generation", { error });
  }
}

async function runFullPipeline() {
  try {
    setBusy("pipeline-json");
    const payload = {
      ingestion: buildIngestionPayload(document.getElementById("ingestion-form")),
      generationReview: buildGenerationPayload(document.getElementById("generation-form"))
    };
    const result = await postJson("/api/ai-module/full-pipeline", payload);
    renderOutput("pipeline", result);
    await loadHistoryList("full-pipeline").catch(() => null);
  } catch (error) {
    renderOutput("pipeline", { error });
  }
}

function bindPromptStudio() {
  $("#prompt-key")?.addEventListener("change", (event) => fillPromptStudioForm(event.target.value));

  $("#prompt-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const key = $("#prompt-key").value;
      const payload = {
        key,
        version: $("#prompt-version").value,
        description: $("#prompt-description").value,
        systemPrompt: $("#prompt-system").value,
        userPrompt: $("#prompt-user").value,
        isActive: parseBoolean($("#prompt-active").value)
      };

      const result = await putJson(`/api/ai-module/prompts/${key}`, payload);
      await loadPrompts();
      fillPromptStudioForm(key);
      setJson("prompt-studio-json", result);
    } catch (error) {
      setJson("prompt-studio-json", { error });
    }
  });

  $("#prompt-reload-action")?.addEventListener("click", async () => {
    await postJson("/api/ai-module/prompts/reload", {});
    await loadPrompts();
  });

  $("#prompt-refresh-action")?.addEventListener("click", async () => {
    const key = $("#prompt-key").value;
    const prompt = await fetchJson(`/api/ai-module/prompts/${key}`);
    fillPromptStudioForm(key);
    setJson("prompt-studio-json", prompt);
  });
}

function bindOverviewActions() {
  $("#refresh-provider-list")?.addEventListener("click", () => loadProviders().catch((error) => setJson("provider-raw", { error })));
  $("#refresh-overview")?.addEventListener("click", async () => {
    try {
      await loadProviders();
      await loadPrompts();
    } catch (error) {
      setJson("provider-raw", { error });
    }
  });
  $("#reload-provider-config")?.addEventListener("click", () => reloadProviderConfig().catch((error) => setJson("provider-raw", { error })));
  $("#refresh-prompt-list")?.addEventListener("click", () => loadPrompts().catch((error) => setJson("prompt-raw", { error })));
  $("#reload-prompts")?.addEventListener("click", async () => {
    try {
      await postJson("/api/ai-module/prompts/reload", {});
      await loadPrompts();
    } catch (error) {
      setJson("prompt-raw", { error });
    }
  });

  document.body.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-ping-provider]");
    if (!button) {
      return;
    }

    try {
      await pingProvider(button.dataset.pingProvider);
    } catch (error) {
      alert(JSON.stringify(error, null, 2));
    }
  });
}

function bindResultActions() {
  document.querySelectorAll("[data-copy-summary]").forEach((button) => {
    button.addEventListener("click", async () => {
      const prefix = button.dataset.copySummary;
      const data = appState.lastResults[prefix];
      if (!data) {
        return;
      }

      await copyText(buildSummaryText(prefix, data));
    });
  });

  document.querySelectorAll("[data-copy-json]").forEach((button) => {
    button.addEventListener("click", async () => {
      const prefix = button.dataset.copyJson;
      const data = appState.lastResults[prefix];
      if (!data) {
        return;
      }

      await copyText(JSON.stringify(data, null, 2));
    });
  });

  document.querySelectorAll("[data-export-json]").forEach((button) => {
    button.addEventListener("click", () => {
      const prefix = button.dataset.exportJson;
      const data = appState.lastResults[prefix];
      if (!data) {
        return;
      }

      exportJsonFile(prefix, data);
    });
  });

  document.querySelectorAll("[data-copy-metrics]").forEach((button) => {
    button.addEventListener("click", async () => {
      const prefix = button.dataset.copyMetrics;
      const data = appState.lastResults[prefix];
      if (!data) {
        return;
      }

      await copyText(buildMetricsText(prefix, data));
    });
  });

  document.querySelectorAll("[data-export-chunks]").forEach((button) => {
    button.addEventListener("click", () => {
      const prefix = button.dataset.exportChunks;
      const data = appState.lastResults[prefix];
      if (!data) {
        return;
      }

      const chunks = data.chunks ?? data.document?.chunks ?? [];
      exportJsonFile(`${prefix}-chunks`, chunks);
    });
  });

  document.querySelectorAll("[data-copy-tsv]").forEach((button) => {
    button.addEventListener("click", async () => {
      const prefix = button.dataset.copyTsv;
      const data = appState.lastResults[prefix];
      if (!data) {
        return;
      }

      await copyText(`${buildTsvHeader()}\n${buildTsvRow(prefix, data)}`);
    });
  });
}

async function loadHistoryList(functionName) {
  const items = await fetchJson(`/api/ai-module/history/${functionName}?take=30`);
  const select = document.getElementById(`${functionName}-history-select`);
  const list = Array.isArray(items) ? items : [];
  appState.historyList = list;
  if (select) {
    select.innerHTML = list.map((item) => {
      const runId = item.runId ?? item.RunId;
      const status = item.status ?? item.Status ?? "n/a";
      const recordedAt = item.recordedAt ?? item.RecordedAt ?? "";
      return `<option value="${escapeHtml(runId)}">${escapeHtml(runId)} | ${escapeHtml(status)} | ${escapeHtml(recordedAt)}</option>`;
    }).join("");
  }

  setJson(`${functionName}-history-json`, list);
}

function parseHistoryDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function applyHistoryFilters(list) {
  const search = ($("#history-search")?.value ?? "").trim().toLowerCase();
  const status = ($("#history-status-filter")?.value ?? "").trim().toLowerCase();
  const modelFilter = ($("#history-model-filter")?.value ?? "").trim().toLowerCase();
  const dateFrom = parseHistoryDate($("#history-date-from")?.value);
  const dateTo = parseHistoryDate($("#history-date-to")?.value);

  return (Array.isArray(list) ? list : []).filter((item) => {
    const runId = String(item.runId ?? item.RunId ?? "");
    const functionName = String(item.functionName ?? item.FunctionName ?? "");
    const fileName = String(item.fileName ?? item.FileName ?? "");
    const modelSummary = String(item.modelSummary ?? item.ModelSummary ?? "");
    const itemStatus = String(item.status ?? item.Status ?? "").toLowerCase();
    const recordedAtRaw = item.recordedAt ?? item.RecordedAt;
    const recordedAt = parseHistoryDate(recordedAtRaw);
    const haystack = `${runId} ${functionName} ${fileName} ${modelSummary}`.toLowerCase();

    if (search && !haystack.includes(search)) {
      return false;
    }

    if (status && itemStatus !== status) {
      return false;
    }

    if (modelFilter && !modelSummary.toLowerCase().includes(modelFilter)) {
      return false;
    }

    if (dateFrom && (!recordedAt || recordedAt < dateFrom)) {
      return false;
    }

    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (!recordedAt || recordedAt > end) {
        return false;
      }
    }

    return true;
  });
}

function renderHistorySelect(list) {
  const select = $("#history-run-select");
  if (!select) {
    return;
  }

  select.innerHTML = list.map((item) => {
    const runId = item.runId ?? item.RunId;
    const status = item.status ?? item.Status ?? "";
    const recordedAt = item.recordedAt ?? item.RecordedAt ?? "";
    return `<option value="${escapeHtml(runId)}">${escapeHtml(runId)} | ${escapeHtml(status)} | ${escapeHtml(recordedAt)}</option>`;
  }).join("");
}

function refreshHistoryBrowser() {
  const filtered = applyHistoryFilters(appState.historyMasterList);
  appState.historyList = filtered;
  renderHistorySelect(filtered);
  renderHistoryListParsed(filtered);
  setJson("history-list-json", filtered);
}

async function openHistory(functionName) {
  const select = document.getElementById(`${functionName}-history-select`);
  if (!select || !select.value) {
    setJson(`${functionName}-history-json`, { message: "No history selected." });
    return;
  }

  const detail = await fetchJson(`/api/ai-module/history/${functionName}/${select.value}`);
  setJson(`${functionName}-history-json`, detail);
  renderHistoryDetail(detail);
}

function bindHistoryActions() {
  document.querySelectorAll("[data-load-history]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await loadHistoryList(button.dataset.loadHistory);
      } catch (error) {
        setJson(`${button.dataset.loadHistory}-history-json`, { error });
      }
    });
  });

  document.querySelectorAll("[data-open-history]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await openHistory(button.dataset.openHistory);
      } catch (error) {
        setJson(`${button.dataset.openHistory}-history-json`, { error });
      }
    });
  });

  $("#history-load-list")?.addEventListener("click", async () => {
    const functionName = $("#history-function").value;
    const take = Number($("#history-take").value || 30);
    const items = await fetchJson(`/api/ai-module/history/${functionName}?take=${take}`);
    appState.historyMasterList = Array.isArray(items) ? items : [];
    refreshHistoryBrowser();
  });

  $("#history-open-selected")?.addEventListener("click", async () => {
    const functionName = $("#history-function").value;
    const runId = $("#history-run-select").value;
    if (!runId) {
      return;
    }

    const detail = await fetchJson(`/api/ai-module/history/${functionName}/${runId}`);
    renderHistoryDetail(detail);
  });

  $("#history-copy-json")?.addEventListener("click", async () => {
    if (!appState.historyDetail) {
      return;
    }

    await copyText(JSON.stringify(appState.historyDetail, null, 2));
  });

  $("#history-copy-tsv")?.addEventListener("click", async () => {
    if (!appState.historyDetail) {
      return;
    }

    await copyText(`${buildTsvHeader()}\n${buildHistoryTsvRow(appState.historyDetail)}`);
  });

  $("#history-copy-tsv-list")?.addEventListener("click", async () => {
    if (!Array.isArray(appState.historyList) || appState.historyList.length === 0) {
      return;
    }

    const rows = appState.historyList.map((item) => buildHistoryTsvRow({ summary: item }));
    await copyText(`${buildTsvHeader()}\n${rows.join("\n")}`);
  });

  $("#history-export-json")?.addEventListener("click", () => {
    if (!appState.historyDetail) {
      return;
    }

    exportJsonFile("history-detail", appState.historyDetail);
  });

  $("#history-export-list-json")?.addEventListener("click", () => {
    if (!Array.isArray(appState.historyList) || appState.historyList.length === 0) {
      return;
    }

    exportJsonFile("history-filtered-list", appState.historyList);
  });

  $("#history-export-list-tsv")?.addEventListener("click", async () => {
    if (!Array.isArray(appState.historyList) || appState.historyList.length === 0) {
      return;
    }

    const rows = appState.historyList.map((item) => buildHistoryTsvRow({ summary: item }));
    await copyText(`${buildTsvHeader()}\n${rows.join("\n")}`);
  });

  $("#history-refresh-all")?.addEventListener("click", async () => {
    $("#history-load-list")?.click();
  });

  $("#history-apply-filters")?.addEventListener("click", refreshHistoryBrowser);
  $("#history-clear-filters")?.addEventListener("click", () => {
    $("#history-search").value = "";
    $("#history-status-filter").value = "";
    $("#history-model-filter").value = "";
    $("#history-date-from").value = "";
    $("#history-date-to").value = "";
    refreshHistoryBrowser();
  });
}

function summarizeForCompare(functionName, model, data, slot) {
  const usageLogs = Array.isArray(data?.usageLogs) ? data.usageLogs : [];
  const inputTokens = usageLogs.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0);
  const outputTokens = usageLogs.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0);
  const metrics = summarizeMetrics(data);
  return {
    functionName,
    slot,
    model,
    status: inferStatusFromResult(functionName, data),
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    totalCostUsd: metrics.cost,
    latencyMs: metrics.latency !== null ? Number(metrics.latency).toFixed(2) : ""
  };
}

function refreshCompareTargetOptions() {
  const functionName = $("#compare-function")?.value;
  const config = compareConfigs[functionName];
  const targetSelect = $("#compare-target");
  if (!config || !targetSelect) {
    return;
  }

  const options = Array.isArray(config.targets) && config.targets.length > 0
    ? config.targets
    : [{ value: "primary", label: "Primary model" }];

  targetSelect.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");

  if ($("#compare-help")) {
    $("#compare-help").textContent = config.helpText ?? "Uses the current payload from the corresponding function form. Only the selected model field is swapped.";
  }
}

function bindCompareLab() {
  $("#compare-function")?.addEventListener("change", refreshCompareTargetOptions);

  $("#compare-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const functionName = $("#compare-function").value;
    const config = compareConfigs[functionName];
    if (!config) {
      return;
    }

    const modelA = $("#compare-model-a").value;
    const modelB = $("#compare-model-b").value;
    const compareTarget = $("#compare-target")?.value ?? "primary";
    const basePayload = config.buildPayload();

    $("#compare-a-json").textContent = "Running A...";
    $("#compare-b-json").textContent = "Running B...";
    setHtml("compare-a-result", "");
    setHtml("compare-b-result", "");

    try {
      const [resultA, resultB] = await Promise.all([
        postJson(config.endpoint, config.applyTarget(basePayload, modelA, compareTarget)),
        postJson(config.endpoint, config.applyTarget(basePayload, modelB, compareTarget))
      ]);

      setJson("compare-a-json", resultA);
      setJson("compare-b-json", resultB);
      setHtml("compare-a-result", formatResultBlock(resultA));
      setHtml("compare-b-result", formatResultBlock(resultB));

      const metaA = summarizeForCompare(functionName, modelA, resultA, "A");
      const metaB = summarizeForCompare(functionName, modelB, resultB, "B");
      appState.compareMeta = { metaA, metaB };

      renderSummaryCards("compare-summary", [
        { label: "Function", value: functionName },
        { label: "Target", value: compareTarget },
        { label: "Model A cost", value: formatCurrency(metaA.totalCostUsd) },
        { label: "Model B cost", value: formatCurrency(metaB.totalCostUsd) },
        { label: "Model A tokens", value: metaA.totalTokens },
        { label: "Model B tokens", value: metaB.totalTokens },
        { label: "Status A", value: metaA.status, badge: true },
        { label: "Status B", value: metaB.status, badge: true }
      ]);
    } catch (error) {
      setJson("compare-a-json", { error });
      setJson("compare-b-json", { error });
    }
  });

  $("#compare-copy-tsv")?.addEventListener("click", async () => {
    if (!appState.compareMeta) {
      return;
    }

    await copyText(buildCompareTsv(appState.compareMeta.metaA, appState.compareMeta.metaB));
  });
}

function mapOutputPrefixToHistoryKey(outputPrefix) {
  return outputPrefix === "extracted" ? "extracted-content"
    : outputPrefix === "generation" ? "generation-review"
    : outputPrefix === "mentor" ? "code-mentor"
    : outputPrefix === "pipeline" ? "full-pipeline"
    : outputPrefix;
}

function attachGenerationActions() {
  document.querySelector("[data-run-export='generation']")?.addEventListener("click", runGenerationExport);
  document.getElementById("pipeline-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    runFullPipeline();
  });
}

async function bootstrap() {
  bindNavigation();
  bindProviderSelectors();
  bindSourceButtons();
  bindDebugButtons();
  bindPresetLoaders();
  bindUploadInputs();
  bindBatchRunner();
  bindMatrixRunner();
  bindSummaryDashboard();
  bindBenchmarkSessions();
  bindPromptStudio();
  bindOverviewActions();
  bindHistoryActions();
  bindResultActions();
  bindCompareLab();
  attachGenerationActions();

  handleFormSubmit("gatekeeper-form", "gatekeeper", "/api/ai-module/gatekeeper", buildGatekeeperPayload);
  handleFormSubmit("extracted-form", "extracted", "/api/ai-module/extracted-content", buildExtractedPayload);
  handleFormSubmit("embedding-form", "embedding", "/api/ai-module/embedding-tagging", buildEmbeddingPayload);
  handleFormSubmit("generation-form", "generation", "/api/ai-module/generation-review", buildGenerationPayload);
  handleFormSubmit("mentor-form", "mentor", "/api/ai-module/code-mentor", buildMentorPayload);
  handleFormSubmit("ingestion-form", "ingestion", "/api/ai-module/ingestion", buildIngestionPayload);

  try {
    await loadProviders();
  } catch (error) {
    setJson("provider-raw", { error });
  }

  try {
    await loadPrompts();
  } catch (error) {
    setJson("prompt-raw", { error });
  }

  try {
    await loadPresets();
  } catch (error) {
    console.error("Failed to load presets", error);
  }

  renderSummaryCards("gatekeeper-summary", []);
  renderSummaryCards("extracted-summary", []);
  renderSummaryCards("embedding-summary", []);
  renderSummaryCards("generation-summary", []);
  renderSummaryCards("mentor-summary", []);
  renderSummaryCards("ingestion-summary", []);
  renderSummaryCards("pipeline-summary", []);
  renderSummaryCards("history-summary", []);
  renderSummaryCards("compare-summary", []);
  renderSummaryCards("summary-overview-cards", []);
  setHtml("history-detail-result", '<div class="placeholder">Open a run to view parsed result.</div>');
  renderHistoryListParsed([]);
  renderBatchResults([]);
  renderMatrixResults([]);
  refreshCompareTargetOptions();
  refreshMatrixTargetOptions();
  refreshMatrixProviderFilter();
  setJson("summary-json", { message: "Load summary to aggregate cost from run history." });
  setJson("session-json", { message: "Save current summary, batch, and matrix results into a benchmark session." });

  await loadBenchmarkSessions().catch(() => null);

  for (const functionName of ["gatekeeper", "extracted-content", "embedding-tagging", "generation-review", "code-mentor", "ingestion", "full-pipeline"]) {
    await loadHistoryList(functionName).catch(() => null);
  }

  $("#history-load-list")?.click();
}

bootstrap();
