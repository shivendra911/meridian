import React, { useState } from 'react';
import { PersonChip } from './cards/PersonChip';
import { MoreHorizontal, ArrowRight, Check } from 'lucide-react';

export interface PipelineCardItem {
  id: string;
  personId: string;
  name: string;
  registrationNumber?: string;
  avatarUrl?: string;
  chips?: string[];
  stageId: string;
  score?: string;
  updatedAt?: string;
}

export interface PipelineColumnDef {
  id: string;
  title: string;
  count?: number;
}

export interface PipelineBoardProps {
  columns: PipelineColumnDef[];
  cards: PipelineCardItem[];
  onMoveCard: (cardId: string, targetStageId: string) => void;
  onCardClick?: (card: PipelineCardItem) => void;
  className?: string;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  columns,
  cards,
  onMoveCard,
  onCardClick,
  className = '',
}) => {
  const [activeMenuCardId, setActiveMenuCardId] = useState<string | null>(null);

  const getCardsForColumn = (columnId: string) =>
    cards.filter((c) => c.stageId.toLowerCase() === columnId.toLowerCase());

  return (
    <div
      className={`w-full overflow-x-auto pb-4 ${className}`}
      role="region"
      aria-label="Recruitment Pipeline Board"
    >
      <div className="flex items-start gap-4 min-w-[720px]">
        {columns.map((col) => {
          const colCards = getCardsForColumn(col.id);

          return (
            <div
              key={col.id}
              className="flex-1 min-w-[220px] bg-canvas/70 rounded-xl p-3 border border-line flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-line">
                <span className="text-xs font-bold text-ink uppercase tracking-wider">
                  {col.title}
                </span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-surface text-ink text-[11px] font-bold px-1.5 border border-line">
                  {colCards.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 flex-1 min-h-[140px]">
                {colCards.length === 0 ? (
                  <div className="h-24 flex items-center justify-center rounded-lg border border-dashed border-line text-ink-muted text-xs">
                    No candidates
                  </div>
                ) : (
                  colCards.map((card) => {
                    const isMenuOpen = activeMenuCardId === card.id;

                    return (
                      <div
                        key={card.id}
                        className="rounded-lg border border-line bg-surface p-3 shadow-xs hover:border-brand/40 transition-all duration-150 relative group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="flex-1 cursor-pointer min-w-0"
                            onClick={() => onCardClick?.(card)}
                          >
                            <PersonChip
                              name={card.name}
                              avatar_url={card.avatarUrl}
                              role={card.registrationNumber || ''}
                            />
                          </div>

                          {/* "Move to" Action Menu Button (WCAG 2.2 Compliant Keyboard/Tap) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuCardId(isMenuOpen ? null : card.id)
                              }
                              className="min-h-[28px] min-w-[28px] p-1 rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors flex items-center justify-center"
                              aria-label={`Move ${card.name} to another stage`}
                              aria-expanded={isMenuOpen}
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {/* Move to Menu Dropdown */}
                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-surface border border-line shadow-lg py-1 z-30 animate-in fade-in zoom-in-95">
                                <div className="px-2.5 py-1 text-[10px] font-bold text-ink-muted uppercase tracking-wider border-b border-line">
                                  Move to Stage
                                </div>
                                {columns.map((targetCol) => {
                                  const isCurrent =
                                    targetCol.id.toLowerCase() === card.stageId.toLowerCase();

                                  return (
                                    <button
                                      key={targetCol.id}
                                      type="button"
                                      disabled={isCurrent}
                                      onClick={() => {
                                        onMoveCard(card.id, targetCol.id);
                                        setActiveMenuCardId(null);
                                      }}
                                      className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors ${
                                        isCurrent
                                          ? 'text-ink-faint font-semibold bg-surface-muted/40 cursor-default'
                                          : 'text-ink hover:bg-surface-muted hover:text-brand'
                                      }`}
                                    >
                                      <span>{targetCol.title}</span>
                                      {isCurrent ? (
                                        <Check size={12} className="text-ink-muted" />
                                      ) : (
                                        <ArrowRight size={12} className="text-ink-muted" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chips / Metadata */}
                        {card.chips && card.chips.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.chips.map((chip, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-ink-secondary"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
