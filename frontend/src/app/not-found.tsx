import { AppShell } from "@/components/AppShell";
import { ButtonLink } from "@/components/Button";
import { EmptyState } from "@/components/States";

export default function NotFound() {
  return (
    <AppShell title="Page not found">
      <EmptyState
        title="There is nothing at this address"
        body="The link may be mistyped. Claim pages look like /claim/ followed by the full numeric claim ID."
        action={<ButtonLink href="/app">Go to requirements</ButtonLink>}
      />
    </AppShell>
  );
}
