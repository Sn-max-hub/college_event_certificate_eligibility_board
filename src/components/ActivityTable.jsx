import React from "react";

export default function ActivityTable({ activities }) {
  const getCategoryClass = (category) => {
    switch (category) {
      case "LEARN":
        return "badge-learn";
      case "BUILD":
        return "badge-build";
      case "SHARE":
        return "badge-share";
      default:
        return "badge-neutral";
    }
  };

  return (
    <section className="card activity-section" aria-labelledby="activity-table-heading">
      <div className="card-header">
        <div>
          <h2 id="activity-table-heading" className="card-title">Fixed Activity Catalog</h2>
          <p className="card-subtitle">Official catalog of event activities, categories, and point weights.</p>
        </div>
        <span className="readonly-tag">Read-Only Source of Truth</span>
      </div>

      <div className="table-responsive">
        <table className="data-table" aria-label="Fixed Activities Table">
          <thead>
            <tr>
              <th scope="col" style={{ width: "130px" }}>Activity ID</th>
              <th scope="col">Activity Name</th>
              <th scope="col" style={{ width: "140px" }}>Category</th>
              <th scope="col" style={{ width: "110px", textAlign: "right" }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act) => (
              <tr key={act.id}>
                <td>
                  <code className="code-badge">{act.id}</code>
                </td>
                <td className="activity-name">{act.name}</td>
                <td>
                  <span className={`category-badge ${getCategoryClass(act.category)}`}>
                    {act.category}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className="point-pill">{act.points} pts</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
