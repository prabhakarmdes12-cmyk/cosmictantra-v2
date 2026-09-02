import { test } from '@playwright/test';
import { generateKundliV41Pdf } from '../../src/lib/kundli/v40/pipelineV3';
import { auditHindiCompleteness } from '../../src/lib/kundli/v40/hindiCompleteness';
import { GOLDEN_BIRTH_INPUT } from './goldenCanonical';

for (const mode of ['CLIENT', 'PANDIT', 'SCHOLAR'] as const) {
  test(`audit ${mode}`, async () => {
    const result = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { locale: 'hi', mode, skipPdf: true });
    const audit = auditHindiCompleteness(result.report!, 'hi', 999999);
    console.log(JSON.stringify({ mode, inspected: audit.inspected, clean: audit.clean, exempt: audit.exempt, latinWords: audit.latinWords, findings: audit.findings }, null, 2));
  });
}
