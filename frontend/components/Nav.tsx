import { WalletButton } from "./WalletButton";

export function Nav() {
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <div className="brand">
          <span className="brand-mark">✓</span> The Evidence Ledger
        </div>
        <WalletButton />
      </div>
    </nav>
  );
}
