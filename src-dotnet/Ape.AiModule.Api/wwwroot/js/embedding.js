import {
  escapeHtml,
  parseCsvList,
  exportJsonFile,
  postJson,
  renderJsonDetails,
  renderMetricCards,
  renderStageLogs,
  renderUsageLogs,
  readFileText,
  uploadFile
} from './shared/core.js';

export const embeddingFeature = {
  key: 'embedding',
  historyKey: 'embedding-tagging',
  formId: 'embedding-form',
  endpoint: '/api/ai-module/embedding-tagging',
  debugEndpoint: '/api/ai-module/embedding-tagging/debug',
  resultId: 'embedding-result',
  jsonId: 'embedding-json',
  buildPayload(form) {
    const draftId = form.extractionDraftId.value.trim();
    if (draftId) {
      return {
        userId: form.userId.value.trim(),
        extractionDraftId: draftId,
        embeddingModel: form.embeddingModel.value,
        taggingModel: form.taggingModel.value,
        allowedTags: parseCsvList(form.allowedTags.value),
        approvedOnly: true
      };
    }

    return {
      userId: form.userId.value.trim(),
      fileName: form.fileName.value.trim(),
      subject: form.subject.value,
      language: form.language.value,
      content: form.content.value,
      mode: form.mode.value,
      embeddingModel: form.embeddingModel.value,
      taggingModel: form.taggingModel.value,
      allowedTags: parseCsvList(form.allowedTags.value)
    };
  },
  resolveEndpoint(form, endpoint) {
    return form.extractionDraftId.value.trim()
      ? (endpoint.includes('/debug') ? '/api/ai-module/embedding-tagging/from-draft/debug' : '/api/ai-module/embedding-tagging/from-draft')
      : endpoint;
  },
  renderResult(data) {
    const chunks = data?.chunks ?? data?.Chunks ?? [];
    return `
      <section class="result-section">
        <h4>Chunking result</h4>
        <div class="summary-grid">
          <article class="summary-card"><span class="summary-label">Document ID</span><strong class="summary-value">${escapeHtml(data?.documentId ?? data?.DocumentId ?? '')}</strong></article>
          <article class="summary-card"><span class="summary-label">Draft ID</span><strong class="summary-value">${escapeHtml(data?.extractionDraftId ?? data?.ExtractionDraftId ?? '')}</strong></article>
          <article class="summary-card"><span class="summary-label">Chunks</span><strong class="summary-value">${escapeHtml(String(chunks.length))}</strong></article>
          <article class="summary-card"><span class="summary-label">Embedding cost</span><strong class="summary-value">${escapeHtml(formatCost(data?.embeddingTotals ?? data?.EmbeddingTotals))}</strong></article>
          <article class="summary-card"><span class="summary-label">Tagging cost</span><strong class="summary-value">${escapeHtml(formatCost(data?.taggingTotals ?? data?.TaggingTotals))}</strong></article>
        </div>
        ${renderMetricCards(data)}
        ${renderChunks(chunks)}
        ${renderStageLogs(data)}
        ${renderUsageLogs(data)}
        ${renderJsonDetails('Policy', data?.policy ?? data?.Policy)}
        ${renderJsonDetails('Rubric', data?.rubric ?? data?.Rubric)}
        ${renderJsonDetails('Ground truth', data?.groundTruth ?? data?.GroundTruth)}
      </section>
    `;
  },
  init() {
    const upload = document.getElementById('embedding-upload');
    const form = document.getElementById('embedding-form');
    if (upload && form) {
      upload.addEventListener('change', async () => {
        const file = upload.files?.[0];
        if (!file) {
          return;
        }

        const result = await uploadFile(file);
        form.fileName.value = result.fileName ?? file.name;
        form.mode.value = result.suggestedMode ?? form.mode.value;
        form.extractionDraftId.value = '';
        form.content.value = result.suggestedRawContent ?? await readFileText(file);
      });
    }

    document.getElementById('embedding-use-last-draft')?.addEventListener('click', async () => {
      if (!form) {
        return;
      }

      let latest = window.ApeUi?.state?.lastResults?.lastApprovedExtractionDraft
        ?? window.ApeUi?.state?.lastResults?.extracted;
      let draft = latest?.draft ?? latest?.Draft;
      let draftId = draft?.draftId ?? draft?.DraftId;
      if (!draftId) {
        return;
      }

      const reviewStatus = String(draft.reviewStatus ?? draft.ReviewStatus ?? '').toLowerCase();
      if (!(reviewStatus === 'approved' || reviewStatus === 'partially_approved' || reviewStatus === 'embedded')) {
        const userId = form.userId.value.trim();
        const approval = await postJson(`/api/ai-module/extraction-drafts/${draftId}/approve`, {
          userId,
          reviewerId: userId,
          approveAll: true,
          humanNotes: 'Auto-approved from embedding handoff.',
          segments: null
        });
        latest = mergeApprovalIntoExtracted(latest, approval);
        window.ApeUi.state.lastResults.extracted = latest;
        window.ApeUi.state.lastResults.lastApprovedExtractionDraft = latest;
        const extractedJson = document.getElementById('extracted-json');
        const extractedResult = document.getElementById('extracted-result');
        if (extractedJson) {
          extractedJson.textContent = JSON.stringify(latest, null, 2);
        }
        if (extractedResult && window.ApeUi?.featureMap?.extracted?.renderResult) {
          extractedResult.innerHTML = window.ApeUi.featureMap.extracted.renderResult(latest);
        }
        draft = latest?.draft ?? latest?.Draft;
        draftId = draft?.draftId ?? draft?.DraftId;
      }

      form.extractionDraftId.value = draftId ?? '';
      form.fileName.value = draft?.sourceName ?? draft?.SourceName ?? form.fileName.value;
    });

    document.getElementById('embedding-export-chunks')?.addEventListener('click', () => {
      const payload = window.ApeUi?.state?.lastResults?.embedding;
      const chunks = payload?.chunks ?? payload?.Chunks ?? [];
      if (!Array.isArray(chunks) || chunks.length === 0) {
        return;
      }

      exportJsonFile('embedding-chunks', chunks);
    });
  }
};

function mergeApprovalIntoExtracted(previous, approval) {
  if (!previous) {
    return approval;
  }

  return {
    ...previous,
    draft: approval?.draft ?? approval?.Draft ?? previous?.draft ?? previous?.Draft ?? {},
    Draft: approval?.Draft ?? approval?.draft ?? previous?.Draft ?? previous?.draft ?? {},
    contents: approval?.contents ?? approval?.Contents ?? previous?.contents ?? previous?.Contents ?? [],
    Contents: approval?.Contents ?? approval?.contents ?? previous?.Contents ?? previous?.contents ?? [],
    stageLogs: approval?.stageLogs ?? approval?.StageLogs ?? previous?.stageLogs ?? previous?.StageLogs ?? [],
    StageLogs: approval?.StageLogs ?? approval?.stageLogs ?? previous?.StageLogs ?? previous?.stageLogs ?? [],
    usageLogs: approval?.usageLogs ?? approval?.UsageLogs ?? previous?.usageLogs ?? previous?.UsageLogs ?? [],
    UsageLogs: approval?.UsageLogs ?? approval?.usageLogs ?? previous?.UsageLogs ?? previous?.usageLogs ?? [],
    totals: approval?.totals ?? approval?.Totals ?? previous?.totals ?? previous?.Totals ?? {},
    Totals: approval?.Totals ?? approval?.totals ?? previous?.Totals ?? previous?.totals ?? {}
  };
}

function renderChunks(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return '<div class="placeholder">No chunk available.</div>';
  }

  const html = chunks.map((chunk, index) => `
    <details class="details-block" open>
      <summary>Chunk ${escapeHtml(String(chunk.chunkIndex ?? chunk.ChunkIndex ?? index))} | ${escapeHtml(chunk.chunkType ?? chunk.ChunkType ?? '')} | ${escapeHtml((chunk.topicTags ?? chunk.TopicTags ?? []).join(', ') || '(none)')}</summary>
      <div class="kv-block">
        <p><strong>Section:</strong> ${escapeHtml(chunk.sectionTitle ?? chunk.SectionTitle ?? '')}</p>
        <p><strong>Source:</strong> ${escapeHtml(chunk.sourceName ?? chunk.SourceName ?? '')} | page ${escapeHtml(String(chunk.sourcePageFrom ?? chunk.SourcePageFrom ?? ''))}-${escapeHtml(String(chunk.sourcePageTo ?? chunk.SourcePageTo ?? ''))}</p>
        <p><strong>Embedding model:</strong> ${escapeHtml(chunk.embeddingModel ?? chunk.EmbeddingModel ?? '')}</p>
        <p><strong>Tagging model:</strong> ${escapeHtml(chunk.taggingModel ?? chunk.TaggingModel ?? '')}</p>
        <p><strong>Tokens:</strong> ${escapeHtml(String(chunk.tokenCount ?? chunk.TokenCount ?? 0))}</p>
      </div>
      <pre class="json-view">${escapeHtml(chunk.markdownText ?? chunk.MarkdownText ?? chunk.normalizedText ?? chunk.NormalizedText ?? chunk.rawText ?? chunk.RawText ?? '')}</pre>
    </details>
  `).join('');

  return `<div class="card-stack">${html}</div>`;
}

function formatCost(totals) {
  const total = totals?.totalCostUsd ?? totals?.TotalCostUsd ?? 0;
  return `$${Number(total).toFixed(6)}`;
}
