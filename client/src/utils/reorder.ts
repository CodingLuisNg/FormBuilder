import { arrayMove } from "@dnd-kit/sortable";

export function reorder<T>(arr: T[], from: number, to: number): T[] {
    if (from === -1 || to === -1) return arr;
    return arrayMove(arr, from, to);
}
