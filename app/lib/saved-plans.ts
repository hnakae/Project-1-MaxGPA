export interface GradeEntry {
  grade: string;
  count: number;
  percentage: number;
}

export interface InstructorRow {
  instructor: string;
  avgGpa: number;
  gradeData: GradeEntry[];
}

export interface PlanItem extends InstructorRow {
  code: string;
}

export interface SavedPlan {
  id: string;
  planName: string;
  subject: string;
  subjectLabel: string;
  createdDate: string;
  items: PlanItem[];
  avgGpa: number;
}

const STORAGE_KEY = "maxgpa-saved-plans";
const draftKey = (subject: string) => `maxgpa-plan-draft-${subject}`;

export function getSavedPlans(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const plans: SavedPlan[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return plans.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  } catch {
    return [];
  }
}

export function savePlan(plan: Omit<SavedPlan, "id">): SavedPlan {
  const existing = getSavedPlans();
  const newPlan: SavedPlan = { ...plan, id: Date.now().toString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newPlan]));
  return newPlan;
}

export function deletePlan(id: string): void {
  const updated = getSavedPlans().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getDraftItems(subject: string): PlanItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(draftKey(subject)) ?? "[]");
  } catch {
    return [];
  }
}

export function addDraftItem(item: PlanItem, subject: string): PlanItem[] {
  const existing = getDraftItems(subject);
  const isDuplicate = existing.some(
    (i) => i.code === item.code && i.instructor === item.instructor
  );
  if (isDuplicate) return existing;
  const updated = [...existing, item];
  localStorage.setItem(draftKey(subject), JSON.stringify(updated));
  return updated;
}

export function removeDraftItem(code: string, instructor: string, subject: string): PlanItem[] {
  const updated = getDraftItems(subject).filter(
    (i) => !(i.code === code && i.instructor === instructor)
  );
  localStorage.setItem(draftKey(subject), JSON.stringify(updated));
  return updated;
}

export function clearDraft(subject: string): void {
  localStorage.removeItem(draftKey(subject));
}
