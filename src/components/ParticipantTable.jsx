import React from "react";

function formatActivitiesDisplay(activities) {
  if (typeof activities === "string") return activities;
  if (Array.isArray(activities)) return activities.join(", ");
  return "";
}

export default function ParticipantTable({
  participants,
  onUpdateParticipant,
  onAddParticipant,
  onDeleteParticipant,
  onEvaluate,
  onLoadSample,
  onReset,
  isStale = false,
}) {
  return (
    <section className="card participant-section" aria-labelledby="participant-table-heading">
      <div className="card-header flex-between">
        <div>
          <div className="header-title-row">
            <h2 id="participant-table-heading" className="card-title">
              Participant Activity Roster
            </h2>
            {isStale && (
              <span className="stale-badge" title="Roster inputs modified since last evaluation">
                ● Inputs Modified (Re-evaluate)
              </span>
            )}
          </div>
          <p className="card-subtitle">
            Edit participant credentials and comma-separated activity completion tokens.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddParticipant}
          className="btn btn-secondary btn-sm"
          id="btn-add-participant"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Participant
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table" aria-label="Editable Participants Table">
          <thead>
            <tr>
              <th scope="col" style={{ width: "140px" }}>Participant ID</th>
              <th scope="col" style={{ width: "210px" }}>Participant Name</th>
              <th scope="col">Completed Activity IDs (Comma-Separated)</th>
              <th scope="col" style={{ width: "90px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-table-cell">
                  No participants registered. Click <strong>"+ Add Participant"</strong> or <strong>"Load Sample Data"</strong>.
                </td>
              </tr>
            ) : (
              participants.map((p, index) => (
                <tr key={p._keyId || `participant-${index}`} className="participant-row">
                  <td>
                    <input
                      type="text"
                      className="table-input code-font"
                      value={p.id}
                      placeholder="e.g. C01"
                      onChange={(e) => onUpdateParticipant(index, "id", e.target.value)}
                      aria-label={`Participant ID for row ${index + 1}`}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="table-input"
                      value={p.name}
                      placeholder="e.g. Asha"
                      onChange={(e) => onUpdateParticipant(index, "name", e.target.value)}
                      aria-label={`Participant Name for row ${index + 1}`}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="table-input code-font"
                      value={formatActivitiesDisplay(p.completedActivities)}
                      placeholder="e.g. A01, A02, A03"
                      onChange={(e) => onUpdateParticipant(index, "completedActivities", e.target.value)}
                      aria-label={`Completed Activities for row ${index + 1}`}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="btn-icon-danger"
                      onClick={() => onDeleteParticipant(index)}
                      title={`Delete ${p.name || p.id || `Row ${index + 1}`}`}
                      aria-label={`Delete row ${index + 1}`}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="action-bar">
        <div className="action-bar-left">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEvaluate}
            id="btn-evaluate"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Evaluate Eligibility
          </button>
        </div>
        <div className="action-bar-right">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLoadSample}
            id="btn-load-sample"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Load Sample Data
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={onReset}
            id="btn-reset"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
