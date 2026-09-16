import type { ElementType, ReactNode } from "react";

interface MultilineTextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function MultilineText({
  children,
  className,
  as: Component = "div",
}: MultilineTextProps) {
  const text = typeof children === "string" ? children : String(children ?? "");
  const lines = text.split("\n");

  return (
    <Component className={className}>
      {lines.map((line, index) => (
        <span key={`${index}-${line}`}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </Component>
  );
}
