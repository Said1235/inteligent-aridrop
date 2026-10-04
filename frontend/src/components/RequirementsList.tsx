/**
 * The active requirements, exactly as stored on chain and in stored order.
 * Numbered because they are a checklist every claim is judged against as a
 * whole — the numbers are references, not a sequence of steps.
 */
export function RequirementsList({
  requirements,
  compact = false,
}: {
  requirements: string[];
  compact?: boolean;
}) {
  return (
    <ol className="divide-y divide-[color:var(--rule)]">
      {requirements.map((text, i) => (
        <li key={i} className={`flex gap-3.5 ${compact ? "py-2.5" : "py-3.5"}`}>
          <span
            className="mt-0.5 shrink-0 font-mono text-sm text-faint tnum"
            aria-hidden="true"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="max-w-prose text-[0.9375rem] leading-relaxed">{text}</span>
        </li>
      ))}
    </ol>
  );
}
