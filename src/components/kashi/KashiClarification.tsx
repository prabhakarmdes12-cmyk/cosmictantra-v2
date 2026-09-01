'use client';

/**
 * KASHI SAHAYAK — clarification and quick-action chips.
 *
 * Clarification appears only when the assistant is uncertain, and always
 * carries the escape ("इनमें से कोई नहीं"), a microphone retry and a
 * text-entry path. Quick actions are contextual — only what is relevant to
 * the current state is rendered.
 */

import { CLARIFY_PREFIX, NO_MATCH_CHOICE, RETRY_VOICE_CHOICE, TYPE_CHOICE } from '@/lib/kashi/interaction';

export interface KashiClarificationProps {
  choices: string[];
  language: 'hi' | 'en';
  onChoose: (choice: string) => void;
  onRetryVoice: () => void;
  onTypeInstead: () => void;
}

export function KashiClarification(props: KashiClarificationProps) {
  const { choices, language, onChoose, onRetryVoice, onTypeInstead } = props;
  const contextual = choices.filter(
    (c) => c !== NO_MATCH_CHOICE && c !== RETRY_VOICE_CHOICE && c !== TYPE_CHOICE,
  );

  return (
    <div data-testid="kashi-clarification" className="space-y-2">
      <p className="text-xs text-[#696256] dark:text-[#9E988D]">
        {language === 'hi' ? CLARIFY_PREFIX : 'Sorry, I did not follow that completely. Did you mean one of these?'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {contextual.map((c) => (
          <button
            key={c}
            type="button"
            data-testid="kashi-clarification-choice"
            onClick={() => onChoose(c)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-xs font-bold"
          >
            {c}
          </button>
        ))}
        <button
          type="button"
          data-testid="kashi-clarification-none"
          onClick={() => onChoose(NO_MATCH_CHOICE)}
          className="px-3 py-2 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-xs"
        >
          {language === 'hi' ? NO_MATCH_CHOICE : 'None of these'}
        </button>
        <button
          type="button"
          data-testid="kashi-clarification-retry-voice"
          onClick={onRetryVoice}
          className="px-3 py-2 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-xs"
        >
          {language === 'hi' ? RETRY_VOICE_CHOICE : 'Let me speak again'}
        </button>
        <button
          type="button"
          data-testid="kashi-clarification-type"
          onClick={onTypeInstead}
          className="px-3 py-2 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-xs"
        >
          {language === 'hi' ? TYPE_CHOICE : 'I will type it'}
        </button>
      </div>
    </div>
  );
}

export interface KashiQuickActionsProps {
  actions: string[];
  onAction: (action: string) => void;
}

export function KashiQuickActions({ actions, onAction }: KashiQuickActionsProps) {
  if (actions.length === 0) return null;
  return (
    <div data-testid="kashi-quick-actions" className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <button
          key={a}
          type="button"
          data-testid="kashi-quick-action"
          onClick={() => onAction(a)}
          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-[11px] font-bold"
        >
          {a}
        </button>
      ))}
    </div>
  );
}
