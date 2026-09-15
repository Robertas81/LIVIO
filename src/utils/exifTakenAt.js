// Extract the EXIF DateTimeOriginal timestamp from a JPEG file's raw bytes.
// EXIF datetimes ("YYYY:MM:DD HH:MM:SS") carry no timezone, so they are read
// as local time (the capture device's wall clock). Returns an ISO string
// (UTC) or null when the file has no EXIF capture date.

const APP1 = 0xe1;

// Locate the APP1 "Exif" segment and return the TIFF block's byte range.
function findTiffBlock(view) {
  let offset = 2; // skip JPEG SOI marker
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xda) return null; // image data reached — no APP1 found
    const length = view.getUint16(offset + 2);
    if (marker === APP1 && view.getUint32(offset + 4) === 0x45786966) {
      // "Exif\0\0" header is 6 bytes; TIFF block follows
      return { start: offset + 10, end: Math.min(offset + 2 + length, view.byteLength) };
    }
    offset += 2 + length;
  }
  return null;
}

function findDateTimeOriginal(view, tiffStart, tiffEnd) {
  const little = view.getUint16(tiffStart) === 0x4949; // "II" = little endian
  if (view.getUint16(tiffStart + 2, little) !== 42) return null;

  // Walk IFD0 looking for the Exif sub-IFD pointer (tag 0x8769).
  let exifIfd = null;
  const ifd0 = tiffStart + view.getUint32(tiffStart + 4, little);
  if (ifd0 + 2 > tiffEnd) return null;
  const ifd0Count = view.getUint16(ifd0, little);
  for (let i = 0; i < ifd0Count; i++) {
    const e = ifd0 + 2 + i * 12;
    if (e + 12 > tiffEnd) break;
    if (view.getUint16(e, little) === 0x8769) {
      exifIfd = tiffStart + view.getUint32(e + 8, little);
      break;
    }
  }
  if (exifIfd == null || exifIfd + 2 > tiffEnd) return null;

  // Walk the Exif sub-IFD looking for DateTimeOriginal (tag 0x9003).
  const count = view.getUint16(exifIfd, little);
  for (let i = 0; i < count; i++) {
    const e = exifIfd + 2 + i * 12;
    if (e + 12 > tiffEnd) break;
    if (view.getUint16(e, little) !== 0x9003) continue;
    if (view.getUint16(e + 2, little) !== 2) continue; // must be ASCII
    const valOffset = tiffStart + view.getUint32(e + 8, little);
    if (valOffset + 20 > tiffEnd) continue;
    let s = "";
    for (let j = 0; j < 20; j++) {
      const c = view.getUint8(valOffset + j);
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    const m = s.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

export async function readExifDateTime(file) {
  if (!file) return null;
  const head = await file.slice(0, 131072).arrayBuffer();
  const view = new DataView(head);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // not a JPEG
  const tiff = findTiffBlock(view);
  if (!tiff) return null;
  return findDateTimeOriginal(view, tiff.start, tiff.end);
}