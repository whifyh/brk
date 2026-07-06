import { packCells } from "./pack.js";

/**
 * @param {number} weight
 * @param {number} capacity
 * @param {number} columns
 * @param {"floor" | "round"} rounding
 */
function weightToSpan(weight, capacity, columns, rounding) {
  const cellWeight = capacity / (columns * columns);
  const span = Math.sqrt(weight / cellWeight);

  return Math.max(1, Math[rounding](span));
}

/**
 * @template {CapacityCell} Cell
 * @param {readonly Cell[]} cells
 * @param {number} capacity
 * @param {number} columns
 * @param {"floor" | "round"} rounding
 */
function resolveCapacityCells(cells, capacity, columns, rounding) {
  return cells.map((cell) => ({
    ...cell,
    span: weightToSpan(cell.weight ?? 0, capacity, columns, rounding),
  }));
}

/**
 * @template {CapacityCell} Cell
 * @param {readonly Cell[]} cells
 * @param {number} capacity
 * @param {number} columns
 * @param {"floor" | "round"} rounding
 */
function createSquareLayout(cells, capacity, columns, rounding) {
  const resolvedCells = resolveCapacityCells(cells, capacity, columns, rounding);
  const layouts = packCells(resolvedCells, columns, columns);

  return layouts === null ? null : { columns, resolvedCells, layouts };
}

/**
 * @template {CapacityCell} Cell
 * @param {readonly Cell[]} cells
 * @param {number} capacity
 * @param {number} columns
 */
export function findSquareLayout(cells, capacity, columns) {
  return createSquareLayout(cells, capacity, columns, "round") ??
    createSquareLayout(cells, capacity, columns, "floor");
}

/**
 * @typedef {Object} CapacityCell
 * @property {number} span
 * @property {number | undefined} weight
 */
