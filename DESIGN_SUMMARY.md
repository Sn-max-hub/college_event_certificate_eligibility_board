# System Design & Architecture Summary

This document details the software architecture, state lifecycle, business logic rules, and live-modification guide for the **College Event Certificate Eligibility Board (SI26_P12)**.

---

## 1. High-Level Architecture

The application follows a unidirectional, decoupled data flow designed to separate UI presentation from business logic:

```
┌─────────────────────────────────────────────────────────────────┐
│                           React UI                              │
│  [ActivityTable]  [ParticipantTable]  [Header]  [ResultsTable]  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ User edits / clicks Evaluate
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      App.jsx (State Holder)                     │
│  - participants (raw inputs)                                    │
│  - results (empty / evaluated rows)                             │
│  - validationErrors (structured error list)                     │
│  - summary ({ total, eligible, ineligible } / null)             │
│  - hasEvaluated (boolean)                                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │ evaluateParticipants()
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 src/utils/evaluator.js (Pure Engine)            │
│  1. normalizeParticipant()       -> Trims strings & splits CSV  │
│  2. validateParticipants()        -> Collects all errors        │
│     ├─ If errors > 0             -> Returns { errors, results:[] }
│     └─ If errors == 0:                                          │
│        3. calculatePoints()      -> Sums points once per activity│
│        4. getCategories()        -> Derives Set of categories   │
│        5. evaluateParticipant()  -> Independent dual-condition │
│        6. getFailureReasons()    -> Exact contracted order      │
│        7. sortResults()          -> Eligible first, ID asc      │
│        8. generateSummary()      -> Counts totals               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. State Management Rationale

**Why `useState` in `App.jsx` instead of Redux, Zustand, or Context API?**
- **Single Source of Truth**: The participant roster is the only piece of user-editable state. Evaluation outputs (`results`, `validationErrors`, `summary`) are completely derived from the current participants and fixed activities when "Evaluate" is triggered.
- **Zero Overhead**: No store configuration, dispatchers, action creators, or provider wrapping.
- **Live Interview Explainability**: An interviewer can grasp the entire application state model in under 60 seconds.
- **Reliable Reset**: Resetting requires zero reducer actions; calling `setParticipants(getInitialParticipants())` and clearing the output states resets the application cleanly.

---

## 3. Core Business Logic Implementation

### A. Input Normalization
- **Participant IDs & Names**: Strings are trimmed using `.trim()`. Missing values become `""`.
- **Activity IDs**: Comma-separated strings are split by `,`, each token is trimmed, and empty tokens (`token.length === 0`) are filtered out.
  - Example: `" A01,,A02, "` $\rightarrow$ `["A01", "A02"]`.
  - Empty input `""` $\rightarrow$ `[]`.

### B. Validation Rules (Non-Fail-Fast)
Errors are collected across all participant rows into structured objects `{ code, participantId, offendingValue, field? }`:
1. `INVALID_PARTICIPANT`: Participant ID or Name is empty after trimming.
2. `DUPLICATE_PARTICIPANT_ID`: Multiple participants share the same ID after trimming.
3. `UNKNOWN_ACTIVITY`: Activity ID not present in `FIXED_ACTIVITIES`.
4. `DUPLICATE_PARTICIPATION`: A participant lists the same activity ID more than once (after trimming).

### C. Category Set Derivation
Categories are derived directly from the fixed activity table using JavaScript's native `Set`:
```js
const categorySet = new Set();
for (const actId of completedActivityIds) {
  const act = activityMap.get(actId);
  if (act) categorySet.add(act.category);
}
```
*Key Edge Case Handled*: If a participant completes both `A02` (Soldering Mini Lab, BUILD) and `A04` (Open Source Clinic, BUILD), `"BUILD"` is added to the Set only once.

### D. Dual-Condition Eligibility
A participant is eligible **only** when both conditions hold:
```js
const hasAllCategories = REQUIRED_CATEGORIES.every(cat => categorySet.has(cat));
const hasMinimumPoints = totalPoints >= MINIMUM_POINTS;
const isEligible = hasAllCategories && hasMinimumPoints;
```
Both conditions are evaluated independently. Points $\ge 6$ without `SHARE` does **not** grant eligibility.

### E. Contracted Failure Reason Ordering
For ineligible participants, reasons appear in this exact order:
1. `MISSING_CATEGORY: LEARN`
2. `MISSING_CATEGORY: BUILD`
3. `MISSING_CATEGORY: SHARE`
4. `POINTS_BELOW_6`
*(For an empty activity list `[]`, total points are 0 and all 4 failure reasons appear in this exact order.)*

### F. Deterministic Result Ordering
Results are partitioned and sorted:
1. **Primary sort**: `isEligible === true` before `isEligible === false`.
2. **Secondary sort**: Within each status group, ascending by participant ID using alphanumeric comparison (`localeCompare` with `numeric: true`).

---

## 4. Key Design Assumptions & Decisions

1. **Strict Case Sensitivity**: Activity IDs (`A01` vs `a01`) and participant IDs (`C01` vs `c01`) remain case-sensitive because the prompt contract specifies trimming but does not mandate case folding. Lowercase `a01` triggers `UNKNOWN_ACTIVITY`.
2. **Empty Comma Tokens**: Trailing or consecutive commas (e.g. `A01,,A02,`) are treated as formatting noise and stripped rather than causing unknown-activity validation errors.
3. **Empty Participant Roster**: If a user deletes all participants and clicks Evaluate, the system gracefully outputs `Total: 0, Eligible: 0, Ineligible: 0` without throwing exceptions.
4. **Immutability of Built-in Data**: Fixed activities and default participants are deep-frozen and cloned with `structuredClone` to prevent state contamination across evaluations.

---

## 5. Live Modification Guide (For Interview Exercises)

All business rules are configured as exported constants in `src/utils/evaluator.js`:

```js
// src/utils/evaluator.js
export const REQUIRED_CATEGORIES = ["LEARN", "BUILD", "SHARE"];
export const MINIMUM_POINTS = 6;
```

### Scenario 1: Increase Minimum Points from 6 to 8
- Change `MINIMUM_POINTS = 6;` to `export const MINIMUM_POINTS = 8;`.
- The evaluation engine dynamically updates failure reason codes to `POINTS_BELOW_8`, and table displays automatically update to `Points: X / 8`.

### Scenario 2: Add a 4th Required Category (e.g. "LEAD")
- Update: `export const REQUIRED_CATEGORIES = ["LEARN", "BUILD", "SHARE", "LEAD"];`.
- Failure reason generator automatically checks for `MISSING_CATEGORY: LEAD`.
- Category strip component dynamically renders 4 segments: `[LEARN] [BUILD] [SHARE] [LEAD]`.

### Scenario 3: Add a New Activity (e.g. A05 - Cloud Workshop)
- Open `src/data/initialData.js` and add:
  ```js
  { id: "A05", name: "Cloud Workshop", category: "BUILD", points: 3 }
  ```
- Activity table, lookup map, and validation dynamically recognize `A05`.

### Scenario 4: Change Sorting Order (e.g., Highest Points First)
- In `src/utils/evaluator.js` under `sortResults()`:
  ```js
  // Inside sort comparator:
  if (b.totalPoints !== a.totalPoints) {
    return b.totalPoints - a.totalPoints;
  }
  ```
