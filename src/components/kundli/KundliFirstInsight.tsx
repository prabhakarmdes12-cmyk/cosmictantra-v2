'use client';

/**
 * SPRINT C §9–§14, §17 — FIRST KUNDLI INSIGHT (consumer viewport).
 *
 * Presentational only: every value comes from the read-only adapter
 * (engine fields verbatim). No astrology calculation here, no fabricated
 * patterns, no Puja commerce, no account requirement.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  User,
  Save,
  ArrowRight,
  ChevronDown,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import type { StoredKundliRecord } from '@/lib/jyotish/kundliStore';
import NorthIndianChart from '../NorthIndianChart';
import {
  adaptKundliAtAGlance,
  buildDashaWhyEvidence,
  buildDashaTechnicalEvidence,
  buildTimeSensitivityNote,
  deriveConsumerChartState,
  type ChartStateResult,
} from '@/lib/presentation/kundliOverviewAdapter';
import {
  combineChartStates,
  normalizeChartStatus,
  type PersistenceState,
} from '@/lib/kundli/chartStateMachine';
import { auditAnalyticsPayload, findPrivacyViolations } from '@/lib/invariants/sprintC1';
import { dispatchKashiJourneyContext } from '@/lib/kashi/journeyContext';
import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics';
import { TRANSLATIONS } from '@/lib/translations';
import { chitiSensory } from '@/lib/chitiAudio';
import { upsertProfile, setActiveProfileId } from '@/lib/profileStore';

type ClaimKind = 'CALCULATED' | 'DERIVED' | 'TRADITIONAL' | 'SCHOLAR_JUDGEMENT' | 'VALIDATION_PENDING';

const CLAIM_KEYS: Record<ClaimKind, string> = {
  CALCULATED: 'claimCalculated',
  DERIVED: 'claimDerived',
  TRADITIONAL: 'claimTraditional',
  SCHOLAR_JUDGEMENT: 'claimScholar',
  VALIDATION_PENDING: 'claimValidationPending',
};

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(v), template);
}

function ClaimChip({ kind, t, isHi }: { kind: ClaimKind; t: any; isHi: boolean }) {
  const label = (isHi ? t[`${CLAIM_KEYS[kind]}Hi`] : t[CLAIM_KEYS[kind]]) || CLAIM_KEYS[kind];
  const styles: Record<ClaimKind, string> = {
    CALCULATED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/30',
    DERIVED: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-600/30',
    TRADITIONAL: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-600/30',
    SCHOLAR_JUDGEMENT: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-600/30',
    VALIDATION_PENDING: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-600/30',
  };
  return (
    <span
      data-testid={`claim-${kind}`}
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-mono-data font-bold uppercase tracking-wider ${styles[kind]}`}
    >
      {label}
    </span>
  );
}

export default function KundliFirstInsight({
  record,
  lang = 'en',
}: {
  record: StoredKundliRecord;
  lang?: string;
}) {
  const t = (TRANSLATIONS[lang] || TRANSLATIONS.en).conversion || TRANSLATIONS.en.conversion;
  const isHi = lang === 'hi';

  // Sprint C.1 §4 — explicit persistence machine: EPHEMERAL → SAVING → SAVED | SAVE_FAILED.
  const [persistence, setPersistence] = useState<PersistenceState>('EPHEMERAL');
  const [saveError, setSaveError] = useState(false);

  const glance = useMemo(() => adaptKundliAtAGlance(record), [record]);
  const whySteps = useMemo(() => buildDashaWhyEvidence(record), [record]);
  const technical = useMemo(() => buildDashaTechnicalEvidence(record), [record]);
  const state: ChartStateResult = useMemo(() => deriveConsumerChartState(record), [record]);
  const timeNote = useMemo(() => buildTimeSensitivityNote(record), [record]);
  const isUserCreated = Array.isArray(record.tags) && record.tags.includes('User Created');
  // Canonical combined state (CT_UX_INV_004) — the UI must satisfy it.
  const combined = combineChartStates(normalizeChartStatus(state.state), persistence);

  const [whyOpen, setWhyOpen] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [activeVarga, setActiveVarga] = useState<1 | 9>(1);

  const chartD1Obj = useMemo(() => ({
    lagna: record.snapshot.lagna,
    houses: record.snapshot.houses,
    planets: record.snapshot.planets
  }), [record.snapshot]);

  const chartD9Obj = useMemo(() => {
    const v9 = record.snapshot.vargas?.shodashavarga?.[9];
    if (!v9) return chartD1Obj;
    return {
      lagna: {
        rashiId: v9.lagna.vargaRashiId,
        rashiName: v9.lagna.vargaRashiName
      },
      houses: v9.houses.map((h: any) => ({
        number: h.houseNumber,
        rasiId: h.rashiId,
        rasiName: h.rashiName,
        planets: (h.planetsInHouse || []).map((pName: string) => {
          const pObj = v9.planets?.[pName];
          return {
            name: pName,
            degrees: pObj?.divisionDegree || 0,
            degreeStr: `${Math.floor((pObj?.divisionDegree || 0) % 30)}°`
          };
        })
      })),
      planets: v9.planets
    };
  }, [record.snapshot, chartD1Obj]);

  const displayedChart = activeVarga === 9 ? chartD9Obj : chartD1Obj;
  const whyButtonRef = useRef<HTMLButtonElement>(null);
  const firedInsightRef = useRef(false);

  const periodString = glance?.periodString || `${glance?.mahadasha?.value || ''}–${glance?.antardasha?.value || ''}`;
  const defaultQuestion = fill(t.askAboutDefault, { period: periodString || '—' });
  const isMarked = (reason: string) => t[reason] ? (isHi ? (t[`${reason}Hi`] || t[reason]) : t[reason]) : reason;

  useEffect(() => {
    if (firedInsightRef.current) return;
    firedInsightRef.current = true;
    const payload = {
      route: `/kundli/${record.id}`,
      chartId: record.id,
      timeConfidence: record.timeConfidence,
      validationState: state.state,
      lang,
    };
    // CT_PRIV_INV_001 guard — a violation must never be silently dropped before sending.
    const audit = auditAnalyticsPayload(ANALYTICS_EVENTS.FIRST_INSIGHT_VIEW, payload);
    if (!audit.ok) {
      console.warn('[privacy] blocked analytics send:', audit.reason);
      return;
    }
    analytics.track(ANALYTICS_EVENTS.FIRST_INSIGHT_VIEW, payload);
  }, [record.id, record.timeConfidence, state.state, lang]);

  // Escape closes the WHY drawer and returns focus (§30 keyboard behaviour)
  useEffect(() => {
    if (!whyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWhy();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whyOpen]);

  // Pre-saved detection: if this chart is already the active chart, show
  // "Saved ✓" immediately instead of offering Save twice.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('cosmictantra_active_kundli');
      if (!stored) return;
      const p = JSON.parse(stored);
      if (
        p &&
        p.name === record.personName &&
        p.birthDate === record.birthContext.birthDate &&
        Number(Number(p.latitude ?? p.lat)) === Number(record.birthContext.latitude)
      ) {
        setPersistence('SAVED');
      }
    } catch {}
  }, [record]);

  const openWhy = () => {
    chitiSensory.playTick();
    setWhyOpen(true);
    const payload = {
      chartId: record.id,
      route: `/kundli/${record.id}`,
      evidenceCount: whySteps.length,
      lang,
    };
    if (auditAnalyticsPayload(ANALYTICS_EVENTS.WHY_OPEN, payload).ok) {
      analytics.track(ANALYTICS_EVENTS.WHY_OPEN, payload);
    }
  };

  const closeWhy = () => {
    setWhyOpen(false);
    whyButtonRef.current?.focus();
  };

  const dispatchAsk = (question: string) => {
    dispatchKashiJourneyContext({
      contractVersion: 'kashi-journey-context-v1',
      route: `/kundli/${record.id}`,
      chartId: record.id,
      dasha: {
        mahadasha: glance?.mahadasha?.value || undefined,
        antardasha: glance?.antardasha?.value || undefined,
        periodString: glance?.periodString || undefined,
      },
      evidenceIds: whySteps.map((s) => s.textKey),
      question,
      language: lang,
      validationStatuses: [state.state === 'READY' ? 'READY' : state.state === 'VALIDATION_PENDING' ? 'VALIDATION_PENDING' : state.state === 'INPUT_INCOMPLETE' ? 'INPUT_INCOMPLETE' : 'FAILED'],
      source: 'CONVERSION_JOURNEY',
    });
  };

  const handleAskAboutThis = (e: React.MouseEvent) => {
    e.preventDefault();
    chitiSensory.playTick();
    dispatchAsk(defaultQuestion);
    const payload = {
      chartId: record.id,
      route: `/kundli/${record.id}`,
      lang,
    };
    if (auditAnalyticsPayload(ANALYTICS_EVENTS.ASK_ABOUT_CHART, payload).ok) {
      analytics.track(ANALYTICS_EVENTS.ASK_ABOUT_CHART, payload);
    }
  };

  const handleAskPandit = () => {
    const payload = {
      chartId: record.id,
      route: `/kundli/${record.id}`,
      dasha: periodString,
      lang,
    };
    if (auditAnalyticsPayload(ANALYTICS_EVENTS.CONSULT_INTENT, payload).ok) {
      analytics.track(ANALYTICS_EVENTS.CONSULT_INTENT, payload);
    }
  };

  const handleSave = () => {
    chitiSensory.playTick();
    if (persistence === 'SAVING' || persistence === 'SAVED') return;
    setPersistence('SAVING');
    setSaveError(false);
    // CT_UX_INV_004: a FAILED chart must never be saved.
    if (combined.contradiction && state.state === 'FAILED') {
      setPersistence('EPHEMERAL');
      return;
    }
    try {
      const bc = record.birthContext;
      window.localStorage.setItem(
        'cosmictantra_active_kundli',
        JSON.stringify({
          name: record.personName,
          birthDate: bc.birthDate,
          birthTime: bc.birthTime,
          city: bc.locationName,
          latitude: bc.latitude,
          longitude: bc.longitude,
          timezone: bc.timezone,
          timeConfidence: record.timeConfidence,
        })
      );
      const savedProfile = upsertProfile({
        name: record.personName,
        birthDate: bc.birthDate,
        birthTime: bc.birthTime,
        birthCity: bc.locationName,
        lat: bc.latitude,
        lng: bc.longitude,
        tz: bc.timezone,
        relation: 'Self',
      });
      if (!savedProfile) throw new Error('profile was not created');
      setActiveProfileId(savedProfile.id);
      setPersistence('SAVED');
      const payload = {
        chartId: record.id,
        route: `/kundli/${record.id}`,
        timeConfidence: record.timeConfidence,
        lang,
      };
      if (auditAnalyticsPayload(ANALYTICS_EVENTS.SAVE_KUNDLI, payload).ok) {
        analytics.track(ANALYTICS_EVENTS.SAVE_KUNDLI, payload);
      }
    } catch {
      // Calm recovery — never claim "saved" when persistence failed (§22).
      setPersistence('SAVE_FAILED');
      setSaveError(true);
    }
  };

  const gl = (f: { value: string | null; labelKey: string } | undefined) =>
    f && f.value ? f.value : '—';

  return (
    <section
      data-testid="kundli-first-insight"
      aria-labelledby="kundli-insight-title"
      className="relative bg-[#FAF7F2] text-[#1C1917] border-b border-[#E5D7BC]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Masthead */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-[#8E6F1D] hover:text-[#785E18] transition-colors">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8a6b1e] to-[#d4af37] flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" />
            </span>
            <span className="font-editorial text-sm font-bold tracking-wide">CosmicTantra</span>
          </Link>
          <div className="flex items-center gap-2">
            {state.state === 'READY' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 text-[10px] font-mono-data font-bold">
                <ShieldCheck className="w-3 h-3" /> {isHi ? t.stateReadyHi : t.stateReady}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-orange-600/30 bg-orange-500/10 text-orange-700 text-[10px] font-mono-data font-bold">
                <ShieldAlert className="w-3 h-3" /> {isHi ? t.stateValidationPendingHi : t.stateValidationPending}
              </span>
            )}
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg border border-[#8E6F1D]/30 text-[#8E6F1D] text-[10px] font-mono-data font-bold hover:border-[#8E6F1D] transition-colors min-h-9 inline-flex items-center"
            >
              {isHi ? 'मेरी कुण्डली' : 'My Kundli'}
            </Link>
          </div>
        </div>

        {/* Title + validation reasons */}
        <div className="mt-6">
          <p data-testid="kundli-ready" className="text-[10px] font-mono-data font-bold uppercase tracking-[0.2em] text-[#8E6F1D]">
            {isHi ? t.kundliReadyHi : t.kundliReady}
          </p>
          <h1 id="kundli-insight-title" className="mt-1 font-editorial text-2xl sm:text-3xl font-bold tracking-tight">
            {record.personName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#696256]">
            {record.birthContext.birthDate} · {record.birthContext.birthTime} · {record.birthContext.locationName}
          </p>
          {state.reasons.length > 0 && (
            <div
              role="status"
              className="mt-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 text-xs font-semibold max-w-2xl"
            >
              {state.reasons.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {isMarked(r)}
                </div>
              ))}
            </div>
          )}
          {timeNote && (
            <div
              data-testid="time-sensitivity-note"
              role="status"
              className="mt-3 max-w-2xl p-3.5 rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-800 dark:text-orange-300 text-xs leading-6 font-semibold"
            >
              <p className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{isHi ? t[`${timeNote.headlineKey}Hi`] : t[timeNote.headlineKey]}</span>
              </p>
              <p className="mt-1 pl-6 text-[10px] font-mono-data opacity-90">
                {isHi ? t.restrictedFieldsHi : t.restrictedFields}:{' '}
                {timeNote.restricted.join(' · ')}
              </p>
            </div>
          )}
        </div>

        {/* AT A GLANCE */}
        <div className="mt-6">
          <h2 className="text-sm font-editorial font-bold text-[#4A443B] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8E6F1D]" aria-hidden="true" />
            {isHi ? t.atAGlanceHi : t.atAGlance}
          </h2>
          <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { field: glance?.lagna, suffix: '' },
              { field: glance?.moonRashi, suffix: '' },
              {
                field: {
                  value: glance?.nakshatra?.value ? `${glance.nakshatra.value}${glance.nakshatra.pada ? ` · P${glance.nakshatra.pada}` : ''}` : null,
                  labelKey: 'nakshatra',
                },
                suffix: '',
              },
              {
                field: {
                  value: glance?.mahadasha?.value ? `${glance.mahadasha.value}` : null,
                  labelKey: 'currentMahadasha',
                },
                suffix: glance?.mahadasha?.dates ? ` (${glance.mahadasha.dates})` : '',
              },
              { field: glance?.antardasha, suffix: '' },
            ].map((item) => (
              <div
                key={item.field?.labelKey || 'x'}
                data-testid={`insight-${item.field?.labelKey || 'x'}`}
                className="rounded-2xl border border-[#E5D7BC] bg-white/80 p-4 shadow-sm"
              >
                <dt className="text-[9px] font-mono-data font-bold uppercase tracking-[0.14em] text-[#8E6F1D]">
                  {item.field?.labelKey ? (isHi ? t[`${item.field.labelKey}Hi`] : t[item.field.labelKey]) : ''}
                  {timeNote && (item.field?.labelKey === 'lagna' || item.field?.labelKey === 'currentMahadasha') && (
                    <span className="ml-1.5 text-[8px] text-orange-600 dark:text-orange-400 font-mono-data font-bold">
                      ({isHi ? t.referenceOnlyHi : t.referenceOnly})
                    </span>
                  )}
                </dt>
                <dd className="mt-1 font-editorial text-lg font-bold leading-tight">
                  {gl(item.field as any)}
                  <span className="text-[10px] font-mono-data font-semibold text-[#696256]">{item.suffix}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* WHAT IS ACTIVE NOW */}
        <div className="mt-8 rounded-3xl border border-[#8E6F1D]/25 bg-gradient-to-r from-[#FBF6EC] to-[#F6EFE0] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-editorial text-xl sm:text-2xl font-bold">
              {isHi ? t.whatIsActiveNowHi : t.whatIsActiveNow}
            </h2>
            <ClaimChip kind={state.state === 'READY' ? 'CALCULATED' : 'VALIDATION_PENDING'} t={t} isHi={isHi} />
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p className="text-[10px] font-mono-data font-bold uppercase tracking-[0.16em] text-[#8E6F1D]">
                {isHi ? t.currentMahadashaHi : t.currentMahadasha}
              </p>
              <p className="font-editorial text-3xl font-bold text-[#8E6F1D]">
                {glance?.mahadasha?.value || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono-data font-bold uppercase tracking-[0.16em] text-[#8E6F1D]">
                {isHi ? t.currentAntardashaHi : t.currentAntardasha}
              </p>
              <p className="font-editorial text-3xl font-bold text-[#1C1917]">
                {glance?.antardasha?.value || '—'}
              </p>
            </div>
            {glance?.mahadasha?.dates && (
              <p className="text-xs font-mono-data text-[#57524A] pb-1">{glance.mahadasha.dates}</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              ref={whyButtonRef}
              onClick={openWhy}
              aria-expanded={whyOpen}
              aria-controls="kundli-why-drawer"
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl bg-[#8E6F1D] hover:bg-[#785E18] text-white text-xs font-mono-data font-bold shadow transition-colors"
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              {isHi ? t.whyBtnHi : t.whyBtn}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${whyOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleAskAboutThis}
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl border border-[#8E6F1D]/40 hover:border-[#8E6F1D] bg-white text-[#8E6F1D] text-xs font-mono-data font-bold transition-colors"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              {isHi ? t.askAboutThisHi : t.askAboutThis}
            </button>
            <Link
              href={`/ask?chart=${encodeURIComponent(record.id)}&dasha=${encodeURIComponent(periodString)}&question=${encodeURIComponent(defaultQuestion)}&lang=${encodeURIComponent(lang)}`}
              onClick={handleAskPandit}
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl text-[#A6461D] hover:underline underline-offset-4 text-xs font-mono-data font-bold"
            >
              <User className="w-4 h-4" aria-hidden="true" />
              {isHi ? t.askPanditHi : t.askPandit} →
            </Link>
          </div>
        </div>

        {/* WHY DRAWER */}
        {whyOpen && (
          <div
            id="kundli-why-drawer"
            role="region"
            aria-labelledby="kundli-why-title"
            className="mt-5 rounded-3xl border border-[#8E6F1D]/30 bg-white/90 p-5 sm:p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="kundli-why-title" className="font-editorial text-xl font-bold">
                  {isHi ? t.whyTitleHi : t.whyTitle}
                </h3>
                <p className="mt-1 text-xs text-[#696256]">{isHi ? t.whyIntroHi : t.whyIntro}</p>
              </div>
              <button
                type="button"
                onClick={closeWhy}
                aria-label="Close WHY drawer"
                className="min-h-11 min-w-11 rounded-xl border border-black/10 text-[#696256] hover:text-black text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <ol className="mt-4 space-y-3">
              {whySteps.map((step, i) => (
                <li
                  key={`${step.textKey}-${i}`}
                  data-testid={`why-step-${i}`}
                  className="flex items-start gap-3 p-3 rounded-2xl border border-black/[0.06] bg-[#FAF7F2]"
                >
                  <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-[#8E6F1D]/15 text-[#8E6F1D] text-[11px] font-mono-data font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-6">
                      {fill(isHi ? (t[`${step.textKey}Hi`] || t[step.textKey]) : t[step.textKey], step.values)}
                    </p>
                    <div className="mt-1">
                      <ClaimChip
                        kind={
                          step.classification === 'CALCULATED_FACT'
                            ? 'CALCULATED'
                            : step.classification === 'DERIVED_FACT'
                              ? 'DERIVED'
                              : step.classification === 'TRADITIONAL_RULE'
                                ? 'TRADITIONAL'
                                : step.classification === 'READING'
                                  ? 'SCHOLAR_JUDGEMENT'
                                  : 'VALIDATION_PENDING'
                        }
                        t={t}
                        isHi={isHi}
                      />
                      <span className="ml-2 text-[9px] font-mono-data font-bold tracking-wider text-[#8E6F1D]/70" data-testid={`why-classification-${i}`}>
                        {step.classification}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => setShowTechnical((v) => !v)}
              aria-expanded={showTechnical}
              aria-controls="kundli-why-technical"
              className="mt-4 inline-flex min-h-11 items-center gap-2 px-3.5 py-2 rounded-xl border border-black/10 text-[10px] font-mono-data font-bold text-[#696256] hover:text-black hover:border-black/30 transition-colors"
            >
              {isHi ? t.showTechnicalHi : t.showTechnical}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTechnical ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {showTechnical && (
              <div
                id="kundli-why-technical"
                className="mt-3 p-4 rounded-2xl bg-[#0E101D] text-[#D1C9BF] font-mono-data text-[11px] space-y-2 overflow-x-auto"
              >
                <p className="font-bold text-[#F0C968] uppercase tracking-wider text-[10px]">
                  {isHi ? t.technicalTitleHi : t.technicalTitle}
                </p>
                {technical.moonLongitude && (
                  <p>{isHi ? t.technicalMoonLongHi : t.technicalMoonLong}: <strong className="text-[#7EE787]">{technical.moonLongitude}°</strong></p>
                )}
                {technical.startingBalance && (
                  <p>{isHi ? t.technicalBalanceHi : t.technicalBalance}: <strong>{technical.startingBalance}</strong></p>
                )}
                {technical.engineVersion && (
                  <p>{isHi ? t.technicalEngineHi : t.technicalEngine}: {technical.engineVersion}</p>
                )}
                {technical.ayanamshaName && (
                  <p>{isHi ? t.technicalAyanamshaHi : t.technicalAyanamsha}: {technical.ayanamshaName} {technical.ayanamshaValue !== null ? `(${technical.ayanamshaValue.toFixed(6)}°)` : ''}</p>
                )}
                {technical.astronomyProvider.providerId && (
                  <p>
                    {isHi ? t.technicalProviderHi : t.technicalProvider}: {technical.astronomyProvider.providerId} ·{' '}
                    {technical.astronomyProvider.kernel || ''} · {technical.astronomyProvider.validationStatus || ''}
                  </p>
                )}
                {technical.conventionSummaryLines.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <p className="font-bold text-[#F0C968] text-[10px]">{isHi ? t.technicalConventionsHi : t.technicalConventions}:</p>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5">
                      {technical.conventionSummaryLines.slice(0, 5).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <p className="mt-4 text-[10px] text-[#8B8478] italic">
              {isHi ? t.legendNoteHi : t.legendNote}
            </p>
          </div>
        )}

        {/* RASHI & NAVAMSHA CHART (D1 / D9) — Prominently presented Kundli */}
        <div data-testid="kundli-first-chart-card" className="mt-6 rounded-3xl border border-[#D4C7B0] bg-[#FFFDF9] dark:bg-[#121422] p-5 sm:p-7 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#EADFCB] dark:border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#8E6F1D] dark:text-[#E6C665]" />
                <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#1C1917] dark:text-[#F3EFE6]">
                  {isHi
                    ? (activeVarga === 1 ? 'जन्म कुण्डली (लग्न चक्र — D1)' : 'नवांश कुण्डली (भाग्य चक्र — D9)')
                    : (activeVarga === 1 ? 'Rashi Kundli (Lagna Chart — D1)' : 'Navamsha Kundli (D9 Chart)')}
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#696256] dark:text-[#A8A29E]">
                {isHi
                  ? `लग्न: ${record.snapshot.lagna?.rashiName || record.snapshot.lagna?.rashiEn || ''} (${record.snapshot.lagna?.degreeStr || ''}) · लाहिरी अयनांश · उत्तर भारतीय पद्धति`
                  : `Lagna: ${record.snapshot.lagna?.rashiEn || record.snapshot.lagna?.rashiName || ''} (${record.snapshot.lagna?.degreeStr || ''}) · Lahiri Ayanamsha · North Indian Vedic Layout`}
              </p>
            </div>

            {/* Varga Selector: D1 vs D9 */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F0E8D8] dark:bg-white/5 border border-[#DACFBE] dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveVarga(1)}
                data-testid="chart-tab-d1"
                className={`px-3 py-1 text-xs font-mono-data font-bold rounded-lg transition-colors ${
                  activeVarga === 1
                    ? 'bg-[#8E6F1D] text-white shadow-xs'
                    : 'text-[#696256] dark:text-[#A8A29E] hover:text-[#1C1917]'
                }`}
              >
                D1 · {isHi ? 'लग्न' : 'Rashi'}
              </button>
              <button
                type="button"
                onClick={() => setActiveVarga(9)}
                data-testid="chart-tab-d9"
                className={`px-3 py-1 text-xs font-mono-data font-bold rounded-lg transition-colors ${
                  activeVarga === 9
                    ? 'bg-[#8E6F1D] text-white shadow-xs'
                    : 'text-[#696256] dark:text-[#A8A29E] hover:text-[#1C1917]'
                }`}
              >
                D9 · {isHi ? 'नवांश' : 'Navamsha'}
              </button>
            </div>
          </div>

          {/* SVG Kundli Chart */}
          <div className="mt-6 flex justify-center items-center">
            <div className="w-full max-w-[340px] aspect-square flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#0D0A1E] border border-[#E5D7BC] dark:border-[#21262d] shadow-xs">
              <NorthIndianChart kundali={displayedChart} theme="light" size={320} />
            </div>
          </div>

          {/* Planet placements quick summary strip */}
          {Array.isArray(record.snapshot.planetsArray) && record.snapshot.planetsArray.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#EADFCB] dark:border-white/10">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {record.snapshot.planetsArray.map((p: any) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-white/5 border border-[#E5D7BC] dark:border-white/10 text-[11px]"
                  >
                    <span className="font-bold text-[#8E6F1D] dark:text-[#E6C665]">{p.name}</span>
                    <span className="text-[#696256] dark:text-[#A8A29E] font-mono-data">
                      {p.rashiEn || p.rashiName} ({p.degreeStr || `${Math.floor((p.degrees || 0) % 30)}°`})
                    </span>
                    {p.isRetrograde && (
                      <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 font-mono-data">[R]</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educational / Pattern placeholder note — preserves honest disclosure */}
          <div className="mt-4 pt-3 border-t border-dashed border-[#E5D7BC] dark:border-white/10 text-center">
            <p className="text-[11px] text-[#8B8478] dark:text-[#A8A29E]">
              {isHi ? t.patternPlaceholderHi : t.patternPlaceholder}
            </p>
          </div>
        </div>

        {/* SAVE MOMENT (§14) — only for user-created charts, after value delivered */}
        {isUserCreated && (
          <div className="mt-6 rounded-3xl border border-[#8E6F1D]/30 bg-white/80 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-editorial text-lg font-bold">{isHi ? t.saveKundliHi : t.saveKundli}</h2>
              <p className="mt-1 text-xs text-[#57524A] max-w-lg">{isHi ? t.savePreambleHi : t.savePreamble}</p>
              <p className="mt-1 text-[10px] font-mono-data text-[#8E6F1D]">
                {isHi ? t.saveBenefitTitleHi : t.saveBenefitTitle} {isHi ? t.saveBenefitsHi : t.saveBenefits}
              </p>
            </div>
            {persistence === 'SAVED' ? (
              <Link
                href="/dashboard"
                data-testid="save-kundli-done"
                className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/10 border border-emerald-600/40 text-emerald-700 text-xs font-mono-data font-bold"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                {isHi ? t.savedToMySpaceHi : t.savedToMySpace}
              </Link>
            ) : (
              <div className="flex flex-col items-end gap-2">
                {saveError && (
                  <p
                    data-testid="save-failed"
                    role="alert"
                    className="max-w-xs text-[10px] font-mono-data font-bold text-rose-700 dark:text-rose-400"
                  >
                    {isHi ? t.saveFailedHi : t.saveFailed}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={persistence === 'SAVING'}
                  data-testid="save-kundli"
                  className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E6F1D] hover:bg-[#785E18] text-white text-xs font-mono-data font-bold shadow transition-colors disabled:opacity-60"
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  {persistence === 'SAVING'
                    ? (isHi ? t.savingHi : t.saving)
                    : (isHi ? t.saveKundliHi : t.saveKundli)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* EXPLORE MY CHART — deeper engine content remains below, untouched */}
        <div className="mt-8 text-center">
          <a
            href="#kundli-explore"
            onClick={() => chitiSensory.playTick()}
            data-testid="explore-my-chart"
            className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-xl border border-[#8E6F1D]/40 text-[#8E6F1D] hover:border-[#8E6F1D] text-xs font-mono-data font-bold transition-colors"
          >
            {isHi ? t.exploreMyChartHi : t.exploreMyChart}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
