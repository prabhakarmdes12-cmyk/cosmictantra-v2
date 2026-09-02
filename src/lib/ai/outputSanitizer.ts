/**
 * KASHI SAHAYAK CHAT OUTPUT SANITIZER
 * -----------------------------------------------------------------------------
 * CHAT_INV_001: Raw unresolved tokens (undefined, null, NaN, [object Object],
 * INVALID_DATE, UNKNOWN) must NEVER reach user-visible text, audio, cards or chips.
 */

const UNRESOLVED_REGEX = /\b(undefined|null|NaN|\[object Object\]|INVALID_DATE|UNKNOWN)\b/gi;

/**
 * Checks if a string contains any prohibited raw unresolved tokens.
 */
export function containsUnresolvedTokens(input: string | null | undefined): boolean {
  if (!input) return false;
  return UNRESOLVED_REGEX.test(String(input));
}

/**
 * Sanitizes a plain string, replacing any stray internal or undefined tokens
 * with graceful, natural Hindi & bilingual fallback expressions.
 */
export function sanitizeString(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return 'इस समय यह जानकारी उपलब्ध नहीं है।';
  }

  let s = String(text);

  // Fix specific known failure patterns
  s = s.replace(/undefined\s*(?:to|–|-|से)\s*undefined/gi, 'इस समय राहुकाल की विश्वसनीय गणना उपलब्ध नहीं है।');
  s = s.replace(/undefined\s*बजे\s*तक/gi, 'निर्धारित समय तक');
  s = s.replace(/undefined\s*मिनट/gi, 'कुछ मिनट');
  s = s.replace(/\[object Object\]/g, '');

  // Generic token replacement
  s = s.replace(/\bundefined\b/gi, 'अनुपलब्ध');
  s = s.replace(/\bnull\b/gi, 'अज्ञात');
  s = s.replace(/\bNaN\b/gi, '—');
  s = s.replace(/\bINVALID_DATE\b/gi, 'मान्य तिथि');
  s = s.replace(/\bUNKNOWN\b/gi, 'सामान्य');

  return s.trim();
}

/**
 * Recursively sanitizes any object, array, or primitive returned to the chat UI.
 */
export function sanitizeChatOutput<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeString(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeChatOutput(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitizedObj[key] = sanitizeChatOutput(value);
    }
    return sanitizedObj as T;
  }

  return data;
}
