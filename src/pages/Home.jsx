import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PhaseFilter, { PHASE_LABELS, PHASES } from "@/components/PhaseFilter";
import PhotoCard from "@/components/PhotoCard";
import UploadButton from "@/components/UploadButton";
import VerticalTimeline, { matchesMonth } from "@/components/VerticalTimeline";
import EmptyState from "@/components/EmptyState";

function groupByMonth(photos) {
  const groups = {};
  photos.forEach((p) => {
    const d = p.taken_at ? new Date(p.taken_at) : null;
    const key = d
      ? d.toLocaleString(undefined, { year: "numeric", month: "long" })
      : "Undated";
    (groups[key] ||= []).push(p);
  });
  return groups;
}

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.SitePhoto.list("-taken_at", 500);
      setPhotos(list);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const byPhase = phase ? photos.filter((p) => p.phase === phase) : photos;
  const filtered = byPhase.filter((p) => matchesMonth(p, selectedMonth));
  const groups = groupByMonth(filtered);
  const groupKeys = Object.keys(groups);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-stone-900">
            Timeline
          </h1>
          <p className="text-sm text-stone-500">
            {loading ? "Loading…" : `${photos.length} photos on the Junglinster site`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <UploadButton onUploaded={load} />
        </div>
      </div>

      <PhaseFilter active={phase} onChange={setPhase} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <VerticalTimeline photos={byPhase} value={selectedMonth} onChange={setSelectedMonth} />
        {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        photos.length ? (
          <EmptyState
            title="No photos in this selection"
            description="Try a different construction phase or time period."
          />
        ) : (
          <EmptyState
            title="No photos yet"
            description="Upload photos directly to start building the Junglinster construction timeline."
          />
        )
      ) : (
        <div className="space-y-10">
          {groupKeys.map((key) => (
            <section key={key}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-stone-500">
                  {key}
                </h2>
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-xs text-stone-400">{groups[key].length}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups[key].map((p) => (
                  <PhotoCard key={p.id} photo={p} />
                ))}
              </div>
            </section>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}