import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { resolveTakenAt } from "@/utils/parseTakenAt";

// Manual uploads are assumed to be taken on the Junglinster site.
const JUNGLINSTER_CENTER = { lat: 49.7056, lng: 6.2464 };

export default function UploadButton({ onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    setUploading(true);
    setTotal(files.length);
    setDone(0);
    setProgress(0);
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        const takenAt = resolveTakenAt(
          file.lastModified ? new Date(file.lastModified).toISOString() : null,
          file.name
        );
        await base44.entities.SitePhoto.create({
          file_url,
          thumbnail_url: file_url,
          ...(takenAt ? { taken_at: takenAt } : {}),
          latitude: JUNGLINSTER_CENTER.lat,
          longitude: JUNGLINSTER_CENTER.lng,
          location_name: "Junglinster",
          source: "manual",
          caption: file.name,
        });
        ok++;
      } catch (e) {
        // skip failed file
      }
      setDone(i + 1);
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    setDone(0);
    setTotal(0);
    setProgress(0);
    onUploaded && onUploaded(ok);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files))}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading {progress}%
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload
          </>
        )}
      </button>
    </>
  );
}