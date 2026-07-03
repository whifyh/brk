import { brk } from "../../utils/client.js";
import { orders } from "./order.js";
import { scales } from "./scale.js";
import { timeframes, timeframeOptions } from "./timeframes.js";
import { views } from "./views.js";

declare global {
  type ChartEntry = {
    date: Date;
    value: number;
  };
  type ChartMetric = (client: typeof brk) => TimeframeMetric;
  type ChartOrder = (typeof orders)[number]["value"];
  type ChartPoint = ChartEntry & {
    x: number;
    y: number;
  };
  type ChartResult = {
    dateEntries(): Iterable<[Date, number | null | undefined]>;
  };
  type ChartScale = (typeof scales)[number]["value"];
  type ChartSeries = {
    label: string;
    color: () => string;
    role?: "line";
    metric: ChartMetric;
  };
  type ChartUnit = {
    id: string;
    name: string;
    format(value: number): string;
  };
  type ChartView = (typeof views)[number]["value"];
  type Chart = {
    title: string;
    unit: ChartUnit;
    defaultType?: ChartView;
    defaultScale?: ChartScale;
    series: ChartSeries[];
  };
  type ChartFrame = {
    width: number;
    height: number;
    top: number;
    bottom: number;
    plotHeight: number;
  };
  type ChartFrameOptions = {
    topPadding?: number;
    bottomPadding?: number;
  };

  type LegendReadout = {
    rows: ({ value: HTMLOutputElement } | null)[];
  };
  type LoadedSeries = {
    series: ChartSeries;
    color: string;
    entries: ChartEntry[];
  };
  type PlotContext = {
    group: SVGGElement;
    loadedSeries: LoadedSeries[];
    frame: ChartFrame;
    highlight: SeriesHighlight;
    scale: ChartScale;
    order: ChartOrder;
  };
  type PlottedSeries = {
    series: ChartSeries;
    color: string;
    points: ChartPoint[];
    hitTest?: (
      point: ChartPoint | StackedPoint,
      pointerX: number,
      pointerY: number,
    ) => number;
  };
  type ScaleBounds = {
    min: number;
    max: number;
    minPositive: number;
  };
  type SeriesHighlight = {
    addNode(
      node: SVGPathElement | SVGCircleElement,
      index: number,
    ): void;
    clearPreview(): void;
    clearNodes(): void;
    preview(index: number): void;
  };
  type StackedPoint = ChartPoint & {
    y0: number;
    y1: number;
  };
  type StackedPlottedSeries = Omit<PlottedSeries, "points" | "hitTest"> & {
    points: StackedPoint[];
    hitTest?: PlottedSeries["hitTest"];
  };
  type XyPoint = {
    x: number;
    y: number;
    value: number;
  };
  type XyPlottedSeries = {
    points: XyPoint[];
    value?: number | string;
  };
  type XySeries = {
    label: string;
    color: () => string;
    kind: "line" | "point";
    hidden?: boolean;
  };

  type TimeframeEndpoint = {
    fetch(): Promise<ChartResult>;
    last(count: number): { fetch(): Promise<ChartResult> };
  };
  type TimeframeIndex = (typeof timeframes)[TimeframeValue]["index"];
  type TimeframeMetric = {
    by: Record<TimeframeIndex, TimeframeEndpoint>;
  };
  type TimeframeValue = (typeof timeframeOptions)[number]["value"];
}

export {};
