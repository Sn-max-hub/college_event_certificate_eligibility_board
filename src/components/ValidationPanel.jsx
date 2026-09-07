import React from "react";

export default function ValidationPanel({ errors }) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <section className="validation-panel" role="alert" aria-live="assertive">
      <div className="validation-panel-header">
        <div className="validation-icon-wrapper">
          <svg
            className="validation-alert-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h2 className="validation-title">
            Validation Error{errors.length > 1 ? "s" : ""} Detected ({errors.length})
          </h2>
          <p className="validation-desc">
            The evaluation could not proceed. All previous evaluation results and summary counts have been cleared to prevent stale data.
          </p>
        </div>
      </div>

      <div className="validation-grid">
        {errors.map((err, index) => (
          <div key={`${err.code}-${err.participantId}-${index}`} className="validation-card">
            <div className="validation-code-badge">{err.code}</div>
            <div className="validation-details">
              <div className="validation-detail-row">
                <span className="detail-label">Participant:</span>
                <span className="detail-value participant-highlight">{err.participantId}</span>
              </div>
              <div className="validation-detail-row">
                <span className="detail-label">Offending Value:</span>
                <span className="detail-value offending-highlight">{err.offendingValue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
