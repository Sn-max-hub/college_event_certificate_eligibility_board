# AI Interaction & Engineering Log

This document records the AI-assisted workflows, prompt engineering strategy, architectural trade-offs, and verification decisions used during the development of the **College Event Certificate Eligibility Board (SI26_P12)** for the Cisco AI-Assisted Coding Interview.

---

## 1. AI Tools & Environment

- **Primary Assistant**: Antigravity AI Coding Assistant (powered by Google DeepMind Advanced Agentic Coding).
- **Execution Environment**: Windows PowerShell, Node.js v18+, Vite dev server, Vitest test runner.
- **Verification Subagents**: Automated browser subagent for real DOM interaction, screenshot capture, and recording validation flows.

---

## 2. Prompt Evolution & Strategy

The project followed an intentional 3-stage prompt evolution to prevent scope creep, establish clear boundaries, and ensure interview readiness.

### Stage 1: Problem Clarification & Architectural Constraints
* **Initial Prompt**:
  > "Build a compact College Event Certificate Eligibility Board evaluating participant activity completion, category coverage, and point thresholds. Provide file structure, ask series of yes/no questions to refine recommendations, and discuss pros and cons of implementation strategies."
* **Assistant Output**:
  - Outlined modular directory structure separating UI components from the pure evaluation engine.
  - Compared comma-separated input vs. dropdown pills, explicit evaluation button vs. reactive evaluation, and minimalist state vs. external state management (Redux/Zustand).
  - Posed 5 targeted yes/no questions regarding input format, category progress representation, test scenario buttons, unit testing framework, and live configuration constants.

### Stage 2: Refined Technical Specification & Guardrails
* **Refined Prompt**:
  > "Keep UI as a single attractive primary screen. No Redux, Zustand, Context API, backend, database, or external APIs. Comma-separated input for rapid testability. Category strip ([ LEARN ✓ ][ BUILD ✓ ][ SHARE ✗ ]). Vitest for automated tests (do not claim 100% test coverage; claim focused automated tests covering required acceptance and key edge cases). Configurable constants for MINIMUM_POINTS and REQUIRED_CATEGORIES. Proceed incrementally and keep evaluator logic independent from React."
* **Architectural Decisions Established**:
  - Zero state management libraries: Single state source in `App.jsx` using vanilla `useState`.
  - Immutable initial data structures with `structuredClone` factory functions to eliminate mutation bugs on Reset.
  - Multi-error validation collection without fail-fast to give comprehensive feedback.

### Stage 3: Verification, Edge Cases & Acceptance Prompts
* **Testing Prompts**:
  > "Create Vitest tests in `evaluator.test.js` covering: Built-in Oracle (totals 7, 6, 7, 7, 4), Exact failure reason order, Exact point boundary (C05 + A04 = 6 pts), Empty activity lists, Duplicate participation, Whitespace normalization, Case sensitivity (a01 -> UNKNOWN_ACTIVITY), Multiple errors, and Sorting contracts."
* **Browser Verification Prompt**:
  > "Launch browser subagent to interactively verify the complete user flow at `http://localhost:5173/`: Evaluate built-in data, verify C05 boundary edit, verify Reset behavior, verify duplicate participation error with stale result clearing, and verify final clean state."

---

## 3. Design Decisions Influenced by AI vs. Independently Verified

| Decision Area | Initial Consideration | AI Recommendation | Final Verified Decision | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Activity Input** | Interactive multi-select dropdown | Comma-separated text input | **Comma-separated text input** | Allows testing malformed inputs (duplicate IDs, whitespace, unknown IDs) during live interview demos. |
| **Evaluation Trigger** | Reactive `useEffect` auto-compute | Explicit "Evaluate" action button | **Explicit "Evaluate" button** | Meets strict contract requirement to clear stale results upon error; prevents error flashing while typing. |
| **State Scope** | Complex Context / Reducer | Local `useState` in `App.jsx` + pure evaluator | **Local `useState` + pure evaluator** | Maximizes readability and live modification agility during a 30-minute interview. |
| **Category Progress** | Numeric percentage bar ("66%") | 3-segment visual status strip | **3-segment strip (`[✓][✓][✗]`)** | Shows exact missing category without reading raw text failure messages. |
| **Case Sensitivity** | Auto-uppercase `a01 -> A01` | Strict case sensitivity | **Strict case sensitivity (`a01` -> `UNKNOWN_ACTIVITY`)** | Specification requires trimming whitespace but does not specify case folding. Preserves strict contract adherence. |
| **Empty Comma Tokens** | Throw error on `A01,,A02,` | Filter empty tokens | **Filter empty tokens (`token.length > 0`)** | Prevents spurious validation errors caused by typing trailing commas. |

---

## 4. Trade-Offs & Architectural Balance

1. **Simplicity vs. Abstraction**:
   - *Trade-off*: We avoided creating separate form state machines or Redux slices.
   - *Advantage*: Entire state fits in ~10 lines of `App.jsx`. Any interviewer can trace data flow from button click to pure evaluator and render.
2. **Deterministic Error Collection vs. Fail-Fast**:
   - *Trade-off*: Validating all participants collects multiple errors instead of terminating on the first invalid field.
   - *Advantage*: Users get full feedback on all offending rows in a single evaluation cycle.
3. **Pure Logic Isolation**:
   - *Trade-off*: React components do not contain any filtering or score arithmetic.
   - *Advantage*: `evaluator.js` was verified with 20 automated Vitest unit tests in 45ms without needing DOM mocks or React testing harnesses.

---

## 5. Realistic Prompt History for Interview Discussion

During the interview, be prepared to share:
- **How you framed the initial prompt**: Emphasized testability, non-functional requirements (no external state libraries, no backend), and live modification capability.
- **How you handled edge cases**: Specified that empty completed activities should not be flagged as `UNKNOWN_ACTIVITY` and should produce all four failure reasons.
- **How you validated the AI's code**: Verified that the AI ran Vitest tests locally and used a browser subagent with DOM inspection and screenshot recording rather than relying solely on code generation.
