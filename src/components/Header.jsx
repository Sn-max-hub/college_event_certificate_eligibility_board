import React from "react";

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-title-group">
          <div className="header-badge">Cisco AI-Assisted Interview Project • SI26_P12</div>
          <h1 className="header-title">College Event Certificate Eligibility Board</h1>
          <p className="header-subtitle">
            Evaluate participant activity completion, category coverage, and certificate eligibility.
          </p>
        </div>
        <div className="header-meta-chips">
          <div className="meta-chip">
            <span className="meta-chip-label">Rule</span>
            <span className="meta-chip-value">LEARN + BUILD + SHARE</span>
          </div>
          <div className="meta-chip">
            <span className="meta-chip-label">Threshold</span>
            <span className="meta-chip-value">&ge; 6 Points</span>
          </div>
        </div>
      </div>
    </header>
  );
}
