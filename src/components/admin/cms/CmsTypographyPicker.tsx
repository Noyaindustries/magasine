"use client";

import {
  getTypographyPreset,
  type TypographyPresetId,
  TYPOGRAPHY_PRESETS,
} from "@/lib/site-fonts";

interface CmsTypographyPickerProps {
  value: TypographyPresetId;
  onChange: (id: TypographyPresetId) => void;
  disabled?: boolean;
}

export function CmsTypographyPicker({ value, onChange, disabled }: CmsTypographyPickerProps) {
  return (
    <div className="cms-typography-grid" role="radiogroup" aria-label="Site typography">
      {TYPOGRAPHY_PRESETS.map((preset) => {
        const selected = preset.id === value;
        return (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            className={`cms-typography-option${selected ? " is-selected" : ""}`}
            onClick={() => onChange(preset.id)}
          >
            <div className="cms-typography-option-head">
              <span className="cms-typography-option-label">{preset.label}</span>
              {selected && <span className="cms-typography-option-badge">Active</span>}
            </div>
            <p className="cms-typography-option-desc">{preset.description}</p>
            <div className="cms-typography-preview">
              <p
                className="cms-typography-preview-editorial"
                style={{ fontFamily: preset.editorialFamily }}
              >
                {preset.editorialSample}
              </p>
              <p
                className="cms-typography-preview-ui"
                style={{ fontFamily: preset.uiFamily }}
              >
                {preset.uiSample}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function TypographyPresetLabel({ id }: { id: TypographyPresetId }) {
  return <>{getTypographyPreset(id).label}</>;
}
