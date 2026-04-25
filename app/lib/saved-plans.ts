export interface GradeEntry {
  grade: string;
  count: number;
  percentage: number;
}

export interface PlanItem {
  code: string;
  instructor: string;
  avgGpa: number;
  gradeData: GradeEntry[];
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
const DRAFT_KEY   = "maxgpa-plan-draft";

export function getSavedPlans(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
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

export function getDraftItems(): PlanItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addDraftItem(item: PlanItem): PlanItem[] {
  const existing = getDraftItems();
  const isDuplicate = existing.some(
    (i) => i.code === item.code && i.instructor === item.instructor
  );
  if (isDuplicate) return existing;
  const updated = [...existing, item];
  localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
  return updated;
}

export function removeDraftItem(code: string, instructor: string): PlanItem[] {
  const updated = getDraftItems().filter(
    (i) => !(i.code === code && i.instructor === instructor)
  );
  localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
  return updated;
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
