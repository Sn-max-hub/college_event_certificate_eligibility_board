/**
 * Fixed Activity Definitions & Initial Participant Data
 * College Event Certificate Eligibility Board (SI26_P12)
 */

let rowKeyCounter = 1;

export const FIXED_ACTIVITIES = Object.freeze([
  {
    id: "A01",
    name: "Emerging Tech Talk",
    category: "LEARN",
    points: 2,
  },
  {
    id: "A02",
    name: "Soldering Mini Lab",
    category: "BUILD",
    points: 3,
  },
  {
    id: "A03",
    name: "Project Pitch Circle",
    category: "SHARE",
    points: 2,
  },
  {
    id: "A04",
    name: "Open Source Clinic",
    category: "BUILD",
    points: 2,
  },
]);

export const INITIAL_PARTICIPANTS = Object.freeze([
  {
    id: "C01",
    name: "Asha",
    completedActivities: ["A01", "A02", "A03"],
  },
  {
    id: "C02",
    name: "Bilal",
    completedActivities: ["A01", "A03", "A04"],
  },
  {
    id: "C03",
    name: "Chen",
    completedActivities: ["A01", "A02", "A04"],
  },
  {
    id: "C04",
    name: "Divya",
    completedActivities: ["A02", "A03", "A04"],
  },
  {
    id: "C05",
    name: "Eshan",
    completedActivities: ["A01", "A03"],
  },
]);

/**
 * Returns a fresh deep clone of the initial participants array with unique stable keys.
 * Ensures Reset or Load Sample restores original values without state mutation.
 */
export function getInitialParticipants() {
  const base = typeof structuredClone === "function"
    ? structuredClone(INITIAL_PARTICIPANTS)
    : JSON.parse(JSON.stringify(INITIAL_PARTICIPANTS));

  return base.map((p) => ({
    ...p,
    _keyId: p._keyId || `p-initial-${rowKeyCounter++}`,
  }));
}

/**
 * Creates a blank participant row with a unique stable key.
 */
export function createEmptyParticipant() {
  return {
    _keyId: `p-new-${rowKeyCounter++}-${Date.now()}`,
    id: "",
    name: "",
    completedActivities: "",
  };
}

/**
 * Returns an array of fixed activities.
 */
export function getFixedActivities() {
  return [...FIXED_ACTIVITIES];
}
