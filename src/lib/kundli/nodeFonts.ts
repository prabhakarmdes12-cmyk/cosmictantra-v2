/**
 * Node-side Devanagari font registration for jsPDF (test/tooling only).
 *
 * The browser path fetches /fonts/*.ttf via fetch; in Node tests there is
 * no server, so we read the TTFs from disk and register them the same way.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { jsPDF } from 'jspdf';

function arrayBufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export interface NodeFontRegistration {
  regular: boolean;
  bold: boolean;
  fontName: string;
}

/**
 * Registers Noto Sans Devanagari (regular + bold) on the given jsPDF doc
 * by reading public/fonts from disk. Returns which variants registered.
 */
export function registerDevanagariFontsNode(doc: jsPDF, publicDir: string = path.join(process.cwd(), 'public')): NodeFontRegistration {
  const fontName = 'devanagari';
  let regular = false;
  let bold = false;

  const reg = path.join(publicDir, 'fonts', 'NotoSansDevanagari-Regular.ttf');
  const boldPath = path.join(publicDir, 'fonts', 'NotoSansDevanagari-Bold.ttf');

  if (fs.existsSync(reg)) {
    doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', arrayBufferToBase64(fs.readFileSync(reg)));
    doc.addFont('NotoSansDevanagari-Regular.ttf', fontName, 'normal');
    regular = true;
  }
  if (fs.existsSync(boldPath)) {
    doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', arrayBufferToBase64(fs.readFileSync(boldPath)));
    doc.addFont('NotoSansDevanagari-Bold.ttf', fontName, 'bold');
    bold = true;
  }
  return { regular, bold, fontName };
}
