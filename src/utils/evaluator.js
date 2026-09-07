/**
 * Pure Evaluation Engine & Validation Logic
 * College Event Certificate Eligibility Board (SI26_P12)
 *
 * Fully isolated from React state and UI components.
 */

/**
 * @typedef {Object} Participant
 * @property {string} id - Unique identifier for participant
 * @property {string} name - Participant full name
 * @property {string[]|string} completedActivities - List of completed activity IDs or CSV string
 */

/**
 * @typedef {Object} NormalizedParticipant
 * @property {string} id - Trimmed participant ID
 * @property {string} name - Trimmed participant name
 * @property {string[]} completedActivities - Trimmed, non-empty activity tokens
 * @property {string} rawId - Original raw ID string
 * @property {string} rawName - Original raw Name string
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} code - Error code identifier
 * @property {string} participantId - ID of offending participant or row
 * @property {string} offendingValue - Value that triggered validation error
 * @property {string} [field] - Specific input field name if applicable
 */

/**
 * @typedef {Object} EvaluationResult
 * @property {string} id - Participant ID
 * @property {string} name - Participant name
 * @property {string[]} completedActivities - Array of activity IDs
 * @property {number} totalPoints - Calculated total points
 * @property {string[]} categories - Array of unique covered categories
 * @property {boolean} isEligible - Dual-condition eligibility status
 * @property {string[]} failureReasons - Ordered list of failure reason strings
 */

/**
 * Default Business Rule Constants
 */
export const REQUIRED_CATEGORIES = Object.freeze(["LEARN", "BUILD", "SHARE"]);
export const MINIMUM_POINTS = 6;

/**
 * Normalizes raw activity input into a clean array of non-empty tokens.
 * @param {string[]|string} rawActivities
 * @returns {string[]}
 */
function parseActivityTokens(rawActivities) {
  if (Array.isArray(rawActivities)) {
    return rawActivities
      .map((item) => (item !== undefined && item !== null ? String(item).trim() : ""))
      .filter((token) => token.length > 0);
  }

  if (typeof rawActivities === "string") {
    return rawActivities
      .split(",")
      .map((item) => item.trim())
      .filter((token) => token.length > 0);
  }

  return [];
}

/**
 * Normalizes a single participant record:
 * - Trims ID and Name
 * - Splits comma-separated activity strings, trims each token, and filters out empty tokens
 *
 * @param {Participant} participant
 * @returns {NormalizedParticipant}
 */
export function normalizeParticipant(participant) {
  if (!participant || typeof participant !== "object") {
    return {
      id: "",
      name: "",
      completedActivities: [],
      rawId: "",
      rawName: "",
    };
  }

  const rawId = participant.id !== undefined && participant.id !== null ? String(participant.id) : "";
  const rawName = participant.name !== undefined && participant.name !== null ? String(participant.name) : "";

  const trimmedId = rawId.trim();
  const trimmedName = rawName.trim();
  const activitiesList = parseActivityTokens(participant.completedActivities);

  return {
    id: trimmedId,
    name: trimmedName,
    completedActivities: activitiesList,
    rawId,
    rawName,
  };
}

/**
 * Validates a list of participants against fixed activities.
 * Collects all errors across all records without failing fast.
 *
 * Error codes:
 * - INVALID_PARTICIPANT: ID or Name is empty after trimming
 * - DUPLICATE_PARTICIPANT_ID: Multiple participants have the same ID after trimming
 * - UNKNOWN_ACTIVITY: Activity ID does not exist in the fixed activity table
 * - DUPLICATE_PARTICIPATION: Participant lists the same activity ID more than once
 *
 * @param {Participant[]} participants
 * @param {Array<{id: string}>} activities
 * @returns {ValidationError[]}
 */
export function validateParticipants(participants, activities = []) {
  const errors = [];

  if (!Array.isArray(participants)) {
    return [
      {
        code: "INVALID_PARTICIPANT",
        participantId: "(unknown)",
        offendingValue: "Participant collection must be an array",
        field: "general",
      },
    ];
  }

  const validActivityIds = new Set(activities.map((a) => a.id));
  const seenParticipantIds = new Set();
  const duplicateParticipantIdsReported = new Set();

  for (let i = 0; i < participants.length; i++) {
    const raw = participants[i];
    const normalized = normalizeParticipant(raw);
    const identifier = normalized.id || normalized.rawId || `Row ${i + 1}`;

    // 1. Check for empty ID
    if (!normalized.id) {
      errors.push({
        code: "INVALID_PARTICIPANT",
        participantId: identifier,
        offendingValue: "Participant ID cannot be empty",
        field: "id",
      });
    }

    // 2. Check for empty Name
    if (!normalized.name) {
      errors.push({
        code: "INVALID_PARTICIPANT",
        participantId: identifier,
        offendingValue: "Participant Name cannot be empty",
        field: "name",
      });
    }

    // 3. Check for Duplicate Participant IDs (only if ID is non-empty)
    if (normalized.id) {
      if (seenParticipantIds.has(normalized.id)) {
        if (!duplicateParticipantIdsReported.has(normalized.id)) {
          errors.push({
            code: "DUPLICATE_PARTICIPANT_ID",
            participantId: normalized.id,
            offendingValue: normalized.id,
          });
          duplicateParticipantIdsReported.add(normalized.id);
        }
      } else {
        seenParticipantIds.add(normalized.id);
      }
    }

    // 4. Validate Completed Activities
    const seenActivitiesForParticipant = new Set();
    const duplicateActivitiesReported = new Set();

    for (const actId of normalized.completedActivities) {
      // Check unknown activity (strict case sensitivity)
      if (!validActivityIds.has(actId)) {
        errors.push({
          code: "UNKNOWN_ACTIVITY",
          participantId: identifier,
          offendingValue: actId,
        });
      }

      // Check duplicate participation for this participant
      if (seenActivitiesForParticipant.has(actId)) {
        if (!duplicateActivitiesReported.has(actId)) {
          errors.push({
            code: "DUPLICATE_PARTICIPATION",
            participantId: identifier,
            offendingValue: actId,
          });
          duplicateActivitiesReported.add(actId);
        }
      } else {
        seenActivitiesForParticipant.add(actId);
      }
    }
  }

  return errors;
}

/**
 * Derives categories covered by participant's completed activities.
 * Multiple activities from the same categorzy only add the category once.
 *
 * @param {string[]} completedActivityIds
 * @param {Map<string, Object>} activityMap
 * @returns {Set<string>}
 */
export function getCategories(completedActivityIds, activityMap) {
  const categorySet = new Set();
  for (const actId of completedActivityIds) {
    const act = activityMap.get(actId);
    if (act && act.category) {
      categorySet.add(act.category);
    }
  }
  return categorySet;
}

/**
 * Calculates total points earned from completed activities.
 * Each valid completed activity contributes its points exactly once.
 *
 * @param {string[]} completedActivityIds
 * @param {Map<string, Object>} activityMap
 * @returns {number}
 */
export function calculatePoints(completedActivityIds, activityMap) {
  let points = 0;
  for (const actId of completedActivityIds) {
    const act = activityMap.get(actId);
    if (act && typeof act.points === "number") {
      points += act.points;
    }
  }
  return points;
}

/**
 * Generates failure reasons in exact contracted order:
 * 1. MISSING_CATEGORY: LEARN
 * 2. MISSING_CATEGORY: BUILD
 * 3. MISSING_CATEGORY: SHARE
 * 4. POINTS_BELOW_6 (or configured threshold)
 *
 * @param {Set<string>} categorySet
 * @param {number} totalPoints
 * @param {string[]} requiredCategories
 * @param {number} minPoints
 * @returns {string[]}
 */
export function getFailureReasons(
  categorySet,
  totalPoints,
  requiredCategories = REQUIRED_CATEGORIES,
  minPoints = MINIMUM_POINTS
) {
  const reasons = [];

  for (const cat of requiredCategories) {
    if (!categorySet.has(cat)) {
      reasons.push(`MISSING_CATEGORY: ${cat}`);
    }
  }

  if (totalPoints < minPoints) {
    reasons.push(`POINTS_BELOW_${minPoints}`);
  }

  return reasons;
}

/**
 * Evaluates a single normalized participant against rules.
 *
 * @param {NormalizedParticipant} participant
 * @param {Map<string, Object>} activityMap
 * @param {string[]} requiredCategories
 * @param {number} minPoints
 * @returns {EvaluationResult}
 */
export function evaluateParticipant(
  participant,
  activityMap,
  requiredCategories = REQUIRED_CATEGORIES,
  minPoints = MINIMUM_POINTS
) {
  const categorySet = getCategories(participant.completedActivities, activityMap);
  const totalPoints = calculatePoints(participant.completedActivities, activityMap);

  const hasAllRequiredCategories = requiredCategories.every((cat) => categorySet.has(cat));
  const hasSufficientPoints = totalPoints >= minPoints;

  const isEligible = hasAllRequiredCategories && hasSufficientPoints;
  const failureReasons = isEligible
    ? []
    : getFailureReasons(categorySet, totalPoints, requiredCategories, minPoints);

  return {
    id: participant.id,
    name: participant.name,
    completedActivities: [...participant.completedActivities],
    totalPoints,
    categories: Array.from(categorySet),
    isEligible,
    failureReasons,
  };
}

/**
 * Sorts evaluation results:
 * Primary sort: ELIGIBLE participants first
 * Secondary sort: Ascending by Participant ID (alphanumeric numeric compare)
 *
 * @param {EvaluationResult[]} results
 * @returns {EvaluationResult[]}
 */
export function sortResults(results) {
  return [...results].sort((a, b) => {
    // 1. Eligible comes first
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;

    // 2. Ascending alphanumeric sort by participant ID
    return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" });
  });
}

/**
 * Master evaluation function.
 * Coordinates normalization, validation, evaluation, sorting, and summary metrics.
 *
 * @param {Participant[]} participants
 * @param {Array<{id: string, name: string, category: string, points: number}>} activities
 * @param {string[]} requiredCategories
 * @param {number} minPoints
 * @returns {{ errors: ValidationError[], results: EvaluationResult[], summary: { total: number, eligible: number, ineligible: number } | null }}
 */
export function evaluateParticipants(
  participants,
  activities = [],
  requiredCategories = REQUIRED_CATEGORIES,
  minPoints = MINIMUM_POINTS
) {
  // Step 1: Validate input roster
  const errors = validateParticipants(participants, activities);

  // Step 2: If validation errors exist, return empty results and null summary
  if (errors.length > 0) {
    return {
      errors,
      results: [],
      summary: null,
    };
  }

  // Handle empty roster
  if (!participants || participants.length === 0) {
    return {
      errors: [],
      results: [],
      summary: {
        total: 0,
        eligible: 0,
        ineligible: 0,
      },
    };
  }

  // Build activity lookup map once
  const activityMap = new Map(activities.map((a) => [a.id, a]));

  // Step 3: Evaluate each participant
  const evaluated = participants.map((p) => {
    const normalized = normalizeParticipant(p);
    return evaluateParticipant(normalized, activityMap, requiredCategories, minPoints);
  });

  // Step 4: Sort results deterministically
  const sorted = sortResults(evaluated);

  // Step 5: Derive summary counts
  const eligibleCount = sorted.filter((r) => r.isEligible).length;
  const ineligibleCount = sorted.length - eligibleCount;

  return {
    errors: [],
    results: sorted,
    summary: {
      total: sorted.length,
      eligible: eligibleCount,
      ineligible: ineligibleCount,
    },
  };
}
