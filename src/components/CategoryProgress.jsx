import React from "react";
import { REQUIRED_CATEGORIES } from "../utils/evaluator.js";

/**
 * Renders a compact multi-segment category progress strip.
 * Driven strictly by the evaluator's derived categories array to avoid logic duplication.
 */
export default function CategoryProgress({ coveredCategories = [] }) {
  const coveredSet = new Set(coveredCategories);

  return (
    <div className="category-strip" aria-label="Category coverage progress">
      {REQUIRED_CATEGORIES.map((category) => {
        const isCovered = coveredSet.has(category);
        return (
          <span
            key={category}
            className={`strip-segment ${isCovered ? "segment-covered" : "segment-missing"}`}
            title={`${category}: ${isCovered ? "Covered" : "Missing"}`}
          >
            <span className="segment-icon">{isCovered ? "✓" : "✗"}</span>
            <span className="segment-label">{category}</span>
          </span>
        );
      })}
    </div>
  );
}
