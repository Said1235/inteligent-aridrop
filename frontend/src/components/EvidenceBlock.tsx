/**
 * Submitted evidence, shown verbatim. Whitespace is preserved and long
 * unbroken strings (URLs) wrap instead of forcing the page sideways.
 */
export function EvidenceBlock({ text }: { text: string }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-[color:var(--rule)] bg-[color:var(--sunk)]">
      <pre className="max-w-full whitespace-pre-wrap break-words p-4 font-mono text-sm leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
