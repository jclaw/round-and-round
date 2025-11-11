import { START_ANGLE } from "../constants";

export function layoutAngles(n: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < n; i++) {
    arr.push((i / Math.max(1, n)) * Math.PI * 2 + START_ANGLE);
  }
  return arr;
}
