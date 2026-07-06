import { createSvgElement } from "../chart/svg.js";

const VIEWBOX_SIZE = 1000;

/**
 * @param {TreeItem[]} items
 * @returns {TreeRect[]}
 */
function layout(items) {
  const area = VIEWBOX_SIZE * VIEWBOX_SIZE;
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const weighted = items
    .map((item, index) => ({
      item,
      index,
      area: (item.weight / total) * area,
    }))
    .sort((a, b) => b.area - a.area || a.index - b.index);

  return squarify(weighted, {
    x: 0,
    y: 0,
    width: VIEWBOX_SIZE,
    height: VIEWBOX_SIZE,
  });
}

/**
 * @param {{ item: TreeItem, index: number, area: number }[]} items
 * @param {TreeBox} box
 * @returns {TreeRect[]}
 */
function squarify(items, box) {
  const rects = [];
  let remaining = items;
  let rest = box;

  while (remaining.length > 0) {
    const row = pickRow(remaining, Math.min(rest.width, rest.height));

    rects.push(...layoutRow(row, rest));
    rest = trimBox(rest, rowArea(row));
    remaining = remaining.slice(row.length);
  }

  return rects;
}

/**
 * @param {{ item: TreeItem, index: number, area: number }[]} items
 * @param {number} side
 */
function pickRow(items, side) {
  let row = [items[0]];
  let ratio = worstRatio(row, side);

  for (let index = 1; index < items.length; index += 1) {
    const next = [...row, items[index]];
    const nextRatio = worstRatio(next, side);

    if (nextRatio > ratio) break;

    row = next;
    ratio = nextRatio;
  }

  return row;
}

/**
 * @param {{ area: number }[]} row
 */
function rowArea(row) {
  return row.reduce((sum, item) => sum + item.area, 0);
}

/**
 * @param {{ area: number }[]} row
 * @param {number} side
 */
function worstRatio(row, side) {
  const areas = row.map(({ area }) => area);
  const sum = rowArea(row);
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  const sideSquared = side * side;
  const sumSquared = sum * sum;

  return Math.max(
    (sideSquared * max) / sumSquared,
    sumSquared / (sideSquared * min),
  );
}

/**
 * @param {{ item: TreeItem, index: number, area: number }[]} row
 * @param {TreeBox} box
 * @returns {TreeRect[]}
 */
function layoutRow(row, box) {
  const area = rowArea(row);

  if (box.width >= box.height) {
    const width = area / box.height;
    let y = box.y;

    return row.map(({ item, index, area: itemArea }) => {
      const height = itemArea / width;
      const rect = { item, index, x: box.x, y, width, height };

      y += height;
      return rect;
    });
  }

  const height = area / box.width;
  let x = box.x;

  return row.map(({ item, index, area: itemArea }) => {
    const width = itemArea / height;
    const rect = { item, index, x, y: box.y, width, height };

    x += width;
    return rect;
  });
}

/**
 * @param {TreeBox} box
 * @param {number} area
 * @returns {TreeBox}
 */
function trimBox(box, area) {
  if (box.width >= box.height) {
    const width = area / box.height;

    return {
      x: box.x + width,
      y: box.y,
      width: box.width - width,
      height: box.height,
    };
  }

  const height = area / box.width;

  return {
    x: box.x,
    y: box.y + height,
    width: box.width,
    height: box.height - height,
  };
}

/**
 * @param {TreeRect} rect
 * @returns {SVGRectElement}
 */
function createTile(rect) {
  const tile = createSvgElement("rect");
  const title = createSvgElement("title");

  tile.dataset.treemapTile = rect.item.group;
  tile.setAttribute("x", rect.x.toFixed(3));
  tile.setAttribute("y", rect.y.toFixed(3));
  tile.setAttribute("width", rect.width.toFixed(3));
  tile.setAttribute("height", rect.height.toFixed(3));
  tile.style.setProperty("--color", rect.item.color);
  title.textContent = rect.item.title;
  tile.append(title);

  return tile;
}

/**
 * @param {TreeItem[]} items
 */
export function createTreemap(items) {
  const svg = createSvgElement("svg");

  svg.dataset.treemap = "";
  svg.setAttribute("viewBox", `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`);
  svg.setAttribute("role", "img");
  svg.append(...layout(items).map(createTile));

  return svg;
}

/**
 * @typedef {Object} TreeItem
 * @property {number} weight
 * @property {string} color
 * @property {string} group
 * @property {string} title
 */

/**
 * @typedef {Object} TreeRect
 * @property {TreeItem} item
 * @property {number} index
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} TreeBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */
