import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import CommentThread from "@/components/CommentThread";
import { PHASE_LABELS, PHASES } from "@/components/PhaseFilter";
import { ArrowLeft, MapPin, Trash2, Calendar, Tag, Cloud, Camera } from "lucide-react";

export default function PhotoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await base44.auth.me();
        setUser(me);
        const p = await base44.entities.SitePhoto.get(id);
        setPhoto(p);
      } catch (e) {
        setError(e.message || "Could not load this photo.");
      }
      setLoading(false);
    })();
  }, [id]);

  const canModify =
    user && photo && (user.id === photo.created_by_id || user.role === "admin");

  const setPhase = async (newPhase) => {
    try {
      await base44.entities.SitePhoto.update(photo.id, { phase: newPhase });
      setPhoto({ ...photo, phase: newPhase });
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await base44.entities.SitePhoto.delete(photo.id);
      navigate("/");
    } catch (e) {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-800" />
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" /> Back to timeline
        </Link>
        <p className="text-stone-600">{error || "Photo not found."}</p>
      </div>
    );
  }

  const taken = photo.taken_at ? new Date(photo.taken_at) : null;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="h-4 w-4" /> Back to timeline
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
            <Image
              src={photo.file_url}
              fittingType="fit"
              className="max-h-[70vh] w-full object-contain bg-stone-100"
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-stone-700">
                <Calendar className="h-4 w-4 text-stone-400" />
                {taken
                  ? taken.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })
                  : "Date unknown"}
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-700">
                <MapPin className="h-4 w-4 text-stone-400" />
                {photo.location_name || "Junglinster"}
                {photo.latitude != null && photo.longitude != null && (
                  <span className="text-stone-400">
                    ({photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-700">
                {photo.source === "google_drive" ? (
                  <Cloud className="h-4 w-4 text-stone-400" />
                ) : (
                  <Camera className="h-4 w-4 text-stone-400" />
                )}
                {photo.source === "google_drive" ? "Synced from Google Drive" : "Manual upload"}
              </div>
              {photo.caption && (
                <p className="text-sm text-stone-500">{photo.caption}</p>
              )}
            </div>

            <div className="mt-5 border-t border-stone-100 pt-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <Tag className="h-3.5 w-3.5" /> Construction phase
              </div>
              {canModify ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPhase(null)}
                    className={
                      "rounded-full px-3 py-1 text-xs font-medium transition " +
                      (!photo.phase
                        ? "bg-stone-900 text-white"
                        : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100")
                    }
                  >
                    Untagged
                  </button>
                  {PHASES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPhase(p)}
                      className={
                        "rounded-full px-3 py-1 text-xs font-medium transition " +
                        (photo.phase === p
                          ? "bg-stone-900 text-white"
                          : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100")
                      }
                    >
                      {PHASE_LABELS[p]}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                  {photo.phase ? PHASE_LABELS[photo.phase] || photo.phase : "Untagged"}
                </span>
              )}
            </div>

            {canModify && (
              <div className="mt-5 border-t border-stone-100 pt-4">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting…" : "Delete photo"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <CommentThread photoId={photo.id} currentUser={user} />
          </div>
        </div>
      </div>
    </div>
  );
}