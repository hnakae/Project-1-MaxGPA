export interface RequirementCourse {
  id: number;
  code: string;
  name: string | null;
  sequenceTag: string | null;
}

export interface RequirementGroup {
  groupId: number;
  groupName: string;
  type: "all" | "one_sequence" | "choose_from";
  sortOrder: number;
  courses: RequirementCourse[];
}

export type PlanCode = string; // "CS 330"

export function groupBySequence(courses: RequirementCourse[]): Record<string, RequirementCourse[]> {
  const out: Record<string, RequirementCourse[]> = {};
  for (const c of courses) {
    const tag = c.sequenceTag ?? "default";
    (out[tag] ??= []).push(c);
  }
  return out;
}

export function isGroupMet(group: RequirementGroup, planCodes: Set<PlanCode>): boolean {
  if (group.type === "all") {
    return group.courses.every((c) => planCodes.has(c.code));
  }
  if (group.type === "one_sequence") {
    const seqs = groupBySequence(group.courses);
    return Object.values(seqs).some((seq) => seq.every((c) => planCodes.has(c.code)));
  }
  // choose_from: at least one course in plan
  return group.courses.some((c) => planCodes.has(c.code));
}

export function allGroupsMet(groups: RequirementGroup[], planCodes: Set<PlanCode>): boolean {
  if (groups.length === 0) return false;
  return groups.every((g) => isGroupMet(g, planCodes));
}
