import { test, expect } from '@playwright/test';
import { professionalChart } from '../src/lib/pro/index.js';
import { WORKSPACE_PRESETS, buildCommandActions, inspectPlanet, PLANETS } from '../src/lib/pro/workbench.js';

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' };
const pro = () => professionalChart(BP);

test.describe('TRUST-04 — Workbench 2.0 presets & command actions', () => {
  test('all 7 workspace presets exist with non-empty panel layouts', () => {
    const ids = Object.keys(WORKSPACE_PRESETS);
    expect(ids).toEqual(expect.arrayContaining(['Natal', 'Marriage', 'Career', 'Child', 'Varshaphala', 'KP', 'Research']));
    for (const p of Object.values(WORKSPACE_PRESETS)) {
      expect(p.panels.length).toBeGreaterThan(0);
      for (const panel of p.panels) expect(panel.kind).toBeTruthy();
    }
  });

  test('command palette entries EXECUTE actions, not just navigate', () => {
    const actions = buildCommandActions();
    expect(actions.length).toBeGreaterThan(50);
    // every action carries a runnable descriptor with a type
    for (const a of actions) {
      expect(a.run).toBeTruthy();
      expect(a.run.type).toBeTruthy();
    }
    const types = [...new Set(actions.map((a) => a.run.type))];
    expect(types).toEqual(expect.arrayContaining(['applyPreset', 'openChart', 'addPanel', 'inspectPlanet', 'askKashi']));
    // cross-calc verbs exist for a planet
    expect(actions.some((a) => a.label === 'Saturn: show in D9')).toBe(true);
    expect(actions.some((a) => a.label === 'Saturn: Shadbala')).toBe(true);
    expect(actions.some((a) => a.label === 'Saturn: Ask Kashi')).toBe(true);
  });
});

test.describe('TRUST-04 — Planet inspector (cross-calculation from one snapshot)', () => {
  test('inspecting a planet returns facts + cross-calc from the single snapshot', () => {
    const d: any = inspectPlanet(pro(), 'Saturn');
    expect(d.name).toBe('Saturn');
    expect(d.facts.length).toBeGreaterThanOrEqual(5);
    // every fact cites a source
    for (const f of d.facts) expect(f.source).toBeTruthy();
    // cross-calc includes D9, D10 and Shadbala with real values
    const labels = d.cross.map((c: any) => c.label);
    expect(labels).toEqual(expect.arrayContaining(['D9 sign', 'D10 sign', 'Shadbala']));
    for (const c of d.cross) expect(c.value).toBeTruthy();
    expect(d.verbs).toEqual(expect.arrayContaining(['Show in D9', 'Show in D10', 'Shadbala', 'Ashtakavarga', 'Dashas', 'Transit', 'Ask Kashi']));
  });

  test('every planet is inspectable', () => {
    for (const pl of PLANETS) {
      const d: any = inspectPlanet(pro(), pl);
      expect(d.error).toBeFalsy();
      expect(d.facts.length).toBeGreaterThan(0);
    }
  });
});
