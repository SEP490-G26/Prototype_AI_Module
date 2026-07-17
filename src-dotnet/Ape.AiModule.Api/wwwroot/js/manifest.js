export const fragmentManifest = [
  { mountId: 'fragment-overview', path: '/fragments/overview.html' },
  { mountId: 'fragment-gatekeeper', path: '/fragments/gatekeeper.html' },
  { mountId: 'fragment-extracted', path: '/fragments/extracted.html' },
  { mountId: 'fragment-generation', path: '/fragments/generation.html' },
  { mountId: 'fragment-mentor', path: '/fragments/mentor.html' },
  { mountId: 'fragment-history', path: '/fragments/history.html' }
];

export const tabManifest = [
  { tabId: 'overview-tab', navLabel: 'Overview' },
  { tabId: 'gatekeeper-tab', navLabel: '1. Gatekeeper' },
  { tabId: 'extracted-tab', navLabel: '2-3. Extraction -> Review -> Embedding' },
  { tabId: 'generation-tab', navLabel: '4-5. Generation + Review' },
  { tabId: 'mentor-tab', navLabel: '6. Code Mentor' },
  { tabId: 'history-tab', navLabel: 'Run History' }
];

export function createRendererMap(features) {
  return {
    gatekeeper: features.gatekeeper.renderResult,
    'gatekeeper-debug': features.gatekeeper.renderResult,
    'extracted-content': features.extracted.renderResult,
    'extracted-content-debug': features.extracted.renderResult,
    'extraction-draft-approve': features.extracted.renderResult,
    'embedding-tagging': features.embedding.renderResult,
    'embedding-tagging-debug': features.embedding.renderResult,
    'embedding-tagging-from-draft': features.embedding.renderResult,
    'embedding-tagging-from-draft-debug': features.embedding.renderResult,
    'generation-review': features.generation.renderResult,
    'generation-review-export': features.generation.renderResult,
    'question-generation': features.generation.renderResult,
    'code-mentor': features.mentor.renderResult,
    'code-mentor-debug': features.mentor.renderResult
  };
}
