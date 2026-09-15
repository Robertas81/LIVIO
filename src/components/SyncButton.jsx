import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SyncButton({ onSynced }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("syncGoogleDrivePhotos", {});
      setResult(res.data || res || {});
      onSynced && onSynced();
    } catch (e) {
      setResult({
        error:
          (e && e.response && e.response.data && e.response.data.error) ||
          e.message ||
          "Sync failed.",
      });
    }
    setSyncing(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
      >
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Sync from Drive
          </>
        )}
      </button>
      {result && !syncing && (
        <span
          className={
            "text-xs " + (result.error ? "text-red-600" : "text-stone-500")
          }
        >
          {result.error
            ? result.error
            : `Added ${result.created || 0} new · ${result.skipped || 0} already synced`}
        </span>
      )}
    </div>
  );
}
