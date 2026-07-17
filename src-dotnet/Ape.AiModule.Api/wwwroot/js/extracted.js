import {
  escapeHtml,
  postJson,
  renderJsonDetails,
  renderMetricCards,
  renderStageLogs,
  renderUsageLogs,
  readFileText,
  uploadFile
} from './shared/core.js';

export const extractedFeature = {
  key: 'extracted',
  historyKey: 'extracted-content',
  formId: 'extracted-form',
  endpoint: '/api/ai-module/extracted-content',
  debugEndpoint: '/api/ai-module/extracted-content/debug',
  resultId: 'extracted-result',
  jsonId: 'extracted-json',
  buildPayload(form) {
    return {
      userId: form.userId.value.trim(),
      fileName: form.fileName.value.trim(),
      subject: form.subject.value,
      language: form.language.value,
      rawContent: form.rawContent.value,
      mode: form.mode.value,
      visionModel: form.visionModel.value || null,
      courseId: form.courseId.value.trim() || null,
      ownershipType: form.ownershipType.value.trim() || 'byos',
      sourceStoragePath: form.sourceStoragePath.value.trim() || null,
      sourceSizeBytes: Number(form.sourceSizeBytes.value || 0) || null
    };
  },
  renderResult(data) {
    const extracted = data?.extracted ?? data?.Extracted ?? {};
    const draft = data?.draft ?? data?.Draft ?? {};
    const contents = data?.contents ?? data?.Contents ?? [];
    return `
      <section class="result-section">
        <h4>Extraction summary</h4>
        <div class="summary-grid">
          <article class="summary-card"><span class="summary-label">Parser</span><strong class="summary-value">${escapeHtml(extracted.parserName ?? extracted.ParserName ?? '')}</strong></article>
          <article class="summary-card"><span class="summary-label">Vision model</span><strong class="summary-value">${escapeHtml(extracted.visionModelName ?? extracted.VisionModelName ?? '')}</strong></article>
          <article class="summary-card"><span class="summary-label">Words</span><strong class="summary-value">${escapeHtml(String(extracted.wordCount ?? extracted.WordCount ?? 0))}</strong></article>
          <article class="summary-card"><span class="summary-label">Embedded images</span><strong class="summary-value">${escapeHtml(String(extracted.embeddedImageCount ?? extracted.EmbeddedImageCount ?? 0))}</strong></article>
        </div>
        ${renderMetricCards(data)}
        ${renderDraftSummary(draft)}
        ${renderTextBlocks(extracted)}
        ${renderDraftContents(contents)}
        ${renderStageLogs(data)}
        ${renderUsageLogs(data)}
        ${renderJsonDetails('Policy', data?.policy ?? data?.Policy)}
        ${renderJsonDetails('Rubric', data?.rubric ?? data?.Rubric)}
        ${renderJsonDetails('Ground truth', data?.groundTruth ?? data?.GroundTruth)}
      </section>
    `;
  },
  init() {
    const upload = document.getElementById('extracted-upload');
    const form = document.getElementById('extracted-form');
    if (!upload || !form) {
      return;
    }

    upload.addEventListener('change', async () => {
      const file = upload.files?.[0];
      if (!file) {
        return;
      }

      const result = await uploadFile(file);
      form.fileName.value = result.fileName ?? file.name;
      form.mode.value = result.suggestedMode ?? form.mode.value;
      form.sourceStoragePath.value = result.savedPath ?? '';
      form.sourceSizeBytes.value = String(result.sizeBytes ?? file.size ?? '');
      form.rawContent.value = result.suggestedRawContent ?? await readFileText(file);
    });

    document.getElementById('extracted-approve-draft')?.addEventListener('click', async () => {
      const latest = window.ApeUi?.state?.lastResults?.extracted;
      const draft = latest?.draft ?? latest?.Draft;
      if (!draft?.draftId && !draft?.DraftId) {
        return;
      }

      const draftId = draft.draftId ?? draft.DraftId;
      const userId = form.userId.value.trim();
      const result = await postJson(`/api/ai-module/extraction-drafts/${draftId}/approve`, {
        userId,
        reviewerId: userId,
        approveAll: true,
        humanNotes: 'Approved from prototype UI.',
        segments: null
      });

      window.ApeUi.state.lastResults.extracted = result;
      window.ApeUi.state.lastResults.lastApprovedExtractionDraft = result;
      document.getElementById('extracted-json').textContent = JSON.stringify(result, null, 2);
      document.getElementById('extracted-result').innerHTML = extractedFeature.renderResult(result);
    });

    document.getElementById('extracted-load-to-embedding')?.addEventListener('click', () => {
      const latest = window.ApeUi?.state?.lastResults?.extracted;
      const draft = latest?.draft ?? latest?.Draft;
      const draftId = draft?.draftId ?? draft?.DraftId;
      if (!draftId) {
        return;
      }

      const embeddingForm = document.getElementById('embedding-form');
      if (!embeddingForm) {
        return;
      }

      embeddingForm.extractionDraftId.value = draftId;
      embeddingForm.fileName.value = draft.sourceName ?? draft.SourceName ?? embeddingForm.fileName.value;
      embeddingForm.subject.value = form.subject.value;
      embeddingForm.language.value = form.language.value;
    });
  }
};

function renderTextBlocks(extracted) {
  const rawText = extracted.rawText ?? extracted.RawText ?? '';
  const markdown = extracted.normalizedMarkdown ?? extracted.NormalizedMarkdown ?? '';
  const warnings = extracted.warnings ?? extracted.Warnings ?? [];
  const imageRefs = extracted.detectedImageReferences ?? extracted.DetectedImageReferences ?? [];

  return `
    <details class="details-block" open>
      <summary>Normalized markdown</summary>
      <pre class="json-view">${escapeHtml(markdown)}</pre>
    </details>
    <details class="details-block">
      <summary>Raw text</summary>
      <pre class="json-view">${escapeHtml(rawText)}</pre>
    </details>
    <div class="kv-block">
      <p><strong>Image refs:</strong> ${escapeHtml(imageRefs.join(', ') || '(none)')}</p>
      <p><strong>Warnings:</strong> ${escapeHtml(warnings.join(' | ') || '(none)')}</p>
    </div>
  `;
}

function renderDraftSummary(draft) {
  if (!draft || typeof draft !== 'object' || Object.keys(draft).length === 0) {
    return '';
  }

  return `
    <div class="summary-grid">
      <article class="summary-card"><span class="summary-label">Draft ID</span><strong class="summary-value">${escapeHtml(draft.draftId ?? draft.DraftId ?? '')}</strong></article>
      <article class="summary-card"><span class="summary-label">Review status</span><strong class="summary-value">${escapeHtml(draft.reviewStatus ?? draft.ReviewStatus ?? '')}</strong></article>
      <article class="summary-card"><span class="summary-label">Segments</span><strong class="summary-value">${escapeHtml(String(draft.totalSegments ?? draft.TotalSegments ?? 0))}</strong></article>
      <article class="summary-card"><span class="summary-label">Approved</span><strong class="summary-value">${escapeHtml(String(draft.approvedSegments ?? draft.ApprovedSegments ?? 0))}</strong></article>
    </div>
  `;
}

function renderDraftContents(contents) {
  if (!Array.isArray(contents) || contents.length === 0) {
    return '';
  }

  return `
    <details class="details-block" open>
      <summary>Draft segments (${escapeHtml(String(contents.length))})</summary>
      <div class="card-stack">
        ${contents.map((item, index) => `
          <details class="details-block">
            <summary>Segment ${escapeHtml(String(item.segmentIndex ?? item.SegmentIndex ?? index + 1))} | ${escapeHtml(item.reviewStatus ?? item.ReviewStatus ?? '')}</summary>
            <div class="kv-block">
              <p><strong>Content ID:</strong> ${escapeHtml(item.contentId ?? item.ContentId ?? '')}</p>
              <p><strong>Pages:</strong> ${escapeHtml(String(item.sourcePageFrom ?? item.SourcePageFrom ?? ''))}-${escapeHtml(String(item.sourcePageTo ?? item.SourcePageTo ?? ''))}</p>
            </div>
            <pre class="json-view">${escapeHtml(item.approvedMarkdown ?? item.ApprovedMarkdown ?? item.cleanMarkdown ?? item.CleanMarkdown ?? '')}</pre>
          </details>
        `).join('')}
      </div>
    </details>
  `;
}
