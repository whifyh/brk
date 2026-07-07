import {
  appendLegendListItem,
  createLegendItem,
  createLegendList,
} from "../../../legend/index.js";
import { formatNumber } from "../format.js";

/** @param {BlockPreviewTransaction} tx */
function isVersion1(tx) {
  return tx.version === 1;
}

/** @param {BlockPreviewTransaction} tx */
function isVersion2(tx) {
  return tx.version === 2;
}

/** @param {BlockPreviewTransaction} tx */
function isVersion3(tx) {
  return tx.version === 3;
}

/** @param {BlockPreviewTransaction} tx */
function isRbf(tx) {
  return tx.rbf;
}

/** @param {BlockPreviewTransaction} tx */
function isNotRbf(tx) {
  return !tx.rbf;
}

/** @param {BlockPreviewTransaction} tx */
function hasOneInput(tx) {
  return tx.inputCount === 1;
}

/** @param {BlockPreviewTransaction} tx */
function hasManyInputs(tx) {
  return tx.inputCount !== 1;
}

/** @param {BlockPreviewTransaction} tx */
function hasOneOutput(tx) {
  return tx.outputCount === 1;
}

/** @param {BlockPreviewTransaction} tx */
function hasManyOutputs(tx) {
  return tx.outputCount !== 1;
}

const FILTERS = /** @type {const} */ ([
  { group: "version", label: "tx v1", key: "version:1", match: isVersion1 },
  { group: "version", label: "tx v2", key: "version:2", match: isVersion2 },
  { group: "version", label: "tx v3", key: "version:3", match: isVersion3 },
  { group: "rbf", label: "rbf", key: "rbf:yes", match: isRbf },
  { group: "rbf", label: "no rbf", key: "rbf:no", match: isNotRbf },
  { group: "input", label: "1 in", key: "input:one", match: hasOneInput },
  { group: "input", label: "multi in", key: "input:multi", match: hasManyInputs },
  { group: "output", label: "1 out", key: "output:one", match: hasOneOutput },
  { group: "output", label: "multi out", key: "output:multi", match: hasManyOutputs },
]);

const FILTER_GROUPS = /** @type {const} */ ([
  "version",
  "rbf",
  "input",
  "output",
]);

/** @param {number} version */
export function getVersionKey(version) {
  return `version:${version}`;
}

/**
 * @param {BlockPreviewTransaction} transaction
 */
export function getFilterKeys(transaction) {
  return FILTERS
    .filter(({ match }) => match(transaction))
    .map(({ key }) => key);
}

/**
 * @param {BlockPreviewTransaction[]} transactions
 */
function countFilters(transactions) {
  return new Map(FILTERS.map(({ key, match }) => {
    return [key, transactions.filter(match).length];
  }));
}

function createActiveFilters() {
  return new Map(FILTER_GROUPS.map((group) => {
    const keys = FILTERS
      .filter((filter) => filter.group === group)
      .map(({ key }) => String(key));

    return [group, new Set(keys)];
  }));
}

/**
 * @param {string[]} keys
 * @param {Map<string, Set<string>>} activeFilters
 */
function matchesActiveFilters(keys, activeFilters) {
  for (const group of FILTER_GROUPS) {
    const activeKeys = activeFilters.get(group);

    if ([...activeKeys ?? []].some((key) => keys.includes(key))) continue;

    return false;
  }

  return true;
}

/**
 * @param {HTMLButtonElement} button
 * @param {boolean} active
 */
function setActive(button, active) {
  button.setAttribute("aria-pressed", String(active));
  button.toggleAttribute("data-muted", !active);
}

/**
 * @param {HTMLButtonElement} button
 */
function setPending(button) {
  button.disabled = true;
  button.setAttribute("aria-pressed", "false");
  button.removeAttribute("data-muted");
}

/**
 * @param {BlockPreviewTransaction[]} transactions
 * @param {HTMLElement | null} heatmap
 * @param {Object} [options]
 * @param {boolean} [options.pending]
 */
export function createPreviewFilters(transactions, heatmap, options = {}) {
  const list = createLegendList({ scroll: true });
  const counts = countFilters(transactions);
  const pending = options.pending === true;
  const activeFilters = createActiveFilters();

  function updateCells() {
    const cells = /** @type {HTMLElement[]} */ ([
      ...heatmap?.querySelectorAll("[data-heatmap-cell]") ?? [],
    ]);

    for (const cell of cells) {
      const keys = cell.dataset.heatmapGroups?.split(" ") ?? [];
      const active = matchesActiveFilters(keys, activeFilters);

      cell.toggleAttribute("data-muted", !active);
    }
  }

  for (const filter of FILTERS) {
    const count = counts.get(filter.key) ?? 0;
    const { button, value } = createLegendItem({
      label: filter.label,
      color: "var(--white)",
      ariaLabel: filter.label,
    });

    value.textContent = pending ? "..." : formatNumber(count);
    if (pending) {
      setPending(button);
    } else {
      button.addEventListener("click", () => {
        const active = button.getAttribute("aria-pressed") !== "true";
        const activeKeys = /** @type {Set<string>} */ (
          activeFilters.get(filter.group)
        );

        setActive(button, active);
        if (active) activeKeys.add(filter.key);
        else activeKeys.delete(filter.key);
        updateCells();
      });
      setActive(button, true);
    }
    appendLegendListItem(list, button);
  }

  return list;
}

/** @typedef {import("./fees.js").BlockPreviewTransaction} BlockPreviewTransaction */
