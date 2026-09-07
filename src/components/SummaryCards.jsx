import React from "react";

export default function SummaryCards({ summary }) {
  if (!summary) {
    return null;
  }

  const { total, eligible, ineligible } = summary;

  return (
    <section className="summary-section" aria-label="Evaluation Summary Metrics">
      <div className="summary-grid">
        <div className="summary-card summary-card-total">
          <div className="summary-card-inner">
            <span className="summary-label">Total Participants</span>
            <span className="summary-value summary-value-total">{total}</span>
          </div>
          <div className="summary-card-footer">Registered in current cohort</div>
        </div>

        <div className="summary-card summary-card-eligible">
          <div className="summary-card-inner">
            <span className="summary-label">Eligible for Certificate</span>
            <span className="summary-value summary-value-eligible">{eligible}</span>
          </div>
          <div className="summary-card-footer">
            Met points (&ge; 6) and all 3 categories
          </div>
        </div>

        <div className="summary-card summary-card-ineligible">
          <div className="summary-card-inner">
            <span className="summary-label">Ineligible</span>
            <span className="summary-value summary-value-ineligible">{ineligible}</span>
          </div>
          <div className="summary-card-footer">
            Missing category or points &lt; 6
          </div>
        </div>
      </div>
    </section>
  );
}
