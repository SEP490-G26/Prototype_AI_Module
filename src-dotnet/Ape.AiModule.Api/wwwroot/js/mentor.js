import {
  escapeHtml,
  parseJsonInput,
  renderJsonDetails,
  renderMetricCards,
  renderStageLogs,
  renderUsageLogs
} from './shared/core.js';

export const mentorFeature = {
  key: 'mentor',
  historyKey: 'code-mentor',
  formId: 'mentor-form',
  endpoint: '/api/ai-module/code-mentor',
  debugEndpoint: '/api/ai-module/code-mentor/debug',
  resultId: 'mentor-result',
  jsonId: 'mentor-json',
  buildPayload(form) {
    return {
      submissionId: form.submissionId.value.trim(),
      userId: form.userId.value.trim(),
      subject: form.subject.value,
      language: form.language.value,
      problem: form.problem.value,
      code: form.code.value || null,
      sourceFiles: normalizeSourceFiles(parseJsonInput(form.sourceFiles.value, [])),
      mentorModel: form.mentorModel.value
    };
  },
  renderResult(data) {
    const feedback = data?.feedback ?? data?.Feedback ?? {};
    return `
      <section class="result-section">
        <h4>Mentor result</h4>
        <div class="summary-grid">
          <article class="summary-card"><span class="summary-label">Verdict</span><strong class="summary-value">${escapeHtml(feedback.verdict ?? feedback.Verdict ?? '')}</strong></article>
          <article class="summary-card"><span class="summary-label">Confidence</span><strong class="summary-value">${escapeHtml(String(feedback.confidence ?? feedback.Confidence ?? ''))}</strong></article>
          <article class="summary-card"><span class="summary-label">Complexity</span><strong class="summary-value">${escapeHtml(feedback.complexity ?? feedback.Complexity ?? '')}</strong></article>
          <article class="summary-card"><span class="summary-label">Model</span><strong class="summary-value">${escapeHtml(feedback.modelName ?? feedback.ModelName ?? '')}</strong></article>
        </div>
        <div class="kv-block">
          <p><strong>Issue categories:</strong> ${escapeHtml((feedback.issueCategories ?? feedback.IssueCategories ?? []).join(', ') || '(none)')}</p>
          <p><strong>Issues:</strong> ${escapeHtml((feedback.issues ?? feedback.Issues ?? []).join(' | ') || '(none)')}</p>
          <p><strong>Suggestions:</strong> ${escapeHtml((feedback.suggestions ?? feedback.Suggestions ?? []).join(' | ') || '(none)')}</p>
          <p><strong>Failing scenarios:</strong> ${escapeHtml((feedback.failingScenarios ?? feedback.FailingScenarios ?? []).join(' | ') || '(none)')}</p>
        </div>
        ${renderMetricCards(data)}
        ${renderStageLogs(data)}
        ${renderUsageLogs(data)}
        ${renderJsonDetails('Policy', data?.policy ?? data?.Policy)}
        ${renderJsonDetails('Rubric', data?.rubric ?? data?.Rubric)}
        ${renderJsonDetails('Ground truth', data?.groundTruth ?? data?.GroundTruth)}
      </section>
    `;
  },
  init() {}
};

function normalizeSourceFiles(payload) {
  const files = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.sourceFiles)
      ? payload.sourceFiles
      : Array.isArray(payload?.SourceFiles)
        ? payload.SourceFiles
        : [];

  return files
    .map((file, index) => normalizeSourceFileItem(file, index))
    .filter(Boolean);
}

function normalizeSourceFileItem(file, index) {
  if (!file || typeof file !== 'object') {
    return null;
  }

  const fileName = file.fileName ?? file.FileName ?? file.filename ?? file.Filename ?? `file-${index + 1}.txt`;
  const content = file.content ?? file.Content ?? '';
  const isReadonly = file.isReadonly ?? file.IsReadonly ?? file.is_readonly ?? false;

  if (!String(content).trim()) {
    return null;
  }

  return {
    fileName: String(fileName),
    content: String(content),
    isReadonly: Boolean(isReadonly)
  };
}
