import { getPlotHeight, insetPlotY, VIEWBOX_WIDTH } from "../viewbox.js";
import { createBounds, includeBoundValue, scaleY } from "../scale.js";

/** @param {LoadedSeries[]} series */
function createValueBounds(series) {
  const bounds = createBounds();

  for (const { entries } of series) {
    for (const { value } of entries) {
      includeBoundValue(bounds, value);
    }
  }

  return bounds;
}

/**
 * @param {ChartEntry[]} entries
 * @param {ScaleBounds} bounds
 * @param {ChartFrame} frame
 * @param {ChartScale} scale
 * @returns {ChartPoint[]}
 */
function createPoints(entries, bounds, frame, scale) {
  const xScale = VIEWBOX_WIDTH / (entries.length - 1);
  const plotHeight = getPlotHeight(frame);

  return entries.map(({ date, value }, index) => ({
    date,
    value,
    x: index * xScale,
    y: insetPlotY(frame, scaleY(value, bounds, plotHeight, scale)),
  }));
}

/**
 * @param {ChartPoint[]} points
 * @param {number} x
 */
function interpolateY(points, x) {
  if (x <= points[0].x) return points[0].y;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];

    if (x > next.x) continue;

    const span = next.x - previous.x;
    const ratio = span ? (x - previous.x) / span : 0;

    return previous.y + (next.y - previous.y) * ratio;
  }

  return points[points.length - 1].y;
}

/**
 * @param {LoadedSeries[]} loadedSeries
 * @param {ChartFrame} frame
 * @param {ChartScale} scale
 */
export function createLineSeries(loadedSeries, frame, scale) {
  const bounds = createValueBounds(loadedSeries);

  return loadedSeries.map(({ series, color, entries }) => {
    const points = createPoints(entries, bounds, frame, scale);

    return {
      series,
      color,
      points,
      hitTest: /** @type {PlottedSeries["hitTest"]} */ (
        (_point, pointerX, pointerY) =>
          Math.abs(interpolateY(points, pointerX) - pointerY)
      ),
    };
  });
}
