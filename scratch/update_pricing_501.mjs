import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/lib/translations.js',
  'src/components/ConsultationModal.jsx',
  'src/components/ConsultationOffer.jsx',
  'src/components/AskBetterQuestions.jsx',
  'src/components/SampleConsultation.jsx',
  'src/components/ChatBox.tsx',
  'src/components/MyDaysPanchang.tsx',
  'src/components/QuestionRefiner.tsx',
  'src/lib/libraryContent.js',
  'src/app/page.tsx',
  'src/app/ask/page.tsx'
];

for (const relPath of filesToUpdate) {
  const fullPath = path.resolve('D:/Projects/Cosmic tantra AUGUST 2026', relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const original = content;

    // Replace pricing strings
    content = content.replace(/₹199/g, '₹501');
    content = content.replace(/₹१९९/g, '₹५०१');
    content = content.replace(/19900/g, '50100');
    content = content.replace(/199/g, (match, offset, str) => {
      // Avoid replacing years like 1995 or 1992
      const before = str.slice(Math.max(0, offset - 5), offset);
      const after = str.slice(offset + 3, offset + 6);
      if (before.includes('1995') || before.includes('1992') || after.includes('-05') || after.includes('-06')) {
        return match;
      }
      return '501';
    });

    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated pricing in ${relPath}`);
    }
  }
}
