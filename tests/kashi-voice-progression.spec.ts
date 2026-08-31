import { test, expect } from '@playwright/test';
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useKashiVoice } from '../src/lib/ai/useKashiVoice';

/**
 * The speech layer's side of reader progression.
 *
 * Browser audio cannot be exercised in this sandbox (no Chromium), so the
 * Web Speech API is replaced by a deterministic fake and the hook is rendered
 * headlessly. What is proved here is the CONTRACT the reader depends on:
 *   - the session's speed reaches the utterance rate;
 *   - onDone fires exactly once when a message has finished being spoken;
 *   - onDone never fires after stop() — which is what makes it safe to hook
 *     "read the next stored passage" to speech completion.
 *
 * Not proved here: actual audible output, voice selection, autoplay policy.
 */

interface FakeUtterance {
  text: string;
  rate: number;
  pitch: number;
  lang?: string;
  voice?: unknown;
  volume?: number;
  onstart?: (() => void) | null;
  onend?: (() => void) | null;
  onerror?: (() => void) | null;
}

function installFakeSpeech(options?: { failWith?: 'error' | 'end'; endAfterMs?: number }) {
  const spoken: FakeUtterance[] = [];
  let cancelled = 0;

  class Utterance implements FakeUtterance {
    text: string;
    rate = 1;
    pitch = 1;
    volume = 1;
    lang = '';
    voice = null;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }

  const synth = {
    speaking: false,
    paused: false,
    getVoices: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    resume: () => {},
    speak(utterance: FakeUtterance) {
      spoken.push(utterance);
      // Finish asynchronously, like a real engine would.
      setTimeout(
        () => {
          utterance.onstart?.();
          if (options?.failWith === 'error') utterance.onerror?.();
          else utterance.onend?.();
        },
        options?.endAfterMs ?? 0,
      );
    },
    cancel() {
      cancelled += 1;
    },
  };

  const win = {
    speechSynthesis: synth,
    setTimeout: (fn: (...args: any[]) => void, ms?: number) => setTimeout(fn, ms),
    clearTimeout: (id: any) => clearTimeout(id),
    setInterval: (fn: (...args: any[]) => void, ms?: number) => setInterval(fn, ms),
    clearInterval: (id: any) => clearInterval(id),
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  };

  (globalThis as any).window = win;
  (globalThis as any).SpeechSynthesisUtterance = Utterance;
  return { spoken, synth, cancelledCount: () => cancelled };
}

/** Render a probe component so the hook is exercised inside a real renderer. */
function renderVoiceProbe() {
  const api: { current: ReturnType<typeof useKashiVoice> | null } = { current: null };
  function Probe() {
    api.current = useKashiVoice();
    return null;
  }
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(Probe));
  });
  return {
    api: () => api.current!,
    unmount: () => act(() => renderer.unmount()),
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('the reading session speed is applied to the utterance rate', async () => {
  const fake = installFakeSpeech();
  const probe = renderVoiceProbe();

  await act(async () => {
    probe.api().speak('कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।', { rate: 1.5 });
  });
  await act(async () => {
    await wait(30);
  });

  expect(fake.spoken.length).toBeGreaterThan(0);
  // Base prosody is 0.98× for a plain sentence; 1.5× is the session speed.
  for (const utterance of fake.spoken) {
    expect(utterance.rate).toBeCloseTo(0.98 * 1.5, 2);
  }
  probe.unmount();
});

test('a slower session speed produces a slower utterance', async () => {
  const fake = installFakeSpeech();
  const probe = renderVoiceProbe();
  await act(async () => {
    probe.api().speak('कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।', { rate: 0.8 });
  });
  await act(async () => {
    await wait(30);
  });
  expect(fake.spoken.length).toBeGreaterThan(0);
  for (const utterance of fake.spoken) {
    expect(utterance.rate).toBeCloseTo(0.98 * 0.8, 2);
    expect(utterance.rate).toBeLessThan(0.98); // strictly slower than the default
  }
  probe.unmount();
});

test('an out-of-range speed is clamped to what an engine can do', async () => {
  const fake = installFakeSpeech();
  const probe = renderVoiceProbe();
  await act(async () => {
    probe.api().speak('कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।', { rate: 1000 });
  });
  await act(async () => {
    await wait(30);
  });
  expect(fake.spoken.length).toBeGreaterThan(0);
  for (const utterance of fake.spoken) expect(utterance.rate).toBeLessThanOrEqual(2);
  probe.unmount();
});

test('onDone fires once when the message has finished speaking', async () => {
  // A realistic engine: each utterance takes ~1.5 s to deliver.
  const fake = installFakeSpeech({ endAfterMs: 1_500 });
  const probe = renderVoiceProbe();
  let done = 0;
  await act(async () => {
    probe.api().speak('कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि। योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते।', { onDone: () => { done += 1; } });
  });
  // Let every queued chunk (each ~1.5 s, plus the 140 ms inter-chunk gap) run.
  await act(async () => {
    await wait(8_000);
  });
  expect(fake.spoken.length).toBeGreaterThan(0);
  expect(done).toBe(1);
  probe.unmount();
});

test('stop() cancels the queue and onDone never fires', async () => {
  const fake = installFakeSpeech();
  const probe = renderVoiceProbe();
  let done = 0;

  // A multi-chunk message, so a chunk is still pending when we stop.
  await act(async () => {
    probe.api().speak('कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि। योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते।', { onDone: () => { done += 1; } });
  });
  await act(async () => {
    await wait(30);
  });
  const spokenBeforeStop = fake.spoken.length;
  expect(spokenBeforeStop).toBeGreaterThan(0);

  // This is the pause path: the reader must not advance after a stop.
  await act(async () => {
    probe.api().stop();
  });
  await act(async () => {
    await wait(1200);
  });

  expect(fake.cancelledCount()).toBeGreaterThan(0);
  expect(fake.spoken.length).toBe(spokenBeforeStop); // nothing more was spoken
  expect(done).toBe(0);
  probe.unmount();
});

test('muting silences later turns (no utterance is queued)', async () => {
  const fake = installFakeSpeech();
  const probe = renderVoiceProbe();

  await act(async () => {
    probe.api().toggleVoice();
  });
  await act(async () => {
    probe.api().speak('कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।');
  });
  await act(async () => {
    await wait(50);
  });
  expect(fake.spoken).toHaveLength(0);

  await act(async () => {
    probe.api().toggleVoice(); // back on
  });
  await act(async () => {
    probe.api().speak('कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।');
  });
  await act(async () => {
    await wait(50);
  });
  expect(fake.spoken.length).toBeGreaterThan(0);
  probe.unmount();
});

test('an utterance that ERRORS is not treated as "read" (onDone does not fire)', async () => {
  // A device with no working voice must not race ahead through a reading.
  const fake = installFakeSpeech({ failWith: 'error' });
  const probe = renderVoiceProbe();
  let done = 0;

  await act(async () => {
    probe.api().speak('पहला वाक्य। दूसरा वाक्य। तीसरा वाक्य।', { onDone: () => { done += 1; } });
  });
  await act(async () => {
    await wait(1200);
  });

  expect(fake.spoken.length).toBeGreaterThan(0); // it did try to speak
  expect(done).toBe(0); // …but never claimed the passage was delivered
  probe.unmount();
});

test('an engine that "finishes" instantly does not advance the reading', async () => {
  // No installed voice: Chrome fires onend immediately and nothing is heard.
  // Advancing here would race through a whole chapter in silence.
  const fake = installFakeSpeech({ endAfterMs: 0 });
  const probe = renderVoiceProbe();
  let done = 0;

  await act(async () => {
    probe.api().speak(
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि। योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते।',
      { onDone: () => { done += 1; } },
    );
  });
  await act(async () => {
    await wait(2_000);
  });

  expect(fake.spoken.length).toBeGreaterThan(0); // it did try to speak
  expect(done).toBe(0); // …but a 0 ms "delivery" is not a finished reading
  probe.unmount();
});
