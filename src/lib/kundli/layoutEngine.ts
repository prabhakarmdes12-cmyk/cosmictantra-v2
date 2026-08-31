/**
 * Kundli pipeline — pagination controller.
 *
 * The ONLY component allowed to create pages. Enforces:
 *  1. a hard page ceiling (maxPages) -> KUNDLI_PAGE_LIMIT_EXCEEDED
 *  2. progress: every placed block must advance the cursor (or be the
 *     first block on a fresh page) -> KUNDLI_PAGINATION_STALLED
 *  3. per-page character bookkeeping for blank-page detection.
 */

import { KundliError } from './errors';

export interface LayoutEngineOptions {
  maxPages: number;
  pageHeightMm?: number;
  pageWidthMm?: number;
  marginMm?: number;
  contentBottomMm?: number;
}

const DEFAULTS = { pageHeightMm: 297, pageWidthMm: 210, marginMm: 14, contentBottomMm: 280 };

export interface PlacedBlockInfo {
  page: number;
  /** y (mm) at which the block started. */
  y: number;
  /** Height in mm consumed on the current page. */
  height: number;
  pageIndexBefore: number;
}

export class PaginationController {
  private _page = 1;
  private _y: number;
  private _charsByPage: number[] = [0];
  private _blockCount = 0;
  readonly opts: Required<LayoutEngineOptions>;

  constructor(opts: LayoutEngineOptions) {
    this.opts = {
      maxPages: opts.maxPages,
      pageHeightMm: opts.pageHeightMm ?? DEFAULTS.pageHeightMm,
      pageWidthMm: opts.pageWidthMm ?? DEFAULTS.pageWidthMm,
      marginMm: opts.marginMm ?? DEFAULTS.marginMm,
      contentBottomMm: opts.contentBottomMm ?? DEFAULTS.contentBottomMm,
    };
    this._y = this.opts.marginMm;
  }

  get pageCount(): number {
    return this._page;
  }

  get cursorY(): number {
    return this._y;
  }

  get blockCount(): number {
    return this._blockCount;
  }

  get charsByPage(): number[] {
    return this._charsByPage.slice();
  }

  /** Content height available on one page. */
  get usableHeight(): number {
    return this.opts.contentBottomMm - this.opts.marginMm;
  }

  /** Register rendered text characters on the current page (blank detection). */
  recordChars(n: number): void {
    this._charsByPage[this._page - 1] += n;
  }

  /**
   * Creates the next physical page. The caller supplies `createPage` (which
   * calls the PDF library) and `drawChrome` (header/footer). Enforces the
   * page ceiling BEFORE creating the page so a limit violation can never
   * produce an over-limit artifact.
   */
  newPage(createPage: () => void, drawChrome?: (page: number) => void): void {
    if (this._page >= this.opts.maxPages) {
      throw new KundliError('KUNDLI_PAGE_LIMIT_EXCEEDED',
        `page count ${this._page} reached the configured ceiling ${this.opts.maxPages}`, {
          pageCount: this._page, maxPages: this.opts.maxPages,
        });
    }
    createPage();
    this._page += 1;
    this._y = this.opts.marginMm;
    this._charsByPage.push(0);
    drawChrome?.(this._page);
  }

  /**
   * Asserts that `heightMm` fits on the current page; creates a new page
   * when it does not. Returns the page on which the block will be drawn.
   *
   * The caller MUST pass `createPage` (the PDF library's addPage) so the
   * controller's page counter never desynchronises from the physical PDF:
   * a phantom page here would silently produce an artifact with fewer real
   * pages than the metrics claim.
   */
  ensureFits(heightMm: number, createPage?: () => void, drawChrome?: (page: number) => void): number {
    if (heightMm > this.usableHeight + 0.01) {
      throw new KundliError('KUNDLI_PAGINATION_STALLED',
        `block height ${heightMm.toFixed(1)}mm exceeds one usable page ${this.usableHeight.toFixed(1)}mm`, {
          blockHeightMm: heightMm, usableHeightMm: this.usableHeight,
        });
    }
    if (this._y + heightMm > this.opts.contentBottomMm + 0.01) {
      this.newPage(createPage ?? (() => {}), drawChrome);
    }
    return this._page;
  }

  /**
   * Advances the cursor after a block was drawn.
   * Throws KUNDLI_PAGINATION_STALLED when no vertical progress was made —
   * the renderer is spinning without producing content.
   */
  advance(renderedHeightMm: number): void {
    this._blockCount += 1;
    if (renderedHeightMm <= 0) {
      throw new KundliError('KUNDLI_PAGINATION_STALLED',
        'a block consumed zero vertical space (no progress)', {
          blockIndex: this._blockCount, page: this._page,
        });
    }
    this._y += renderedHeightMm;
  }

  /**
   * Convenience placement used by tests: ensures the block fits, then
   * advances the cursor. Throws on zero-height (stall) or over-limit pages.
   */
  place(heightMm: number, _label?: string): number {
    this.ensureFits(heightMm);
    this.advance(heightMm);
    return this._page;
  }

  /** Convenience: record metrics into a plain object (for the pipeline result). */
  toMetrics(): { pageCount: number; placedCharsByPage: number[]; blocksRendered: number } {
    return {
      pageCount: this._page,
      placedCharsByPage: this._charsByPage.slice(),
      blocksRendered: this._blockCount,
    };
  }
}
