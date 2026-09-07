import React from "react";
import CategoryProgress from "./CategoryProgress.jsx";
import { MINIMUM_POINTS } from "../utils/evaluator.js";

export default function ResultsTable({ results, hasEvaluated }) {
  if (!hasEvaluated || results.length === 0) {
    return null;
  }

  return (
    <section className="card results-section" aria-labelledby="results-table-heading">
      <div className="card-header flex-between">
        <div>
          <h2 id="results-table-heading" className="card-title">Eligibility Evaluation Results</h2>
          <p className="card-subtitle">
            Contracted ranking: Eligible participants first, followed by Ineligible, ordered by Participant ID.
          </p>
        </div>
        <div className="results-count-badge">
          {results.length} record{results.length > 1 ? "s" : ""} evaluated
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table" aria-label="Certificate Eligibility Results Table">
          <thead>
            <tr>
              <th scope="col" style={{ width: "120px" }}>ID</th>
              <th scope="col" style={{ width: "170px" }}>Participant</th>
              <th scope="col" style={{ width: "110px", textAlign: "center" }}>Points</th>
              <th scope="col" style={{ width: "240px" }}>Category Progress</th>
              <th scope="col" style={{ width: "130px", textAlign: "center" }}>Status</th>
              <th scope="col">Failure Reasons</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => {
              const { id, name, totalPoints, categories, isEligible, failureReasons } = row;
              return (
                <tr
                  key={id}
                  className={`result-row ${isEligible ? "row-eligible" : "row-ineligible"}`}
                >
                  <td>
                    <code className="code-badge">{id}</code>
                  </td>
                  <td className="participant-name">{name}</td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`points-badge ${
                        totalPoints >= MINIMUM_POINTS ? "points-pass" : "points-fail"
                      }`}
                    >
                      <strong>{totalPoints}</strong> / {MINIMUM_POINTS}
                    </span>
                  </td>
                  <td>
                    <CategoryProgress coveredCategories={categories} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`status-badge ${
                        isEligible ? "status-eligible" : "status-ineligible"
                      }`}
                    >
                      {isEligible ? "ELIGIBLE" : "INELIGIBLE"}
                    </span>
                  </td>
                  <td>
                    {failureReasons.length === 0 ? (
                      <span className="empty-dash">—</span>
                    ) : (
                      <div className="reasons-list">
                        {failureReasons.map((reason, idx) => (
                          <span key={idx} className="reason-pill">
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
