import { test, expect } from '@playwright/test';
import { parseBirthTime, parseBirthDate, resolveBirthCity } from '../src/lib/ai/intakeParsing';
import { cleanForSpeech, chunkTextForSpeech } from '../src/lib/ai/useKashiVoice';
import { getChatSafetyReply } from '../src/lib/ai/chatSafety';
import * as fs from 'fs';

for (const [input, expected] of [
  ['06:00 (प्रातः)', '06:00'], ['10:30 (सुबह)', '10:30'], ['18:00 (सायं)', '18:00'],
  ['12:00 (दोपहर)', '12:00'], ['21:00 (रात्रि)', '21:00'],
  ['raat 2 baje', '02:00'], ['रात 2 बजे', '02:00'], ['रात 10:30', '22:30'],
  ['शाम 7 बजे', '19:00'], ['shaam 7 baje', '19:00'], ['2.20', '02:20'],
  ['2 20', '02:20'], ['02:20:30', '02:20:30'], ['०२:२०:३०', '02:20:30'],
  ['12 am', '00:00'], ['12 pm', '12:00'], ['2 p.m.', '14:00'], ['730', '07:30'],
]) {
  test(`birth time: ${input}`, () => expect(parseBirthTime(input).time24).toBe(expected));
}
for (const input of ['24:30', '24:00', '25:00', '2:60', '14 pm', '02:20:60', 'unknown']) {
  test(`reject invalid time: ${input}`, () => expect(parseBirthTime(input).ok).toBe(false));
}
test('date normalization and impossible dates', () => {
  expect(parseBirthDate('15 अगस्त १९९६').iso).toBe('1996-08-15');
  expect(parseBirthDate('29/02/1995').ok).toBe(false);
  expect(parseBirthDate('2999-01-01').ok).toBe(false);
});
test('city abbreviations and Hindi birthplace', () => {
  expect(resolveBirthCity('bilaspur,cg').primary?.id).toBe('bilaspur-cg');
  expect(resolveBirthCity('पटना बिहार').primary?.id).toBe('patna');
});
test('speech strips emoji and bounds unpunctuated utterances', () => {
  expect(cleanForSpeech('प्रणाम 🙏')).toBe('प्रणाम');
  const text = 'This is a long sentence without punctuation '.repeat(40);
  const chunks = chunkTextForSpeech(text);
  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks.every(c => c.length <= 260)).toBe(true);
});
for (const query of ['I want to kill myself', 'जान दे दूंगी', 'जान दे दूँगी', 'मरना चाहती हूँ', 'severe chest pain', 'he is beating me']) {
  test(`crisis first gate: ${query}`, () => expect(getChatSafetyReply(query, 'en')).toBeTruthy());
}
test('ordinary sadness is not treated as an emergency', () => {
  expect(getChatSafetyReply('आज मन उदास है')).toBeNull();
});
test('both chat surfaces gate messages before intake and mood routing', () => {
  for (const [file, marker] of [
    ['AIGuruChatbotModal.tsx', '// State machine transitions'],
    ['FloatingAIGuruAvatar.tsx', '// Handle Guided Intake Step Machine'],
  ]) {
    const source = fs.readFileSync(`src/components/consultation/${file}`, 'utf8');
    expect(source.indexOf('const safetyReply = getChatSafetyReply')).toBeLessThan(source.indexOf(marker));
  }
});
test('floating intake never saves partially confirmed profile data', () => {
  const source = fs.readFileSync('src/components/consultation/FloatingAIGuruAvatar.tsx', 'utf8');
  expect(source).not.toContain('persistSeekerProfile({ birthDate:');
  expect(source).not.toContain('persistSeekerProfile({ birthTime:');
  expect(source).not.toContain('persistSeekerProfile({ ...next });');
});
