import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { MapPin } from "lucide-react";
import { PHASE_LABELS } from "./PhaseFilter";

export default function PhotoCard({ photo }) {
  const taken = photo.taken_at ? new Date(photo.taken_at) : null;
  return (
    <Link
      to={`/photo/${photo.id}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-stone-100">
        <Image
          src={photo.thumbnail_url || photo.file_url}
          fittingType="fill"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="space-y-1.5 p-3">
        {photo.phase && (
          <span className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
            {PHASE_LABELS[photo.phase] || photo.phase}
          </span>
        )}
        <p className="text-sm font-semibold text-stone-900">
          {taken ? taken.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Date unknown"}
        </p>
        <p className="flex items-center gap-1 text-xs text-stone-500">
          <MapPin className="h-3 w-3" />
          {photo.location_name || "Junglinster"}
        </p>
      </div>
    </Link>
  );
}