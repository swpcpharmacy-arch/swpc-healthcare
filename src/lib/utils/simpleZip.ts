/**
 * Zero-dependency pure TypeScript ZIP generator (Store mode)
 * Since images (JPEG/PNG) and documents are already compressed,
 * storing them without deflate is extremely fast, 100% cross-platform,
 * and produces valid ZIP archives readable by Windows, macOS, Linux, iOS, and Android.
 */

// Simple CRC32 table
const crcTable = (() => {
  let c: number;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  filename: string;
  data: Uint8Array | string;
}

export function createZipArchive(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const fileParts: Uint8Array[] = [];
  const centralDirectoryParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const rawData = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const nameBytes = encoder.encode(entry.filename);
    const checksum = crc32(rawData);
    const size = rawData.length;

    // --- Local File Header (30 bytes + filename) ---
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);

    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true);          // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true);      // General purpose bit flag (UTF-8 filename)
    lv.setUint16(8, 0, true);           // Compression method (0 = store)
    lv.setUint16(10, 0, true);          // File last modification time
    lv.setUint16(12, 0, true);          // File last modification date
    lv.setUint32(14, checksum, true);   // CRC-32
    lv.setUint32(18, size, true);       // Compressed size
    lv.setUint32(22, size, true);       // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // Filename length
    lv.setUint16(28, 0, true);          // Extra field length
    localHeader.set(nameBytes, 30);

    fileParts.push(localHeader);
    fileParts.push(rawData);

    // --- Central Directory Header (46 bytes + filename) ---
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(cdHeader.buffer);

    cdv.setUint32(0, 0x02014b50, true); // Central directory signature
    cdv.setUint16(4, 20, true);          // Version made by
    cdv.setUint16(6, 20, true);          // Version needed
    cdv.setUint16(8, 0x0800, true);      // Flags (UTF-8)
    cdv.setUint16(10, 0, true);          // Compression (0 = store)
    cdv.setUint16(12, 0, true);          // Mod time
    cdv.setUint16(14, 0, true);          // Mod date
    cdv.setUint32(16, checksum, true);   // CRC-32
    cdv.setUint32(20, size, true);       // Comp size
    cdv.setUint32(24, size, true);       // Uncomp size
    cdv.setUint16(28, nameBytes.length, true); // Filename length
    cdv.setUint16(30, 0, true);          // Extra field length
    cdv.setUint16(32, 0, true);          // Comment length
    cdv.setUint16(34, 0, true);          // Disk number start
    cdv.setUint16(36, 0, true);          // Internal attributes
    cdv.setUint32(38, 0, true);          // External attributes
    cdv.setUint32(42, offset, true);     // Relative offset of local header
    cdHeader.set(nameBytes, 46);

    centralDirectoryParts.push(cdHeader);
    offset += localHeader.length + rawData.length;
  }

  // Calculate central directory size
  const centralDirSize = centralDirectoryParts.reduce((acc, part) => acc + part.length, 0);

  // --- End of Central Directory Record (22 bytes) ---
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD signature
  ev.setUint16(4, 0, true);          // Number of this disk
  ev.setUint16(6, 0, true);          // Disk where central directory starts
  ev.setUint16(8, entries.length, true);  // Number of central directory records on this disk
  ev.setUint16(10, entries.length, true); // Total number of central directory records
  ev.setUint32(12, centralDirSize, true); // Size of central directory
  ev.setUint32(16, offset, true);         // Offset of start of central directory
  ev.setUint16(20, 0, true);              // ZIP comment length

  // Combine into single Blob
  const allParts = [...fileParts, ...centralDirectoryParts, eocd];
  return new Blob(allParts as unknown as BlobPart[], { type: 'application/zip' });
}
