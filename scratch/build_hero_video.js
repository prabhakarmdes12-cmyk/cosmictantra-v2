const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

console.log('FFmpeg binary located at:', ffmpegPath);

const videoDir = path.join(__dirname, '..', 'hero video');
const publicDir = path.join(__dirname, '..', 'public');
const outputFile = path.join(publicDir, 'kashi-hero-video.mp4');

const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
console.log('Found video clips:', files);

// Create a file list for ffmpeg concat
const concatListPath = path.join(__dirname, 'concat_list.txt');
const fileLines = files.map(f => `file '${path.join(videoDir, f).replace(/\\/g, '/')}'`).join('\n');
fs.writeFileSync(concatListPath, fileLines);

console.log('Concat list created:\n', fileLines);

// Execute FFmpeg concat with re-encoding for seamless transitions
const command = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 22 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -an "${outputFile}"`;

console.log('Executing FFmpeg command:', command);

try {
  execSync(command, { stdio: 'inherit' });
  console.log('SUCCESS! Seamless hero video compiled to:', outputFile);
} catch (err) {
  console.error('FFmpeg compilation error:', err);
}
