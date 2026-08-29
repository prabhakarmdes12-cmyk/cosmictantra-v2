/**
 * CALCULATION VERSIONING (PROGRAM 18)
 * ===================================
 * Every canonical snapshot carries the versions of the engines, conventions and
 * rulesets that produced it, so a stored Kundli / report remains reproducible
 * after an engine upgrade. Historical results are NEVER silently altered;
 * "Recalculate using latest engine" is an explicit, separate action.
 */

export const ENGINE_VERSION = '1.0.0';       // canonical astronomy engine (astrologyEngine.js)
export const PRO_ENGINE_VERSION = '2.0.0';   // professional derivation engines (src/lib/pro)
export const CONVENTION_VERSION = '1.0.0';   // convention presets & variant math
export const RULESET_VERSION = '1.0.0';      // yoga/dosha + interpretation rulesets

export function versionStamp() {
  return {
    engineVersion: ENGINE_VERSION,
    proEngineVersion: PRO_ENGINE_VERSION,
    conventionVersion: CONVENTION_VERSION,
    rulesetVersion: RULESET_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

/** True if a stored stamp was produced by the current engine set. */
export function isCurrent(stamp) {
  if (!stamp) return false;
  return stamp.engineVersion === ENGINE_VERSION
    && stamp.proEngineVersion === PRO_ENGINE_VERSION
    && stamp.conventionVersion === CONVENTION_VERSION
    && stamp.rulesetVersion === RULESET_VERSION;
}

export default { ENGINE_VERSION, PRO_ENGINE_VERSION, CONVENTION_VERSION, RULESET_VERSION, versionStamp, isCurrent };
