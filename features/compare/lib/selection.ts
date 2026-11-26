export const MAX_COMPARE_ITEMS = 4;

/** Adds or removes one listing id while enforcing the four-phone comparison limit. */
export function toggleCompareSelection(selected: readonly string[], id: string): string[] {
  if (selected.includes(id)) {
    return selected.filter((item) => item !== id);
  }
  if (selected.length >= MAX_COMPARE_ITEMS) {
    return [...selected];
  }
  return [...selected, id];
}

/** True when another phone can still be added to the current selection. */
export function canAddCompareSelection(selected: readonly string[], id: string): boolean {
  return selected.includes(id) || selected.length < MAX_COMPARE_ITEMS;
}
