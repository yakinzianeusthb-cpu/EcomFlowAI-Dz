/**
 * The width and height of a PNG, JPEG or WebP picture, read from its header without decoding it (the server has no
 * image library). Used to check a photo against a service's size limit before sending it.
 */
export function imageDimensions(base64: string): { width: number; height: number } | null {
  const bytes = Buffer.from(base64, 'base64');
  return png(bytes) ?? jpeg(bytes) ?? webp(bytes);
}

const ascii = (bytes: Buffer, at: number, text: string) => bytes.length >= at + text.length && bytes.toString('latin1', at, at + text.length) === text;

function png(bytes: Buffer) {
  if (bytes.length < 24 || bytes[0] !== 0x89 || !ascii(bytes, 1, 'PNG') || !ascii(bytes, 12, 'IHDR')) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** the frame headers that carry the size (every SOFn but the DHT, JPG and DAC markers) */
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function jpeg(bytes: Buffer) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker === 0xff) { i += 1; continue; }
    // markers without a length
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
    if (SOF.has(marker)) {
      if (i + 9 > bytes.length) return null;
      return { width: bytes.readUInt16BE(i + 7), height: bytes.readUInt16BE(i + 5) };
    }
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  return null;
}

function webp(bytes: Buffer) {
  if (bytes.length < 25 || !ascii(bytes, 0, 'RIFF') || !ascii(bytes, 8, 'WEBP')) return null;
  if (ascii(bytes, 12, 'VP8L') && bytes[20] === 0x2f) {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (bytes.length < 30) return null;
  if (ascii(bytes, 12, 'VP8 ') && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (ascii(bytes, 12, 'VP8X')) return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
  return null;
}
