/**
 * @param {LegendChart} chart
 * @returns {{ legend: HTMLElement, menu: HTMLElement, items: (HTMLElement | null)[], readout: LegendReadout }}
 */
export function createLegend(chart) {
  const legend = document.createElement("figcaption");
  const header = document.createElement("header");
  const title = document.createElement("h5");
  const separator = document.createElement("span");
  const unit = document.createElement("span");
  const menu = document.createElement("menu");
  const rows = chart.series.map((series) => {
    if (series.hidden) return null;

    const item = document.createElement("li");
    const button = document.createElement("button");
    const label = document.createElement("span");
    const value = document.createElement("output");

    button.type = "button";
    button.setAttribute("aria-label", `Highlight ${series.label}`);
    button.style.setProperty("--color", series.color());
    label.append(series.label);
    button.append(label, value);
    item.append(button);
    menu.append(item);

    return { button, value };
  });
  const items = rows.map((row) => row?.button ?? null);

  separator.dataset.chart = "separator";
  separator.setAttribute("aria-hidden", "true");
  separator.append("|");
  unit.dataset.chart = "unit";
  unit.setAttribute("aria-label", chart.unit.name);
  unit.append(chart.unit.id);
  title.append(chart.title, " ", separator, " ", unit);
  header.append(title);
  legend.append(header, menu);

  return { legend, menu, items, readout: { rows } };
}

/**
 * @typedef {Object} LegendChart
 * @property {string} title
 * @property {ChartUnit} unit
 * @property {{ label: string, color: () => string, hidden?: boolean }[]} series
 */
