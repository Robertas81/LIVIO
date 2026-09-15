export const PHASES = [
  "planning",
  "foundation",
  "structure",
  "roofing",
  "facade",
  "interior",
  "exterior",
  "landscaping",
  "appartment",
  "incident"
  "other",
];

export const PHASE_LABELS = {
  planning: "Planning",
  foundation: "Foundation",
  structure: "Structure",
  roofing: "Roofing",
  facade: "Facade",
  interior: "Interior",
  exterior: "Exterior",
  landscaping: "Landscaping",
  appartment: "Appartment",
  incident: "Incident",
  other: "Other",
};

export default function PhaseFilter({ active, onChange }) {
  const chip = (key, label) => {
    const isActive = active === key;
    return (
      <button
        key={key ?? "all"}
        onClick={() => onChange(key)}
        className={
          "rounded-full px-3 py-1.5 text-sm font-medium transition " +
          (isActive
            ? "bg-stone-900 text-white"
            : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100")
        }
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {chip(null, "All")}
      {PHASES.map((p) => chip(p, PHASE_LABELS[p]))}
    </div>
  );
}