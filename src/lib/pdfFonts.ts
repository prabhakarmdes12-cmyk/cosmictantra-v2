import type { jsPDF } from 'jspdf';

/**
 * In-memory cache for base64 encoded font data to avoid repeated network fetches.
 */
let cachedRegularBase64: string | null = null;
let cachedBoldBase64: string | null = null;
let fontLoadPromise: Promise<boolean> | null = null;

/**
 * Safely converts an ArrayBuffer to a base64 string using chunking.
 * This prevents Maximum Call Stack Size Exceeded errors that occur when
 * applying String.fromCharCode to large Uint8Arrays directly.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, bytes.length);
    let chunk = '';
    for (let j = i; j < end; j += 1) {
      chunk += String.fromCharCode(bytes[j]);
    }
    binary += chunk;
  }

  if (typeof window === 'undefined' || typeof window.btoa !== 'function') {
    throw new Error('PDF font encoding is only available in the browser.');
  }
  return window.btoa(binary);
}

/**
 * Loads font data from public assets and caches the base64 representation.
 */
async function loadFontAsBase64(fontUrl: string): Promise<string> {
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch font from ${fontUrl}: HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

/**
 * Pre-fetches and caches the Devanagari fonts in memory.
 */
export async function preloadDevanagariFonts(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!fontLoadPromise) {
    fontLoadPromise = Promise.all([
      cachedRegularBase64
        ? Promise.resolve(cachedRegularBase64)
        : loadFontAsBase64('/fonts/NotoSansDevanagari-Regular.ttf'),
      cachedBoldBase64
        ? Promise.resolve(cachedBoldBase64)
        : loadFontAsBase64('/fonts/NotoSansDevanagari-Bold.ttf'),
    ]).then(([regular, bold]) => {
      cachedRegularBase64 = regular;
      cachedBoldBase64 = bold;
      return true;
    }).catch((error) => {
      fontLoadPromise = null;
      console.warn('[pdfFonts] Unable to preload Devanagari fonts:', error);
      return false;
    });
  }

  return fontLoadPromise;
}

/**
 * Registers Noto Sans Devanagari (Regular and Bold) with the provided jsPDF document instance.
 * 
 * If registration succeeds, returns true.
 * If fetching or registration fails, catches gracefully, logs a warning, and returns false,
 * allowing PDF generation to safely fall back to Latin fonts (e.g. helvetica).
 */
export async function registerDevanagariFont(doc: jsPDF): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const loaded = await preloadDevanagariFonts();
    if (!loaded || !cachedRegularBase64 || !cachedBoldBase64) return false;

    // 2. Register Regular font in Virtual File System (VFS)
    doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', cachedRegularBase64);
    doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');

    // 3. Register Bold font in Virtual File System (VFS)
    doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', cachedBoldBase64);
    doc.addFont('NotoSansDevanagari-Bold.ttf', 'NotoSansDevanagari', 'bold');

    return true;
  } catch (error) {
    console.warn('[pdfFonts] Devanagari font registration failed, falling back to standard font:', error);
    return false;
  }
}

/**
 * Helper to determine the appropriate font family based on language and font availability.
 */
export function getPdfFontFamily(lang: string, isDevanagariRegistered: boolean): string {
  if (lang === 'hi' && isDevanagariRegistered) {
    return 'NotoSansDevanagari';
  }
  return 'helvetica';
}
