# Testing & Verification Guide

This document outlines the testing strategy, automated test matrix, acceptance verification checklist, and manual browser test results for the **College Event Certificate Eligibility Board (SI26_P12)**.

---

## 1. Testing Strategy

The project employs a dual-layer testing approach:
1. **Automated Unit Testing with Vitest**:
   - Executes against the pure `evaluator.js` engine.
   - Verifies all oracle calculations, failure ordering, category set deductions, deterministic sorting, and edge cases.
   - Run command: `npm test`
2. **Interactive UI / Subagent Browser Testing**:
   - Verifies visual component synchronization, DOM rendering, user input editing, stale result clearing, and safe reset behavior.

---

## 2. Test Cases Matrix (Automated & Manual)

| # | Test Case Description | Input Scenario | Expected Outcome | Verification Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **Built-in Oracle Test** | Default participants C01–C05 | Totals: 7, 6, 7, 7, 4.<br>C01 & C02 eligible.<br>Counts: 2 Eligible, 3 Ineligible. | **PASSED (Vitest & UI)** |
| **2** | **Failure Reason Exact Ordering** | Built-in C03, C04, C05 | C03: `MISSING_CATEGORY: SHARE`<br>C04: `MISSING_CATEGORY: LEARN`<br>C05: `MISSING_CATEGORY: BUILD`, `POINTS_BELOW_6` | **PASSED (Vitest & UI)** |
| **3** | **Point Boundary (C05 + A04)** | Add `A04` to C05 (`A01, A03, A04`) | Points: 6.<br>Categories: LEARN, BUILD, SHARE.<br>Status: ELIGIBLE.<br>Counts: 3 Eligible, 2 Ineligible. | **PASSED (Vitest & UI)** |
| **4** | **Empty Activity List** | Clear activities for C01 (`[]`) | Points: 0.<br>Failure reasons: All 4 in exact order.<br>Status: INELIGIBLE. | **PASSED (Vitest)** |
| **5** | **Duplicate Participation** | C01 activities: `A01, A02, A03, A01` | Error: `DUPLICATE_PARTICIPATION`<br>Participant: C01, Value: A01.<br>Results & counts cleared. | **PASSED (Vitest & UI)** |
| **6** | **Unknown Activity Detection** | C01 activities: `A01, A99` | Error: `UNKNOWN_ACTIVITY`<br>Offending Value: A99. | **PASSED (Vitest)** |
| **7** | **Empty Participant ID** | Participant ID: `""` | Error: `INVALID_PARTICIPANT`<br>Field: id. | **PASSED (Vitest)** |
| **8** | **Whitespace-Only Participant Name** | Name: `"   "` | Error: `INVALID_PARTICIPANT`<br>Field: name. | **PASSED (Vitest)** |
| **9** | **Duplicate Participant IDs** | Two participants with `"C01"` | Error: `DUPLICATE_PARTICIPANT_ID`<br>Offending Value: C01. | **PASSED (Vitest)** |
| **10** | **Duplicate IDs After Trimming** | `"C01"` and `" C01 "` | Error: `DUPLICATE_PARTICIPANT_ID`<br>Offending Value: C01. | **PASSED (Vitest)** |
| **11** | **Whitespace Activity Trimming** | Completed: `" A01 ,  A02 "` | Trimmed to `["A01", "A02"]`. Valid evaluation. | **PASSED (Vitest)** |
| **12** | **Duplicate Activity After Trimming** | Completed: `A01, " A01 "` | Error: `DUPLICATE_PARTICIPATION`<br>Offending Value: A01. | **PASSED (Vitest)** |
| **13** | **Empty Comma Tokens** | Completed: `"A01,,A02,"` | Empty tokens ignored.<br>Normalized to `["A01", "A02"]`. | **PASSED (Vitest)** |
| **14** | **Case Sensitivity (Lowercase ID)** | Completed: `"a01"` | Error: `UNKNOWN_ACTIVITY`<br>Offending Value: a01. | **PASSED (Vitest)** |
| **15** | **Multiple Participant Errors** | Multiple errors across rows | All errors collected without fail-fast. | **PASSED (Vitest)** |
| **16** | **Empty Participant List** | Zero participants registered | Total: 0, Eligible: 0, Ineligible: 0.<br>No crashes. | **PASSED (Vitest)** |
| **17** | **Multiple Same-Category Activities** | `A02` (BUILD) and `A04` (BUILD) | `"BUILD"` counted once in category Set.<br>Points sum both: 3 + 2 = 5. | **PASSED (Vitest)** |
| **18** | **Points >= 6 but Missing Category** | Total 7 points, missing SHARE | Status: INELIGIBLE.<br>Reason: `MISSING_CATEGORY: SHARE`. | **PASSED (Vitest)** |
| **19** | **Unordered Participant IDs** | Input: `C10, C02, C01, C05, C03` | Output sorted: Eligible (C01, C03, C10) then Ineligible (C02, C05). | **PASSED (Vitest)** |
| **20** | **Stale Results Cleared on Error** | Valid evaluate $\rightarrow$ Add error $\rightarrow$ Evaluate | Previous results table and summary cards removed immediately. | **PASSED (Vitest & UI)** |
| **21** | **Reset Functionality** | Click Reset after error or edit | Restores initial 5 participants.<br>Clears validation errors, results, and summary. | **PASSED (Vitest & UI)** |

---

## 3. Automated Test Execution Evidence

Running `npm test` produces the following Vitest execution report:

```text
> college-event-certificate-eligibility-board@1.0.0 test
> vitest run

 RUN  v2.1.9 C:/Users/sneha/OneDrive/Desktop/college_event_certificate_eligibility_board

 ✓ src/utils/evaluator.test.js (20 tests) 45ms

 Test Files  1 passed (1)
      Tests  20 passed (20)
   Start at  12:49:41
   Duration  1.46s
```

---

## 4. Manual Browser Verification Evidence

Using our integrated browser subagent, the following live workflows were verified in an automated Chrome session:
1. **Initial State**: Renders clean, readable primary screen with 4 fixed activities and 5 participant rows.
2. **Built-in Oracle Evaluation**: Clicked "Evaluate Eligibility" $\rightarrow$ Summary cards displayed `Total: 5`, `Eligible: 2`, `Ineligible: 3`. Results table showed exact totals (7, 6, 7, 7, 4) and ordered failure reasons.
3. **Live Roster Editing**: Modified `C05` completed activities to `A01, A03, A04` $\rightarrow$ Clicked Evaluate $\rightarrow$ `C05` earned 6/6 points and turned green (`ELIGIBLE`).
4. **Validation Callout & Stale Clearing**: Introduced duplicate `A01, A02, A03, A01` to `C01` $\rightarrow$ Clicked Evaluate $\rightarrow$ Validation panel opened with `DUPLICATE_PARTICIPATION`, and stale result rows disappeared.
5. **Reset Cleanliness**: Clicked Reset $\rightarrow$ Inputs reverted to default built-in values; all evaluation views disappeared cleanly.
