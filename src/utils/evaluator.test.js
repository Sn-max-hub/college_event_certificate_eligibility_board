import { describe, it, expect } from "vitest";
import {
  REQUIRED_CATEGORIES,
  MINIMUM_POINTS,
  normalizeParticipant,
  validateParticipants,
  evaluateParticipants,
  sortResults,
  getCategories,
  calculatePoints,
  getFailureReasons,
} from "./evaluator.js";
import { FIXED_ACTIVITIES, INITIAL_PARTICIPANTS, getInitialParticipants } from "../data/initialData.js";

describe("Evaluator Business Logic - SI26_P12", () => {
  const activityMap = new Map(FIXED_ACTIVITIES.map((a) => [a.id, a]));

  describe("1. Built-in Oracle Acceptance Tests", () => {
    it("evaluates built-in participants with exact point totals and eligibility", () => {
      const evaluation = evaluateParticipants(INITIAL_PARTICIPANTS, FIXED_ACTIVITIES);

      expect(evaluation.errors).toHaveLength(0);
      expect(evaluation.summary).toEqual({
        total: 5,
        eligible: 2,
        ineligible: 3,
      });

      const resultMap = new Map(evaluation.results.map((r) => [r.id, r]));

      // Verify exact point totals
      expect(resultMap.get("C01").totalPoints).toBe(7);
      expect(resultMap.get("C02").totalPoints).toBe(6);
      expect(resultMap.get("C03").totalPoints).toBe(7);
      expect(resultMap.get("C04").totalPoints).toBe(7);
      expect(resultMap.get("C05").totalPoints).toBe(4);

      // Verify eligibility
      expect(resultMap.get("C01").isEligible).toBe(true);
      expect(resultMap.get("C02").isEligible).toBe(true);
      expect(resultMap.get("C03").isEligible).toBe(false);
      expect(resultMap.get("C04").isEligible).toBe(false);
      expect(resultMap.get("C05").isEligible).toBe(false);
    });

    it("verifies failure reasons appear in exact contracted order", () => {
      const evaluation = evaluateParticipants(INITIAL_PARTICIPANTS, FIXED_ACTIVITIES);
      const resultMap = new Map(evaluation.results.map((r) => [r.id, r]));

      // C01 & C02: Eligible -> No failure reasons
      expect(resultMap.get("C01").failureReasons).toEqual([]);
      expect(resultMap.get("C02").failureReasons).toEqual([]);

      // C03: Missing SHARE
      expect(resultMap.get("C03").failureReasons).toEqual(["MISSING_CATEGORY: SHARE"]);

      // C04: Missing LEARN
      expect(resultMap.get("C04").failureReasons).toEqual(["MISSING_CATEGORY: LEARN"]);

      // C05: Missing BUILD and points below 6 in exact order
      expect(resultMap.get("C05").failureReasons).toEqual([
        "MISSING_CATEGORY: BUILD",
        "POINTS_BELOW_6",
      ]);
    });
  });

  describe("2. Point Boundary & Eligibility Edge Cases", () => {
    it("makes C05 eligible at exactly 6 points when A04 is added", () => {
      const participants = getInitialParticipants();
      const c05 = participants.find((p) => p.id === "C05");
      c05.completedActivities.push("A04"); // A01 (2), A03 (2), A04 (2) = 6 points

      const evaluation = evaluateParticipants(participants, FIXED_ACTIVITIES);

      expect(evaluation.errors).toHaveLength(0);
      expect(evaluation.summary).toEqual({
        total: 5,
        eligible: 3,
        ineligible: 2,
      });

      const updatedC05 = evaluation.results.find((r) => r.id === "C05");
      expect(updatedC05.totalPoints).toBe(6);
      expect(updatedC05.categories.sort()).toEqual(["BUILD", "LEARN", "SHARE"]);
      expect(updatedC05.isEligible).toBe(true);
      expect(updatedC05.failureReasons).toEqual([]);
    });

    it("evaluates empty completed activity list correctly with 0 points and all 4 failure reasons", () => {
      const participants = getInitialParticipants();
      participants[0].completedActivities = []; // Clear C01

      const evaluation = evaluateParticipants(participants, FIXED_ACTIVITIES);

      expect(evaluation.errors).toHaveLength(0);
      expect(evaluation.summary).toEqual({
        total: 5,
        eligible: 1,
        ineligible: 4,
      });

      const updatedC01 = evaluation.results.find((r) => r.id === "C01");
      expect(updatedC01.totalPoints).toBe(0);
      expect(updatedC01.categories).toEqual([]);
      expect(updatedC01.isEligible).toBe(false);
      expect(updatedC01.failureReasons).toEqual([
        "MISSING_CATEGORY: LEARN",
        "MISSING_CATEGORY: BUILD",
        "MISSING_CATEGORY: SHARE",
        "POINTS_BELOW_6",
      ]);
    });

    it("verifies participant with 7 points but missing a category remains ineligible (multiple BUILDs)", () => {
      // A01 (LEARN, 2), A02 (BUILD, 3), A04 (BUILD, 2) = 7 pts. Category Set: LEARN, BUILD. Missing SHARE.
      const p = {
        id: "TEST1",
        name: "Test",
        completedActivities: ["A01", "A02", "A04"],
      };
      const evaluation = evaluateParticipants([p], FIXED_ACTIVITIES);

      expect(evaluation.results[0].totalPoints).toBe(7);
      expect(evaluation.results[0].categories.sort()).toEqual(["BUILD", "LEARN"]);
      expect(evaluation.results[0].isEligible).toBe(false);
      expect(evaluation.results[0].failureReasons).toEqual(["MISSING_CATEGORY: SHARE"]);
    });
  });

  describe("3. Normalization & Trimming", () => {
    it("trims whitespace from participant ID, name, and activity IDs", () => {
      const participant = {
        id: "  C99  ",
        name: "   Alice Cooper   ",
        completedActivities: "  A01 ,  A02  , A03  ",
      };
      const normalized = normalizeParticipant(participant);

      expect(normalized.id).toBe("C99");
      expect(normalized.name).toBe("Alice Cooper");
      expect(normalized.completedActivities).toEqual(["A01", "A02", "A03"]);
    });

    it("ignores empty tokens caused by trailing or repeated commas", () => {
      const participant = {
        id: "C99",
        name: "Alice",
        completedActivities: "A01,,A02, ,A03,",
      };
      const normalized = normalizeParticipant(participant);

      expect(normalized.completedActivities).toEqual(["A01", "A02", "A03"]);
    });
  });

  describe("4. Validation Rules & Deterministic Error Reporting", () => {
    it("reports INVALID_PARTICIPANT for missing or whitespace-only participant ID", () => {
      const participants = [
        { id: "", name: "Asha", completedActivities: ["A01"] },
        { id: "   ", name: "Bilal", completedActivities: ["A01"] },
      ];
      const errors = validateParticipants(participants, FIXED_ACTIVITIES);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "INVALID_PARTICIPANT",
            field: "id",
          }),
        ])
      );
    });

    it("reports INVALID_PARTICIPANT for missing or whitespace-only participant name", () => {
      const participants = [
        { id: "C01", name: "", completedActivities: ["A01"] },
        { id: "C02", name: "     ", completedActivities: ["A01"] },
      ];
      const errors = validateParticipants(participants, FIXED_ACTIVITIES);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "INVALID_PARTICIPANT",
            participantId: "C01",
            field: "name",
          }),
          expect.objectContaining({
            code: "INVALID_PARTICIPANT",
            participantId: "C02",
            field: "name",
          }),
        ])
      );
    });

    it("reports DUPLICATE_PARTICIPANT_ID when IDs collide after trimming", () => {
      const participants = [
        { id: "C01", name: "Asha", completedActivities: ["A01"] },
        { id: "  C01  ", name: "Asha Clone", completedActivities: ["A01"] },
      ];
      const errors = validateParticipants(participants, FIXED_ACTIVITIES);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "DUPLICATE_PARTICIPANT_ID",
            participantId: "C01",
            offendingValue: "C01",
          }),
        ])
      );
    });

    it("reports UNKNOWN_ACTIVITY for activities not in the fixed table", () => {
      const participants = [
        { id: "C01", name: "Asha", completedActivities: ["A01", "A99"] },
      ];
      const errors = validateParticipants(participants, FIXED_ACTIVITIES);

      expect(errors).toEqual([
        {
          code: "UNKNOWN_ACTIVITY",
          participantId: "C01",
          offendingValue: "A99",
        },
      ]);
    });

    it("reports UNKNOWN_ACTIVITY for lowercase activity ID due to intentional case sensitivity", () => {
      const participants = [
        { id: "C01", name: "Asha", completedActivities: ["a01"] },
      ];
      const errors = validateParticipants(participants, FIXED_ACTIVITIES);

      expect(errors).toEqual([
        {
          code: "UNKNOWN_ACTIVITY",
          participantId: "C01",
          offendingValue: "a01",
        },
      ]);
    });

    it("reports DUPLICATE_PARTICIPATION when activity is repeated for same participant", () => {
      const participants = [
        { id: "C01", name: "Asha", completedActivities: ["A01", "A02", "A03", "A01"] },
      ];
      const errors = validateParticipants(participants, FIXED_ACTIVITIES);

      expect(errors).toEqual([
        {
          code: "DUPLICATE_PARTICIPATION",
          participantId: "C01",
          offendingValue: "A01",
        },
      ]);
    });

    it("reports DUPLICATE_PARTICIPATION when duplicate activity occurs with whitespace variations", () => {
      const participants = [
        { id: "C01", name: "Asha", completedActivities: ["A01", " A01 "] },
      ];
      const errors = validateParticipants(participants, FIXED_ACTIVITIES);

      expect(errors).toEqual([
        {
          code: "DUPLICATE_PARTICIPATION",
          participantId: "C01",
          offendingValue: "A01",
        },
      ]);
    });

    it("collects multiple validation errors across multiple participants without failing fast", () => {
      const participants = [
        { id: "C01", name: "Asha", completedActivities: ["A99"] }, // Unknown activity
        { id: "C02", name: "Bilal", completedActivities: ["A01", "A01"] }, // Duplicate participation
        { id: "C03", name: "   ", completedActivities: ["A01"] }, // Invalid name
      ];
      const errors = validateParticipants(participants, FIXED_ACTIVITIES);

      expect(errors.length).toBeGreaterThanOrEqual(3);
      expect(errors.some((e) => e.code === "UNKNOWN_ACTIVITY")).toBe(true);
      expect(errors.some((e) => e.code === "DUPLICATE_PARTICIPATION")).toBe(true);
      expect(errors.some((e) => e.code === "INVALID_PARTICIPANT")).toBe(true);
    });

    it("clears results and summary when validation errors exist", () => {
      const participants = [
        { id: "C01", name: "Asha", completedActivities: ["A01", "A01"] },
      ];
      const evaluation = evaluateParticipants(participants, FIXED_ACTIVITIES);

      expect(evaluation.errors.length).toBe(1);
      expect(evaluation.results).toEqual([]);
      expect(evaluation.summary).toBeNull();
    });
  });

  describe("5. Sorting & Order Contracts", () => {
    it("sorts eligible participants first, then ineligible, each sorted ascending by ID", () => {
      const unsorted = [
        { id: "C10", name: "Zoe", completedActivities: ["A01", "A02", "A03"] }, // Eligible (7 pts)
        { id: "C02", name: "Bob", completedActivities: ["A01"] }, // Ineligible (2 pts)
        { id: "C01", name: "Alice", completedActivities: ["A01", "A02", "A03"] }, // Eligible (7 pts)
        { id: "C05", name: "Dan", completedActivities: ["A01"] }, // Ineligible (2 pts)
        { id: "C03", name: "Charlie", completedActivities: ["A01", "A03", "A04"] }, // Eligible (6 pts)
      ];

      const evaluation = evaluateParticipants(unsorted, FIXED_ACTIVITIES);
      const ids = evaluation.results.map((r) => r.id);

      // Eligible first: C01, C03, C10
      // Ineligible second: C02, C05
      expect(ids).toEqual(["C01", "C03", "C10", "C02", "C05"]);
    });
  });

  describe("6. Edge Cases & Live Modifications", () => {
    it("handles completely empty participant array gracefully without crashing", () => {
      const evaluation = evaluateParticipants([], FIXED_ACTIVITIES);

      expect(evaluation.errors).toEqual([]);
      expect(evaluation.results).toEqual([]);
      expect(evaluation.summary).toEqual({
        total: 0,
        eligible: 0,
        ineligible: 0,
      });
    });

    it("supports live modification of MINIMUM_POINTS from 6 to 8", () => {
      // Under minPoints = 8, even C01 (7 pts) should become ineligible
      const evaluation = evaluateParticipants(
        INITIAL_PARTICIPANTS,
        FIXED_ACTIVITIES,
        REQUIRED_CATEGORIES,
        8
      );

      expect(evaluation.summary.eligible).toBe(0);
      expect(evaluation.summary.ineligible).toBe(5);
      const c01 = evaluation.results.find((r) => r.id === "C01");
      expect(c01.isEligible).toBe(false);
      expect(c01.failureReasons).toContain("POINTS_BELOW_8");
    });

    it("supports live modification adding a new required category", () => {
      const customCategories = ["LEARN", "BUILD", "SHARE", "LEAD"];
      const evaluation = evaluateParticipants(
        INITIAL_PARTICIPANTS,
        FIXED_ACTIVITIES,
        customCategories,
        6
      );

      // Nobody has LEAD, so all are ineligible
      expect(evaluation.summary.eligible).toBe(0);
      expect(evaluation.results[0].failureReasons).toContain("MISSING_CATEGORY: LEAD");
    });
  });
});
