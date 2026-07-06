import {
  appendLegendListItem,
  createLegendItem,
  createLegendList,
} from "../../../legend/index.js";
import { formatFeeRate } from "../../../utils/fee-rate.js";
import { formatNumber } from "../format.js";
import { countFees, FEE_BUCKETS } from "./fees.js";

/**
 * @param {BlockPreviewTransaction[]} transactions
 * @param {number[]} ranges
 */
export function createPreviewLegend(transactions, ranges) {
  const counts = countFees(transactions, ranges);
  const list = createLegendList({ scroll: true });

  for (let index = 0; index < FEE_BUCKETS.length; index += 1) {
    const bucket = FEE_BUCKETS[index];
    const count = counts.get(bucket.label) ?? 0;
    const { button, value } = createLegendItem({
      label: bucket.label,
      color: bucket.color,
      ariaLabel: `${bucket.label} fee rate bucket`,
      detail: `${formatFeeRate(ranges[index])} sat/vB`,
    });

    if (count === 0) button.dataset.muted = "";
    value.textContent = formatNumber(count);
    appendLegendListItem(list, button);
  }

  return list;
}

/** @typedef {import("./fees.js").BlockPreviewTransaction} BlockPreviewTransaction */
