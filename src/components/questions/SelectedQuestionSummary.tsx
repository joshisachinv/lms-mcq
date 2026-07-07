"use client";

import { useMemo, useState } from "react";

import { Question } from "@/lib/questionService";
import Button from "@/components/ui/Button";

export type SummaryGroupBy = "subject" | "topic" | "difficulty";
export type SummaryViewMode = "all" | "selected" | "unselected" | "used" | "unused";

type Props = {
  questions: Question[];
  selectedQuestionIds: string[];
  testedQuestionIds?: Set<string>;
  title?: string;
  viewMode?: SummaryViewMode | string;
  onViewModeChange?: (value: SummaryViewMode) => void;
  onSave?: () => void;
  saveLabel?: string;
  saving?: boolean;
};

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) return `${remainingSeconds}s`;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

function getGroupValue(question: Question, groupBy: SummaryGroupBy) {
  const value = question[groupBy];
  return value && String(value).trim() ? String(value) : "Unspecified";
}

const GROUP_TABS: { value: SummaryGroupBy; label: string }[] = [
  { value: "subject", label: "Subject" },
  { value: "topic", label: "Topic" },
  { value: "difficulty", label: "Difficulty" },
];

const QUICK_FILTERS: { value: SummaryViewMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "selected", label: "Selected" },
  { value: "unselected", label: "Not selected" },
  { value: "used", label: "Used" },
  { value: "unused", label: "Unused" },
];

export default function SelectedQuestionSummary({
  questions,
  selectedQuestionIds,
  testedQuestionIds = new Set<string>(),
  title = "Selected questions",
  viewMode = "all",
  onViewModeChange,
  onSave,
  saveLabel = "Save Exam",
  saving = false,
}: Props) {
  const [groupBy, setGroupBy] = useState<SummaryGroupBy>("subject");

  const selectedIdSet = useMemo(
    () => new Set(selectedQuestionIds),
    [selectedQuestionIds],
  );

  const selectedQuestions = useMemo(() => {
    const questionMap = new Map(
      questions.map((question) => [question.id, question]),
    );
    return selectedQuestionIds
      .map((questionId) => questionMap.get(questionId))
      .filter((question): question is Question => Boolean(question));
  }, [questions, selectedQuestionIds]);

  const totalTimerSeconds = selectedQuestions.reduce(
    (total, question) => total + Number(question.timerSeconds || 0),
    0,
  );

  const usedSelectedCount = selectedQuestions.filter((question) =>
    testedQuestionIds.has(question.id),
  ).length;

  const groupedRows = useMemo(() => {
    const rows = new Map<
      string,
      { label: string; count: number; timerSeconds: number }
    >();

    selectedQuestions.forEach((question) => {
      const label = getGroupValue(question, groupBy);
      const existing = rows.get(label) || { label, count: 0, timerSeconds: 0 };
      existing.count += 1;
      existing.timerSeconds += Number(question.timerSeconds || 0);
      rows.set(label, existing);
    });

    return Array.from(rows.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
  }, [groupBy, selectedQuestions]);

  const selectedCount = selectedQuestions.length;
  const totalCount = questions.length;
  const progressPercentage = totalCount
    ? Math.min(100, Math.round((selectedCount / totalCount) * 100))
    : 0;

  return (
    <section className="selected-question-summary" aria-live="polite">
      <div className="selected-summary-topline">
        <div className="selected-summary-stat-block">
          <span className="selected-summary-stat-label">{title}</span>
          <strong>{selectedCount}</strong>
        </div>

        <div className="selected-summary-stat-block">
          <span className="selected-summary-stat-label">Total timer</span>
          <strong>{formatTime(totalTimerSeconds)}</strong>
        </div>

        <div className="selected-summary-progress-block">
          <div className="selected-summary-progress-text">
            <span>{selectedCount} selected of {totalCount}</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="selected-summary-progress-track" aria-hidden="true">
            <div style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        <div className="selected-summary-mini-stats">
          <span>Used {usedSelectedCount}</span>
          <span>Unused {Math.max(0, selectedCount - usedSelectedCount)}</span>
        </div>

        {onSave && (
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : saveLabel}
          </Button>
        )}
      </div>

      <div className="selected-summary-bottomline">
        {onViewModeChange && (
          <div className="selected-summary-filter-tabs" aria-label="Question display filter">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={
                  viewMode === filter.value
                    ? "selected-summary-filter-tab active"
                    : "selected-summary-filter-tab"
                }
                onClick={() => onViewModeChange(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        <div className="selected-summary-breakdown-tabs" aria-label="Breakdown by">
          {GROUP_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={
                groupBy === tab.value
                  ? "selected-summary-breakdown-tab active"
                  : "selected-summary-breakdown-tab"
              }
              onClick={() => setGroupBy(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="selected-summary-chips">
          {groupedRows.length === 0 ? (
            <span className="selected-summary-empty">No questions selected</span>
          ) : (
            groupedRows.map((row) => (
              <span key={row.label} className="selected-summary-chip">
                <strong>{row.label}</strong>
                <span>{row.count} qs</span>
                <span>{formatTime(row.timerSeconds)}</span>
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
