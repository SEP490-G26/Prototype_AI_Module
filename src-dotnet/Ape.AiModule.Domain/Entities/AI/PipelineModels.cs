namespace Ape.AiModule.Domain.Entities.AI;

public enum PipelineMode
{
    TextOnly,
    FullMultimodalPage
}

public enum GenerationReviewMode
{
    SingleAgent,
    SameModelDualRole,
    DualAgent
}

public enum RunStatus
{
    Pending,
    Completed,
    Failed
}

public sealed record GatekeeperVerdict(
    bool IsSupported,
    string Verdict,
    string PrimaryDomain,
    IReadOnlyList<string> MatchedSubjects,
    decimal Confidence,
    string Reason,
    string? RejectionReasonCode,
    IReadOnlyList<string> DetectedTopics,
    string ModelName);

public sealed record ExtractedContent(
    string RawText,
    string NormalizedMarkdown,
    int WordCount,
    int EmbeddedImageCount,
    string ParserName,
    string? VisionModelName,
    string ExtractionMode,
    IReadOnlyList<string> DetectedImageReferences,
    IReadOnlyList<string> Warnings);

public sealed record ExtractionDraft(
    string DraftId,
    string? CourseId,
    string DocumentId,
    string UserId,
    string SourceType,
    string SourceName,
    string? SourceStoragePath,
    long SourceSizeBytes,
    string SourceChecksum,
    string Language,
    string SubjectCode,
    string OwnershipType,
    string IngestParser,
    string IngestParserVersion,
    string ExtractionMode,
    string? VisionProvider,
    string? VisionModel,
    int TotalPages,
    int TotalSegments,
    int ApprovedSegments,
    int RejectedSegments,
    IReadOnlyList<string> DetectedImageReferences,
    int EmbeddedImageCount,
    IReadOnlyList<string> CleanupWarnings,
    string? HumanNotes,
    string? RawTextPreview,
    string? CleanMarkdownPreview,
    string? ApprovedMarkdownPreview,
    string ReviewStatus,
    string? ReviewedBy,
    DateTimeOffset? ReviewedAt,
    int ApprovalVersion,
    long ExtractionInputTokens,
    long ExtractionOutputTokens,
    decimal ExtractionCostUsd,
    decimal ExtractionLatencyMs,
    string CreditChargeStatus,
    decimal CreditChargeAmount,
    string? PricingPlanCode,
    ExtractionPricingBasisSnapshot PricingBasisSnapshot,
    bool ChunkingReady,
    int ChunkCount,
    string? LastEmbeddingRunId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ExtractionPricingBasisSnapshot(
    long SourceSizeBytes,
    int TotalPages,
    int TotalWordsEstimate,
    int EmbeddedImageCount,
    long ExtractionInputTokens,
    long ExtractionOutputTokens,
    decimal ExtractionCostUsd);

public sealed record ExtractionVisionExpansion(
    string ImageRef,
    string PlacementHint,
    int? PageNumber,
    string DescriptionMarkdown,
    string? Provider,
    string? Model,
    long InputTokens,
    long OutputTokens,
    decimal CostUsd,
    decimal LatencyMs,
    string Status);

public sealed record ExtractionDraftContent(
    string ContentId,
    string ExtractionDraftId,
    string DocumentId,
    string UserId,
    string? CourseId,
    int SegmentIndex,
    string SegmentType,
    string? SectionTitle,
    int SourcePageFrom,
    int SourcePageTo,
    string? SourceLocator,
    string RawText,
    string CleanMarkdown,
    string? ApprovedMarkdown,
    IReadOnlyList<string> DetectedImageReferences,
    IReadOnlyList<ExtractionVisionExpansion> VisionExpansions,
    IReadOnlyList<string> CleanupWarnings,
    string ReviewStatus,
    string? ReviewedBy,
    DateTimeOffset? ReviewedAt,
    int ApprovalVersion,
    int WordCount,
    int TokenCount,
    int CharCount,
    long ExtractionInputTokens,
    long ExtractionOutputTokens,
    decimal ExtractionCostUsd,
    decimal ExtractionLatencyMs,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ExtractionDraftEnvelope(
    ExtractionDraft Draft,
    IReadOnlyList<ExtractionDraftContent> Contents);

public sealed record KnowledgeChunk(
    string Id,
    string? CourseId,
    string DocumentId,
    string UserId,
    string? ExtractionDraftId,
    string? ExtractionContentId,
    int ChunkIndex,
    string ChunkingStrategy,
    string ChunkType,
    string? SectionTitle,
    string SourceType,
    string SourceName,
    int SourcePageFrom,
    int SourcePageTo,
    string Language,
    string SubjectCode,
    string RawText,
    string NormalizedText,
    string MarkdownText,
    IReadOnlyList<string> TopicTags,
    IReadOnlyList<float> Embedding,
    string EmbeddingProvider,
    string EmbeddingModel,
    int EmbeddingDim,
    string TaggingProvider,
    string TaggingModel,
    int WordCount,
    int TokenCount,
    int CharCount,
    bool RetrievalEnabled,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record GeneratedQuestion(
    string Type,
    IReadOnlyList<string> TopicTags,
    string Difficulty,
    string Title,
    string Description,
    IReadOnlyList<string>? SourceChunkIds,
    IReadOnlyList<CodeFile>? SkeletonCode,
    IReadOnlyList<CodeFile>? SolutionCode,
    IReadOnlyList<QuestionTestCase>? TestCases,
    IReadOnlyList<string>? Options,
    IReadOnlyList<string>? CorrectAnswer,
    string? Explanation);

public sealed record CodeFile(string FileName, string Content, bool IsReadonly = false);

public sealed record QuestionTestCase(string Input, string ExpectedOutput, bool IsHidden);

public sealed record ReviewDecision(
    string ReviewStatus,
    IReadOnlyList<string> Issues,
    IReadOnlyList<string> Suggestions,
    decimal Score,
    bool SchemaValid,
    bool ContentGrounded,
    bool NeedsRevision,
    string ReviewerModel);

public sealed record MentorFeedback(
    string Verdict,
    IReadOnlyList<string> IssueCategories,
    IReadOnlyList<string> Issues,
    IReadOnlyList<string> Suggestions,
    IReadOnlyList<string> FailingScenarios,
    decimal Confidence,
    string? Complexity,
    string ModelName);

public sealed record NormalizedModelFields(
    string? Provider,
    string? PrimaryModel,
    string? GeneratorModel,
    string? ReviewerModel,
    string? EmbeddingModel,
    string? TaggingModel,
    string? VisionModel,
    string? MentorModel);

public sealed record NormalizedError(
    string Category,
    string Code,
    int? ProviderStatus,
    bool Retryable,
    string Stage,
    string RawMessage);

public sealed record UsageCapture(
    string UsageSource,
    long? CacheInputTokens,
    long? CacheReadTokens,
    long? ReasoningTokens,
    string? RawUsageJson);

public sealed record TokenCostBreakdown(
    long InputTokens,
    long OutputTokens,
    decimal InputCostUsd,
    decimal OutputCostUsd,
    decimal TotalCostUsd,
    decimal LatencyMs,
    UsageCapture? UsageCapture = null,
    NormalizedError? Error = null);

public sealed record PipelineStageLog(
    string StageName,
    RunStatus Status,
    TokenCostBreakdown Cost,
    IReadOnlyDictionary<string, string> Metadata,
    NormalizedModelFields? ModelFields = null,
    NormalizedError? Error = null);

public sealed record AIUsageLogEntry(
    string UsageLogId,
    string? TriggeredBy,
    string AgentId,
    string PipelineRunId,
    string StageName,
    int AttemptIndex,
    string Provider,
    string ModelName,
    decimal CreditsDeducted,
    long InputTokens,
    long OutputTokens,
    long TokensUsed,
    decimal InputCostUsd,
    decimal OutputCostUsd,
    decimal CostUsd,
    string UsageSource,
    string Status,
    DateTimeOffset CreatedAt,
    object PayloadData,
    NormalizedModelFields? ModelFields = null,
    NormalizedError? Error = null,
    string? RawUsageJson = null);

public sealed record StoredDocument(
    string DocumentId,
    string UserId,
    string FileName,
    string Subject,
    string Language,
    DateTimeOffset CreatedAt,
    GatekeeperVerdict Gatekeeper,
    ExtractedContent ExtractedContent,
    IReadOnlyList<KnowledgeChunk> Chunks);

public sealed record IngestionResult(
    StoredDocument Document,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record GatekeeperResult(
    GatekeeperVerdict Verdict,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record GatekeeperDebugResult(
    GatekeeperVerdict Verdict,
    IReadOnlyDictionary<string, object> Policy,
    IReadOnlyDictionary<string, object> Rubric,
    IReadOnlyDictionary<string, object>? GroundTruth,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record ExtractedContentResult(
    ExtractedContent Extracted,
    ExtractionDraft Draft,
    IReadOnlyList<ExtractionDraftContent> Contents,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record ExtractedContentDebugResult(
    ExtractedContent Extracted,
    ExtractionDraft Draft,
    IReadOnlyList<ExtractionDraftContent> Contents,
    IReadOnlyDictionary<string, object> Policy,
    IReadOnlyDictionary<string, object> Rubric,
    IReadOnlyDictionary<string, object>? GroundTruth,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record ExtractionDraftReviewResult(
    ExtractionDraft Draft,
    IReadOnlyList<ExtractionDraftContent> Contents,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record EmbeddingTaggingResult(
    string DocumentId,
    string? ExtractionDraftId,
    IReadOnlyList<KnowledgeChunk> Chunks,
    TokenCostBreakdown EmbeddingTotals,
    TokenCostBreakdown TaggingTotals,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record EmbeddingTaggingDebugResult(
    string DocumentId,
    string? ExtractionDraftId,
    IReadOnlyList<KnowledgeChunk> Chunks,
    IReadOnlyDictionary<string, object> Policy,
    IReadOnlyDictionary<string, object> Rubric,
    IReadOnlyDictionary<string, object>? GroundTruth,
    TokenCostBreakdown EmbeddingTotals,
    TokenCostBreakdown TaggingTotals,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record QuestionGenerationResult(
    IReadOnlyList<GeneratedQuestion> Questions,
    QuestionSchemaMappingResult SchemaMapping,
    DifficultyAlignmentResult DifficultyAlignment,
    IReadOnlyList<FeQuestionRecord> MappedFeQuestions,
    IReadOnlyList<PeQuestionRecord> MappedPeQuestions,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record GenerationReviewResult(
    string Subject,
    IReadOnlyList<GeneratedQuestion> Questions,
    QuestionSchemaMappingResult SchemaMapping,
    DifficultyAlignmentResult DifficultyAlignment,
    IReadOnlyList<FeQuestionRecord> MappedFeQuestions,
    IReadOnlyList<PeQuestionRecord> MappedPeQuestions,
    ReviewDecision Review,
    int AttemptsUsed,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record QuestionReviewPackageMetadata(
    string PackageId,
    string Subject,
    string QuestionType,
    string RequestedDifficulty,
    GenerationReviewMode Mode,
    string GeneratorModel,
    string ReviewerModel,
    int MaxAttempts,
    string GeneratorPromptKey,
    string ReviewerPromptKey,
    string? RubricId,
    string? RubricVersion,
    string? GroundTruthDatasetId,
    DateTimeOffset ExportedAt);

public sealed record QuestionReviewExportResult(
    QuestionReviewPackageMetadata Metadata,
    GenerationReviewRequestSnapshot Request,
    IReadOnlyDictionary<string, object> Rubric,
    IReadOnlyList<GeneratedQuestion> Questions,
    QuestionSchemaMappingResult SchemaMapping,
    DifficultyAlignmentResult DifficultyAlignment,
    IReadOnlyList<FeQuestionRecord> MappedFeQuestions,
    IReadOnlyList<PeQuestionRecord> MappedPeQuestions,
    ReviewDecision Review,
    int AttemptsUsed,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record GenerationReviewRequestSnapshot(
    string UserId,
    string? CourseId,
    string? DocumentId,
    bool IsPublic,
    string Subject,
    string Difficulty,
    string QuestionType,
    int Count,
    GenerationReviewMode Mode,
    string GeneratorModel,
    string ReviewerModel,
    int MaxAttempts,
    IReadOnlyList<ChunkContextSnapshot> Chunks);

public sealed record ChunkContextSnapshot(
    string ChunkId,
    string ContentText,
    IReadOnlyList<string> TopicTags,
    string? SectionTitle,
    string Language);

public sealed record CodeMentorResult(
    string SubmissionId,
    MentorFeedback Feedback,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record CodeMentorDebugResult(
    string SubmissionId,
    MentorFeedback Feedback,
    IReadOnlyDictionary<string, object> Policy,
    IReadOnlyDictionary<string, object> Rubric,
    IReadOnlyDictionary<string, object>? GroundTruth,
    IReadOnlyList<PipelineStageLog> StageLogs,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);

public sealed record FullPipelineResult(
    IngestionResult Ingestion,
    GenerationReviewResult GenerationReview,
    IReadOnlyList<AIUsageLogEntry> UsageLogs,
    TokenCostBreakdown Totals);
