interface SectionDividerProps {
  label?: string;
}

export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="section-divider" aria-hidden>
      <span className="section-divider-line" />
      {label && <span className="section-divider-label">{label}</span>}
      <span className="section-divider-ornament">◆</span>
      <span className="section-divider-line" />
    </div>
  );
}
