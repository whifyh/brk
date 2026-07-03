import { getPlotHeight, insetPlotY, VIEWBOX_WIDTH } from "../viewbox.js";
import { orderIndexes } from "../order.js";
import { createBounds, includeBoundValue, scaleY } from "../scale.js";

/**
 * @param {LoadedSeries[]} series
 * @param {number[]} stackOrder
 * @param {number[]} lineIndexes
 */
function createStackBounds(series, stackOrder, lineIndexes) {
  const bounds = createBounds();
  const length = series[0].entries.length;

  includeBoundValue(bounds, 0);

  for (let index = 0; index < length; index += 1) {
    let negative = 0;
    let positive = 0;

    for (const seriesIndex of stackOrder) {
      const value = series[seriesIndex].entries[index].value;
      const end = value < 0 ? negative + value : positive + value;

      if (value < 0) negative = end;
      else positive = end;

      includeBoundValue(bounds, end);
    }

    for (const seriesIndex of lineIndexes) {
      const value = series[seriesIndex].entries[index].value;

      includeBoundValue(bounds, value);
    }
  }

  return bounds;
}

/**
 * @param {StackedPoint[]} points
 * @param {number} x
 * @param {"y" | "y0" | "y1"} key
 */
function interpolateStackY(points, x, key) {
  if (x <= points[0].x) return points[0][key];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];

    if (x > next.x) continue;

    const span = next.x - previous.x;
    const ratio = span ? (x - previous.x) / span : 0;

    return previous[key] + (next[key] - previous[key]) * ratio;
  }

  return points[points.length - 1][key];
}

/**
 * @param {LoadedSeries[]} loadedSeries
 * @param {ChartFrame} frame
 * @param {ChartOrder} order
 * @param {ChartScale} scale
 */
export function createStackedSeries(loadedSeries, frame, order, scale) {
  const indexes = loadedSeries.map((_, index) => index);
  const lineIndexes = orderIndexes(
    indexes.filter((index) => loadedSeries[index].series.role === "line"),
    order,
  );
  const stackIndexes = orderIndexes(
    indexes.filter((index) => loadedSeries[index].series.role !== "line"),
    order,
  );

  const length = loadedSeries[0].entries.length;
  const xScale = VIEWBOX_WIDTH / (length - 1);
  const plotHeight = getPlotHeight(frame);
  const plottedSeries = loadedSeries.map(({ series, color }) => ({
    series,
    color,
    points: /** @type {StackedPoint[]} */ ([]),
    hitTest: /** @type {StackedPlottedSeries["hitTest"]} */ (undefined),
  }));

  const bounds = createStackBounds(loadedSeries, stackIndexes, lineIndexes);

  for (const index of stackIndexes) {
    const points = plottedSeries[index].points;

    plottedSeries[index].hitTest = (_point, pointerX, pointerY) => {
      if (!points.length) return Infinity;

      const y0 = interpolateStackY(points, pointerX, "y0");
      const y1 = interpolateStackY(points, pointerX, "y1");
      const top = Math.min(y0, y1);
      const bottom = Math.max(y0, y1);

      return pointerY >= top && pointerY <= bottom
        ? 0
        : Math.min(Math.abs(pointerY - top), Math.abs(pointerY - bottom));
    };
  }

  for (const index of lineIndexes) {
    const points = plottedSeries[index].points;

    plottedSeries[index].hitTest = (_point, pointerX, pointerY) =>
      Math.abs(interpolateStackY(points, pointerX, "y") - pointerY);
  }

  for (let index = 0; index < length; index += 1) {
    let negative = 0;
    let positive = 0;
    const x = index * xScale;

    for (const seriesIndex of stackIndexes) {
      const { date, value } = loadedSeries[seriesIndex].entries[index];
      const start = value < 0 ? negative : positive;
      const end = start + value;

      if (value < 0) negative = end;
      else positive = end;

      const y0 = insetPlotY(frame, scaleY(start, bounds, plotHeight, scale));
      const y1 = insetPlotY(frame, scaleY(end, bounds, plotHeight, scale));

      plottedSeries[seriesIndex].points.push({
        date,
        value,
        x,
        y: y1,
        y0,
        y1,
      });
    }

    for (const seriesIndex of lineIndexes) {
      const { date, value } = loadedSeries[seriesIndex].entries[index];
      const y = insetPlotY(frame, scaleY(value, bounds, plotHeight, scale));

      plottedSeries[seriesIndex].points.push({
        date,
        value,
        x,
        y,
        y0: y,
        y1: y,
      });
    }
  }

  return {
    lineIndexes,
    plottedSeries,
    stackIndexes,
  };
}
