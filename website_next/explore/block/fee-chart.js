import { createXyChart } from "../../chart/xy/index.js";
import { getPlotHeight, insetPlotY } from "../../chart/viewbox.js";

export const FEE_PERCENTILE_LABELS = /** @type {const} */ ([
  "min",
  "10%",
  "25%",
  "50%",
  "75%",
  "90%",
  "max",
]);

const FEE_PERCENTILE_COLORS = /** @type {const} */ ([
  "var(--cyan)",
  "var(--blue)",
  "var(--violet)",
  "var(--white)",
  "var(--yellow)",
  "var(--orange)",
  "var(--red)",
]);

const VIEWBOX_HEIGHT = 180;
const FEE_AVERAGE_COLOR = "var(--green)";

/** @param {number} value */
function scaleFeeRate(value) {
  return Math.log10(value + 1);
}

/**
 * @param {number[]} values
 * @param {number} averageRate
 * @returns {FeeEntry[]}
 */
function createEntries(values, averageRate) {
  return [
    ...values.map((value, index) => ({
      label: FEE_PERCENTILE_LABELS[index],
      value,
      color: FEE_PERCENTILE_COLORS[index],
      pointIndex: index,
      priority: 0,
    })),
    {
      label: "avg",
      value: averageRate,
      color: FEE_AVERAGE_COLOR,
      pointIndex: null,
      priority: 1,
    },
  ].sort((a, b) => a.value - b.value || a.priority - b.priority);
}

/**
 * @param {FeeEntry[]} entries
 * @returns {XySeries[]}
 */
function createSeries(entries) {
  return [
    {
      label: "range",
      color: () => "var(--gray)",
      kind: /** @type {const} */ ("line"),
      hidden: true,
    },
    ...entries.map((entry) => ({
      label: entry.label,
      color: () => entry.color,
      kind: /** @type {const} */ ("point"),
    })),
  ];
}

/**
 * @param {readonly number[]} values
 * @param {ChartFrame} frame
 * @returns {{ x: number, y: number, value: number }[]}
 */
function createPoints(values, frame) {
  const scaledValues = values.map(scaleFeeRate);
  const min = Math.min(...scaledValues);
  const max = Math.max(...scaledValues);
  const span = max - min;
  const plotHeight = getPlotHeight(frame);
  const xScale = frame.width / (scaledValues.length - 1);

  return scaledValues.map((value, index) => ({
    x: xScale * index,
    y: span
      ? insetPlotY(frame, (1 - (value - min) / span) * plotHeight)
      : insetPlotY(frame, plotHeight / 2),
    value: values[index],
  }));
}

/**
 * @param {number[]} values
 * @param {{ x: number, y: number, value: number }[]} points
 * @param {number} target
 */
function interpolatePoint(values, points, target) {
  const scaledValues = values.map(scaleFeeRate);
  const scaledTarget = scaleFeeRate(target);

  if (scaledTarget <= scaledValues[0]) {
    return { ...points[0], value: target };
  }

  for (let index = 1; index < scaledValues.length; index += 1) {
    if (scaledTarget > scaledValues[index]) continue;

    const previousValue = scaledValues[index - 1];
    const nextValue = scaledValues[index];
    const previousPoint = points[index - 1];
    const nextPoint = points[index];
    const span = nextValue - previousValue;
    const ratio = span ? (scaledTarget - previousValue) / span : 0;

    return {
      x: previousPoint.x + (nextPoint.x - previousPoint.x) * ratio,
      y: previousPoint.y + (nextPoint.y - previousPoint.y) * ratio,
      value: target,
    };
  }

  return { ...points[points.length - 1], value: target };
}

/**
 * @param {number[]} values
 * @param {FeeEntry[]} entries
 * @param {ChartFrame} frame
 * @returns {XyPlottedSeries[]}
 */
function plotSeries(values, entries, frame) {
  const points = createPoints(values, frame);

  return [
    { points },
    ...entries.map((entry) => {
      const point =
        entry.pointIndex === null
          ? interpolatePoint(values, points, entry.value)
          : points[entry.pointIndex];

      return {
        points: [point],
        value: entry.value,
      };
    }),
  ];
}

/**
 * @param {number[]} values
 * @param {number} averageRate
 * @param {(value: number) => string} formatRate
 */
export function createFeeChart(values, averageRate, formatRate) {
  const entries = createEntries(values, averageRate);
  const figure = createXyChart({
    title: "Percentiles",
    unit: {
      id: "sat/vB",
      name: "satoshis per virtual byte",
      format: formatRate,
    },
    ariaLabel: `Fee rate percentiles from ${formatRate(
      values[0],
    )} to ${formatRate(values[values.length - 1])} sat/vB`,
    fallbackHeight: VIEWBOX_HEIGHT,
    series: createSeries(entries),
    plot: (frame) => plotSeries(values, entries, frame),
    marker: false,
  });

  figure.dataset.feeChart = "";

  return figure;
}

/**
 * @typedef {Object} FeeEntry
 * @property {string} label
 * @property {number} value
 * @property {string} color
 * @property {number | null} pointIndex
 * @property {number} priority
 */
