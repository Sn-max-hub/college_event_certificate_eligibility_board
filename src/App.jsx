import React, { useState, useCallback } from "react";
import Header from "./components/Header.jsx";
import ActivityTable from "./components/ActivityTable.jsx";
import ParticipantTable from "./components/ParticipantTable.jsx";
import ValidationPanel from "./components/ValidationPanel.jsx";
import SummaryCards from "./components/SummaryCards.jsx";
import ResultsTable from "./components/ResultsTable.jsx";
import {
  FIXED_ACTIVITIES,
  getInitialParticipants,
  createEmptyParticipant,
} from "./data/initialData.js";
import { evaluateParticipants } from "./utils/evaluator.js";

export default function App() {
  const [participants, setParticipants] = useState(() => getInitialParticipants());
  const [results, setResults] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Mark state as modified when roster changes after evaluation
  const markStale = useCallback(() => {
    setIsStale(true);
  }, []);

  // Update specific field in participant row
  const handleUpdateParticipant = useCallback((index, field, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
    markStale();
  }, [markStale]);

  // Add empty participant row
  const handleAddParticipant = useCallback(() => {
    setParticipants((prev) => [...prev, createEmptyParticipant()]);
    markStale();
  }, [markStale]);

  // Delete participant row
  const handleDeleteParticipant = useCallback((index) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
    markStale();
  }, [markStale]);

  // Evaluate action: triggers pure evaluator
  const handleEvaluate = useCallback(() => {
    const outcome = evaluateParticipants(participants, FIXED_ACTIVITIES);

    if (outcome.errors && outcome.errors.length > 0) {
      setValidationErrors(outcome.errors);
      setResults([]);
      setSummary(null);
    } else {
      setValidationErrors([]);
      setResults(outcome.results);
      setSummary(outcome.summary);
    }

    setHasEvaluated(true);
    setIsStale(false);
  }, [participants]);

  // Load built-in sample data
  const handleLoadSample = useCallback(() => {
    setParticipants(getInitialParticipants());
    setValidationErrors([]);
    setResults([]);
    setSummary(null);
    setHasEvaluated(false);
    setIsStale(false);
  }, []);

  // Reset: restore original built-in data and clear all evaluation outputs
  const handleReset = useCallback(() => {
    setParticipants(getInitialParticipants());
    setValidationErrors([]);
    setResults([]);
    setSummary(null);
    setHasEvaluated(false);
    setIsStale(false);
  }, []);

  return (
    <div className="app-container">
      <Header />

      <main className="dashboard-content">
        {/* Fixed Activity Catalog */}
        <ActivityTable activities={FIXED_ACTIVITIES} />

        {/* Editable Participant Roster */}
        <ParticipantTable
          participants={participants}
          onUpdateParticipant={handleUpdateParticipant}
          onAddParticipant={handleAddParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          onEvaluate={handleEvaluate}
          onLoadSample={handleLoadSample}
          onReset={handleReset}
          isStale={hasEvaluated && isStale}
        />

        {/* Validation Errors Panel (shown when validation errors exist) */}
        <ValidationPanel errors={validationErrors} />

        {/* Evaluation Summary Cards (shown on valid evaluation) */}
        <SummaryCards summary={summary} />

        {/* Results Table (shown on valid evaluation) */}
        <ResultsTable results={results} hasEvaluated={hasEvaluated} />
      </main>

      <footer className="app-footer">
        <p>
          SI26_P12 College Event Certificate Eligibility Board &bull; Local in-memory evaluation engine
        </p>
      </footer>
    </div>
  );
}
