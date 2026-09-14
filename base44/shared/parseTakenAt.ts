// Resolve the "taken at" timestamp for a photo: prefer real capture metadata,
// then fall back to a date embedded in the file name. Returns an ISO string
// (UTC) or null — never the upload time.

// Parse a capture date from a filename. Recognizes common photo-name
// patterns: 2024-05-12, 2024_05_12, 20240512, IMG_20240512_153045,
// 2024-05-12 15.30.45, 2024.05.12T15:30:45, etc.
export function dateFromFilename(filename: string | undefined | null): string | null {
  if (!filename) return null;
  const m = filename.match(
    /((?:19|20)\d{2})[-_. T]?(\d{2})[-_. T]?(\d{2})(?:[-_. T](\d{2})[-_:.]?(\d{2})[-_:.]?(\d{2}))?/
  );
  if (!m) return null;
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4] || "00"}:${m[5] || "00"}:${m[6] || "00"}`;
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

// Prefer a metadata timestamp (EXIF / file timestamp); otherwise parse the
// filename. Returns ISO string or null.
export function resolveTakenAt(
  metaTime: string | undefined | null,
  filename: string | undefined | null
): string | null {
  if (metaTime) {
    const d = new Date(metaTime);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return dateFromFilename(filename);
}