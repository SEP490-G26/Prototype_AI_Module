const appState = {
  providers: {},
  providerList: [],
  prompts: [],
  lastResults: {},
  historyDetail: null,
  historyList: [],
  historyMasterList: [],
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

function coerceDisplayText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => coerceDisplayText(item)).filter(Boolean).join(", ");
  }

  return value.verdict
    ?? value.reviewStatus
    ?? value.reason
    ?? value.status
    ?? value.decision
    ?? JSON.stringify(value);
}

function getChunkText(chunk) {
  return chunk?.normalizedText
    ?? chunk?.contentText
    ?? chunk?.rawText
    ?? chunk?.markdownText
    ?? "";
}

function normalizeImportedChunk(chunk, index = 0) {
  if (!chunk || typeof chunk !== "object") {
    return null;
  }

  const chunkId = chunk.chunkId ?? chunk.id ?? `chunk-import-${index + 1}`;
  const contentText = getChunkText(chunk);
  const topicTags = Array.isArray(chunk.topicTags)
    ? chunk.topicTags
    : Array.isArray(chunk.topic_tags)
      ? chunk.topic_tags
      : [];
  const sectionTitle = chunk.sectionTitle ?? chunk.section_title ?? chunk.chunkType ?? chunk.chunk_type ?? null;
  const language = chunk.language ?? "en";

  if (!String(contentText ?? "").trim()) {
    return null;
  }

  return {
    chunkId: String(chunkId),
    contentText: String(contentText),
    topicTags: topicTags.map((item) => String(item)).filter(Boolean),
    sectionTitle: sectionTitle ? String(sectionTitle) : null,
    language: String(language)
  };
}

function extractChunkArrayFromImport(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.chunks)) {
    return payload.chunks;
  }

  if (Array.isArray(payload?.document?.chunks)) {
    return payload.document.chunks;
  }

  if (Array.isArray(payload?.ingestion?.document?.chunks)) {
    return payload.ingestion.document.chunks;
  }

  return [];
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
    const decision = coerceDisplayText(data.verdict ?? data.reviewStatus);
    sections.push(`<div class="result-section"><h4>Decision</h4><p>${renderBadge(decision)}</p></div>`);
  }

  if (data.reason || data.verdict?.reason) {
    sections.push(`<div class="result-section"><h4>Reason</h4><p>${escapeHtml(coerceDisplayText(data.reason ?? data.verdict?.reason))}</p></div>`);
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
    const items = data.chunks.map((chunk) => `
      <article class="list-card">
        <h4>${escapeHtml(chunk.id ?? chunk.chunkId ?? `chunk-${chunk.chunkIndex ?? "?"}`)}</h4>
        <p class="muted">${escapeHtml(chunk.sectionTitle ?? chunk.chunkType ?? "chunk")}</p>
        <pre class="chunk-text">${escapeHtml(getChunkText(chunk))}</pre>
        <p class="muted">Tags: ${escapeHtml((chunk.topicTags ?? chunk.topic_tags ?? []).join(", "))}</p>
      </article>
    `).join("");
    sections.push(`<div class="result-section"><h4>Chunks</h4><div class="card-stack">${items}</div></div>`);
  }

  if (data.document?.chunks && Array.isArray(data.document.chunks)) {
    const items = data.document.chunks.map((chunk) => `
      <article class="list-card">
        <h4>${escapeHtml(chunk.id ?? chunk.chunkId ?? `chunk-${chunk.chunkIndex ?? "?"}`)}</h4>
        <p class="muted">${escapeHtml(chunk.sectionTitle ?? chunk.chunkType ?? "chunk")}</p>
        <pre class="chunk-text">${escapeHtml(getChunkText(chunk))}</pre>
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
      { label: "Verdict", value: coerceDisplayText(data.verdict), badge: true },
      { label: "Primary domain", value: data.primaryDomain ?? data.verdict?.primaryDomain },
      { label: "Confidence", value: data.confidence ?? data.verdict?.confidence }
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
      { label: "Verdict", value: coerceDisplayText(data.verdict ?? data.feedback?.verdict), badge: true },
      { label: "Complexity", value: data.complexity ?? data.feedback?.complexity },
      { label: "Confidence", value: data.confidence ?? data.feedback?.confidence }
    );
  }

  if (prefix === "ingestion") {
    cards.unshift(
      { label: "Document ID", value: data.document?.documentId ?? data.documentId },
      { label: "Chunks", value: Array.isArray(data.embedding?.chunks) ? data.embedding.chunks.length : Array.isArray(data.chunks) ? data.chunks.length : null },
      { label: "Gatekeeper", value: coerceDisplayText(data.gatekeeper?.verdict ?? data.document?.gatekeeper?.verdict), badge: true }
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
      <article class="list-card history-card" data-run-id="${escapeHtml(runId)}" data-function-name="${escapeHtml(functionName)}">
        <h4>${escapeHtml(runId)}</h4>
        <p><strong>${escapeHtml(functionName)}</strong> ${status ? `| ${renderBadge(status)}` : ""}</p>
        <p class="muted">${escapeHtml(recordedAt)}</p>
        <p>${escapeHtml(modelSummary || "No model summary")}</p>
        <p class="muted">Tokens: ${escapeHtml(String((totals.inputTokens ?? 0) + (totals.outputTokens ?? 0)))} | Cost: ${escapeHtml(formatCurrency(totals.totalCostUsd ?? 0))}</p>
      </article>
    `;
  }).join("");
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
        const formData = new FormData();
        formData.append("file", file);
        const result = await postForm("/api/ai-module/uploads/ingest", formData);
        applyUploadResultToForm(target, result);
      } catch {}
    });
  });
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

function renderHistoryDetail(detail) {
  appState.historyDetail = detail;
  const summary = getHistorySummary(detail) ?? {};
  const response = getHistoryResponse(detail);
  const selectedRunId = summary.runId ?? summary.RunId ?? "";

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

  document.querySelectorAll(".history-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.runId === selectedRunId);
  });
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
    return null;
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

  if (config.sourceElementId) {
    setJson(config.sourceElementId, payload ?? { message: "No source available." });
  }

  return payload ?? { message: "No source available." };
}

function getSourceKindOptions(functionKey) {
  if (functionKey === "generation") {
    return [
      { value: "generationPrompt", label: "Generator Prompt" },
      { value: "reviewPrompt", label: "Reviewer Prompt" },
      { value: "rubric", label: "Rubric" },
      { value: "groundTruth", label: "Ground Truth" }
    ];
  }

  return [
    { value: "prompt", label: "Prompt" },
    { value: "policy", label: "Policy" },
    { value: "rubric", label: "Rubric" },
    { value: "groundTruth", label: "Ground Truth" }
  ];
}

function formatSourceViewerBlock(payload) {
  if (!payload || typeof payload !== "object") {
    return '<div class="placeholder">No source loaded.</div>';
  }

  const title = payload.key
    ?? payload.promptKey
    ?? payload.policy_id
    ?? payload.policyId
    ?? payload.dataset_id
    ?? payload.datasetId
    ?? payload.rubric_id
    ?? payload.rubricId
    ?? payload.name
    ?? "Source";
  const version = payload.version ?? payload.Version ?? payload.currentVersion ?? "";
  const description = payload.description ?? payload.Description ?? payload.summary ?? "";
  const systemPrompt = payload.systemPrompt ?? payload.system_prompt;
  const userPrompt = payload.userPrompt ?? payload.user_prompt;

  const blocks = [
    `<div class="result-section"><h4>${escapeHtml(String(title))}</h4>${version ? `<p class="muted">Version: ${escapeHtml(String(version))}</p>` : ""}${description ? `<p>${escapeHtml(String(description))}</p>` : ""}</div>`
  ];

  if (systemPrompt) {
    blocks.push(`<div class="result-section"><h4>System Prompt</h4><pre>${escapeHtml(String(systemPrompt))}</pre></div>`);
  }

  if (userPrompt) {
    blocks.push(`<div class="result-section"><h4>User Prompt</h4><pre>${escapeHtml(String(userPrompt))}</pre></div>`);
  }

  const preview = { ...payload };
  delete preview.systemPrompt;
  delete preview.system_prompt;
  delete preview.userPrompt;
  delete preview.user_prompt;

  blocks.push(`<div class="result-section"><h4>Metadata</h4><pre>${escapeHtml(JSON.stringify(preview, null, 2))}</pre></div>`);
  return blocks.join("");
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
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return [];
  }

  const parsed = safeJsonParse(trimmed, null);
  if (parsed === null) {
    throw new Error("Chunk context JSON is invalid.");
  }

  const rawChunks = extractChunkArrayFromImport(parsed);
  return rawChunks
    .map((chunk, index) => normalizeImportedChunk(chunk, index))
    .filter(Boolean);
}

function buildGenerationPayload(form) {
  const chunks = parseChunks(form.chunks.value);
  if (form.mode.value === "SameModelDualRole") {
    form.reviewerModel.value = form.generatorModel.value;
  }

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
    reviewerModel: form.mode.value === "SameModelDualRole" ? form.generatorModel.value : form.reviewerModel.value,
    maxAttempts: Number(form.maxAttempts.value),
    chunks
  };
}

async function importGenerationChunksFromFile(file) {
  const text = await file.text();
  const parsed = safeJsonParse(text, null);
  if (parsed === null) {
    throw new Error("Imported file is not valid JSON.");
  }

  const chunks = extractChunkArrayFromImport(parsed)
    .map((chunk, index) => normalizeImportedChunk(chunk, index))
    .filter(Boolean);

  if (chunks.length === 0) {
    throw new Error("Imported JSON does not contain any valid chunks.");
  }

  const form = document.getElementById("generation-form");
  form.chunks.value = JSON.stringify(chunks, null, 2);
  const inferredDocumentId = parsed?.documentId ?? parsed?.document?.documentId ?? parsed?.ingestion?.document?.documentId ?? null;
  if (inferredDocumentId && form.documentId) {
    form.documentId.value = inferredDocumentId;
  }
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

async function handleFormSubmit(formId, outputPrefix, url, builder) {
  const form = document.getElementById(formId);
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setBusy(`${outputPrefix}-json`);
      const payload = builder(form);
      const result = await postJson(url, payload);
      renderOutput(outputPrefix, result);
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
        }
        if (target === "extracted") {
          setBusy("extracted-json");
          const payload = buildExtractedPayload(document.getElementById("extracted-form"));
          renderOutput("extracted", await postJson("/api/ai-module/extracted-content/debug", payload));
        }
        if (target === "embedding") {
          setBusy("embedding-json");
          const payload = buildEmbeddingPayload(document.getElementById("embedding-form"));
          renderOutput("embedding", await postJson("/api/ai-module/embedding-tagging/debug", payload));
        }
        if (target === "mentor") {
          setBusy("mentor-json");
          const payload = buildMentorPayload(document.getElementById("mentor-form"));
          renderOutput("mentor", await postJson("/api/ai-module/code-mentor/debug", payload));
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

function bindSourceViewer() {
  const functionSelect = $("#source-function");
  const kindSelect = $("#source-kind");

  const syncOptions = () => {
    const functionKey = functionSelect?.value ?? "gatekeeper";
    const items = getSourceKindOptions(functionKey);
    setSelectOptions("source-kind", items, (item) => item.label, (item) => item.value);

    const isGeneration = functionKey === "generation";
    document.querySelectorAll("[data-source-generation-only]").forEach((element) => {
      element.hidden = !isGeneration;
    });
  };

  functionSelect?.addEventListener("change", syncOptions);
  syncOptions();

  $("#source-load")?.addEventListener("click", async () => {
    const functionKey = functionSelect?.value ?? "gatekeeper";
    const sourceKind = kindSelect?.value ?? "prompt";

    try {
      const payload = await loadFunctionSource(functionKey, sourceKind);
      setHtml("source-viewer-result", formatSourceViewerBlock(payload));
      setJson("source-viewer-json", payload);
    } catch (error) {
      setHtml("source-viewer-result", '<div class="placeholder">Failed to load source.</div>');
      setJson("source-viewer-json", { error });
    }
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
  } catch (error) {
    renderOutput("generation", { error });
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
  $("#history-load-list")?.addEventListener("click", async () => {
    const functionName = $("#history-function").value;
    const take = Number($("#history-take").value || 30);
    const items = await fetchJson(`/api/ai-module/history/${functionName}?take=${take}`);
    appState.historyMasterList = Array.isArray(items) ? items : [];
    refreshHistoryBrowser();
  });

  $("#history-list-parsed")?.addEventListener("click", async (event) => {
    const card = event.target.closest(".history-card");
    if (!card) {
      return;
    }

    const functionName = $("#history-function").value;
    const runId = card.dataset.runId;
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

  $("#history-function")?.addEventListener("change", () => {
    appState.historyDetail = null;
    setHtml("history-detail-result", '<div class="placeholder">Chọn một run ở cột bên trái để xem chi tiết.</div>');
    setJson("history-detail-json", { message: "No run selected." });
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
  const generationForm = document.getElementById("generation-form");
  const syncGenerationMode = () => {
    if (!generationForm) {
      return;
    }

    const sameModel = generationForm.mode.value === "SameModelDualRole";
    const reviewerProvider = generationForm.reviewerProvider;
    const reviewerModel = generationForm.reviewerModel;

    if (sameModel) {
      reviewerModel.value = generationForm.generatorModel.value;
      reviewerProvider.value = generationForm.generatorProvider.value;
    }

    reviewerProvider.disabled = sameModel;
    reviewerModel.disabled = sameModel;
  };

  generationForm?.mode?.addEventListener("change", syncGenerationMode);
  generationForm?.generatorModel?.addEventListener("change", syncGenerationMode);
  generationForm?.generatorProvider?.addEventListener("change", () => {
    setTimeout(syncGenerationMode, 0);
  });

  document.querySelector("[data-run-export='generation']")?.addEventListener("click", runGenerationExport);
  document.getElementById("generation-import-json")?.addEventListener("change", async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      await importGenerationChunksFromFile(file);
      setJson("generation-json", { status: "imported", fileName: file.name, chunkCount: parseChunks(document.getElementById("generation-form").chunks.value).length });
    } catch (error) {
      setJson("generation-json", { error: { message: error.message ?? String(error) } });
    } finally {
      input.value = "";
    }
  });
  document.getElementById("generation-import-trigger")?.addEventListener("click", () => {
    document.getElementById("generation-import-json")?.click();
  });
  syncGenerationMode();
  document.getElementById("pipeline-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    runFullPipeline();
  });
}

async function bootstrap() {
  bindNavigation();
  bindProviderSelectors();
  bindDebugButtons();
  bindUploadInputs();
  bindPromptStudio();
  bindSourceViewer();
  bindOverviewActions();
  bindHistoryActions();
  bindResultActions();
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

  renderSummaryCards("history-summary", []);
  setHtml("history-detail-result", '<div class="placeholder">Chọn một run ở cột bên trái để xem chi tiết.</div>');
  renderHistoryListParsed([]);
  setHtml("source-viewer-result", '<div class="placeholder">Chọn function và loại source rồi bấm Load Source.</div>');
  setJson("source-viewer-json", { message: "No source loaded." });
}

bootstrap();
