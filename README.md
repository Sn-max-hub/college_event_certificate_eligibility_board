# College Event Certificate Eligibility Board (SI26_P12)

A compact, polished, single-page **College Event Certificate Eligibility Board** developed for the Cisco AI-Assisted Coding Interview. The application evaluates participant certificate eligibility based on completed activities, category coverage, and point thresholds using pure, local in-memory data structures.

---

## 1. Project Overview

Organizing committees frequently host multi-track tech events with diverse learning modules. To award certificates fairly, participants must demonstrate both **breadth** (covering all core categories) and **depth** (earning sufficient points).

This board allows event administrators to:
- Review the immutable fixed activity catalog.
- Edit participant credentials and completed activity IDs using comma-separated tokens.
- Add and remove participant records dynamically.
- Run deterministic evaluations to compute exact points, derive category coverage sets, enforce dual-condition eligibility, and inspect ordered failure reasons.
- Instantly detect invalid inputs (whitespace, duplicates, missing fields, or unknown activity IDs) with automated clearing of stale results.

---

## 2. Key Features

- **Pure Evaluation Engine (`src/utils/evaluator.js`)**: Decoupled from React UI components for testability and live modification.
- **Dual-Condition Eligibility**: Participants are eligible **only** when they cover **all 3 required categories** (`LEARN`, `BUILD`, `SHARE`) AND accumulate **at least 6 points**. Both conditions are evaluated independently.
- **Strict Failure Reason Ordering**: Ineligible participants display failure reasons in the exact contracted order:
  1. `MISSING_CATEGORY: LEARN`
  2. `MISSING_CATEGORY: BUILD`
  3. `MISSING_CATEGORY: SHARE`
  4. `POINTS_BELOW_6`
- **Compact 3-Segment Category Progress Strip**: Visual indicators (`[ ✓ LEARN ] [ ✓ BUILD ] [ ✗ SHARE ]`) driven directly by the evaluator's category set.
- **Deterministic Validation & Stale Data Prevention**: If any validation error occurs, all previous result rows and summary counts are cleared immediately.
- **Order Contracts**: Eligible participants appear first, followed by Ineligible, sorted ascending by Participant ID.
- **Sample & Safe Reset Controls**: Restores original state using `structuredClone` without in-memory mutations.

---

## 3. Technology Stack

- **Framework**: React 18 (SPA)
- **Bundler / Dev Server**: Vite 5
- **Language**: JavaScript (ES Modules)
- **Styling**: Vanilla CSS with custom properties & responsive grid/flexbox
- **Testing**: Vitest (20 focused automated unit tests covering acceptance criteria and edge cases)
- **External State Management**: None (Pure React `useState` only)
- **Backend / Database**: None (100% in-memory client execution)

---

## 4. Project Structure

```
college_event_certificate_eligibility_board/
├── index.html                  # HTML entry point with meta tags & Inter typography
├── vite.config.js              # Vite configuration with React plugin & Vitest environment
├── package.json                # Project dependencies and script definitions
├── README.md                   # Project overview, setup, and usage guide
├── AI_INTERACTION.md           # Prompt history, AI-assisted trade-offs, and decisions
├── DESIGN_SUMMARY.md           # Architectural rationale, state model, and live-modification cheat sheet
├── TESTING.md                  # Test strategy, automated test matrix, and verification evidence
└── src/
    ├── components/
    │   ├── Header.jsx          # Title, subtitle, and live rule indicators
    │   ├── ActivityTable.jsx   # Read-only table of fixed activities with category badges
    │   ├── ParticipantTable.jsx# Inline editable roster with Add/Delete & action controls
    │   ├── ValidationPanel.jsx # Structured error callout cards (code, participant, offending value)
    │   ├── SummaryCards.jsx    # Metric cards for Total, Eligible, and Ineligible counts
    │   ├── ResultsTable.jsx    # Ordered outcome table with points, strip, status, and failure reasons
    │   └── CategoryProgress.jsx# 3-segment visual status pill strip
    ├── data/
    │   └── initialData.js      # Immutable fixed activities and initial participant dataset
    ├── utils/
    │   ├── evaluator.js        # Pure evaluation, normalization, validation, and sorting engine
    │   └── evaluator.test.js   # Automated Vitest test suite (acceptance & edge case tests)
    ├── App.jsx                 # Centralized state coordinator
    ├── App.css                 # Clean, professional layout and component styling
    ├── index.css               # Design system tokens and resets
    └── main.jsx                # Application root mounting script
```

---

## 5. Installation & Running Instructions

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 3: Run Automated Tests
```bash
npm test
```
To run tests in watch mode during development:
```bash
npm run test:watch
```

### Step 4: Build for Production
```bash
npm run build
```

---

## 6. Quick Demonstration Steps (Interview Walkthrough)

1. **Evaluate Built-in Oracle**:
   - Click **Evaluate Eligibility**.
   - Summary cards show: **Total: 5**, **Eligible: 2**, **Ineligible: 3**.
   - Results show `C01` (7 pts, ELIGIBLE), `C02` (6 pts, ELIGIBLE), `C03` (missing SHARE), `C04` (missing LEARN), `C05` (missing BUILD & below 6 pts).
2. **Point Boundary & Live Edit (`C05 + A04`)**:
   - In row 5 (`C05`), edit completed activities to `A01, A03, A04`.
   - Click **Evaluate Eligibility**.
   - `C05` updates to **ELIGIBLE** with **6/6 pts**; summary updates to **3 Eligible, 2 Ineligible**.
3. **Reset State**:
   - Click **Reset**.
   - Table values revert to built-in state, while evaluation results and summary cards are cleanly cleared.
4. **Duplicate Activity Validation**:
   - In row 1 (`C01`), change activities to `A01, A02, A03, A01`.
   - Click **Evaluate Eligibility**.
   - The **Validation Panel** appears with `DUPLICATE_PARTICIPATION` (`Participant: C01`, `Offending Value: A01`).
   - Results and summary cards are hidden.
