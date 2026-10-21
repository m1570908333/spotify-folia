const fs = require('node:fs');
const path = require('node:path');
const rate = 16000, seconds = 3, count = rate * seconds;
const buffer = Buffer.alloc(44 + count * 2);
buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4);
buffer.write('WAVEfmt ', 8); buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28);
buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
buffer.write('data', 36); buffer.writeUInt32LE(count * 2, 40);
for (let i = 0; i < count; i++) {
  const t = i / rate;
  const amplitude = .12 + .5 * Math.exp(-((t % .5) * 35));
  buffer.writeInt16LE(Math.round(Math.sin(t * Math.PI * 440) * amplitude * 32767), 44 + i * 2);
}
const output = path.resolve(process.argv[2] || path.join(__dirname, '../tests/jizura-test-audio.wav'));
fs.writeFileSync(output, buffer);
console.log(output);
