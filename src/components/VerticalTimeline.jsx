import { CalendarRange, ChevronDown, ChevronUp } from "lucide-react";

// Build the timeline entries for a set of photos: an "All periods" entry,
// one entry per month (chronological), and an "Undated" entry when needed.
export function buildTimelineEntries(photos) {
  const groups = {};
  const undated = [];
  photos.forEach((p) => {
    const d = p.taken_at ? new Date(p.taken_at) : null;
    if (!d || isNaN(d.getTime())) {
      undated.push(p);
      return;
    }
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const g = (groups[key] ||= {
      key,
      label: d.toLocaleString(undefined, { year: "numeric", month: "long" }),
      items: [],
    });
    g.items.push(p);
  });
  const months = Object.values(groups).sort((a, b) => a.key.localeCompare(b.key));
  const entries = [{ key: null, label: "All periods", count: photos.length }];
  months.forEach((m) => entries.push({ key: m.key, label: m.label, count: m.items.length }));
  if (undated.length) entries.push({ key: "undated", label: "Undated", count: undated.length });
  return entries;
}

// Does a photo fall inside the selected timeline entry (null = all)?
export function matchesMonth(photo, key) {
  if (key == null) return true;
  const d = photo.taken_at ? new Date(photo.taken_at) : null;
  const valid = d && !isNaN(d.getTime());
  if (key === "undated") return !valid;
  if (!valid) return false;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === key;
}

export default function VerticalTimeline({ photos, value, onChange }) {
  const entries = buildTimelineEntries(photos);
  const idx = Math.max(
    0,
    entries.findIndex((e) => (e.key ?? null) === (value ?? null))
  );
  const step = (dir) =>
    onChange(entries[Math.min(entries.length - 1, Math.max(0, idx + dir))].key);
  const btn =
    "inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-stone-200 transition hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 lg:sticky lg:top-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
          <CalendarRange className="h-4 w-4 text-stone-400" />
          Timeline
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous period"
            onClick={() => step(-1)}
            disabled={idx <= 0}
            className={btn}
          >
            <ChevronUp className="h-4 w-4 text-stone-600" />
          </button>
          <button
            aria-label="Next period"
            onClick={() => step(1)}
            disabled={idx >= entries.length - 1}
            className={btn}
          >
            <ChevronDown className="h-4 w-4 text-stone-600" />
          </button>
        </div>
      </div>
      <ol className="relative max-h-64 space-y-1 overflow-y-auto pr-1 lg:max-h-[calc(100vh-220px)]">
        <div className="pointer-events-none absolute bottom-2 left-[9px] top-2 w-px bg-stone-200" />
        {entries.map((e) => {
          const active = (e.key ?? null) === (value ?? null);
          return (
            <li key={e.key ?? "all"} className="relative">
              <button
                onClick={() => onChange(e.key)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-stone-100"
              >
                <span
                  className={
                    "z-10 h-2.5 w-2.5 shrink-0 rounded-full border-2 " +
                    (active
                      ? "border-stone-900 bg-stone-900"
                      : "border-stone-300 bg-white")
                  }
                />
                <span className={active ? "font-semibold text-stone-900" : "text-stone-600"}>
                  {e.label}
                </span>
                <span className="ml-auto text-xs text-stone-400">{e.count}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}