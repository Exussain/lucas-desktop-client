import type { LayerCategory } from "../types";

type IconProps = { category: LayerCategory };

export function TacticalIcon({ category }: IconProps) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  if (category === "medical") {
    return (
      <svg {...common}><path d="M12 3v18" /><path d="M3 12h18" /><circle cx="12" cy="12" r="9" /></svg>
    );
  }
  if (category === "roads") {
    return (
      <svg {...common}><path d="M7 2v20" /><path d="M17 2v20" /><path d="M12 5v2" /><path d="M12 10v2" /><path d="M12 15v2" /></svg>
    );
  }
  if (category === "utilities") {
    return (
      <svg {...common}><path d="M12 2l7 4v12l-7 4-7-4V6z" /><path d="M12 9v6" /><path d="M9 12h6" /></svg>
    );
  }
  if (category === "incidents") {
    return (
      <svg {...common}><path d="M12 2l10 18H2z" /><path d="M12 9v5" /><circle cx="12" cy="17" r="1" /></svg>
    );
  }
  return (
    <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 4v16" /><path d="M4 12h16" /></svg>
  );
}
