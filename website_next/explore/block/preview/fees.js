export const FEE_BUCKETS = /** @type {const} */ ([
  { label: "min", color: "var(--cyan)" },
  { label: "10%", color: "var(--blue)" },
  { label: "25%", color: "var(--violet)" },
  { label: "50%", color: "var(--white)" },
  { label: "75%", color: "var(--yellow)" },
  { label: "90%", color: "var(--orange)" },
  { label: "max", color: "var(--red)" },
]);

/**
 * @param {number} feeRate
 * @param {number[]} ranges
 */
export function getFeeBucket(feeRate, ranges) {
  for (let index = 0; index < ranges.length; index += 1) {
    if (feeRate <= ranges[index]) return FEE_BUCKETS[index];
  }

  return FEE_BUCKETS[FEE_BUCKETS.length - 1];
}

/**
 * @param {BlockPreviewTransaction[]} transactions
 * @param {number[]} ranges
 */
export function countFees(transactions, ranges) {
  const counts = new Map();

  for (const transaction of transactions) {
    const bucket = getFeeBucket(transaction.feeRate, ranges);

    counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1);
  }

  return counts;
}

/**
 * @param {BlockPreviewTransaction[]} transactions
 */
export function orderTransactions(transactions) {
  return transactions
    .toSorted((a, b) => b.feeRate - a.feeRate || b.weight - a.weight);
}

/**
 * @typedef {Object} BlockPreviewTransaction
 * @property {string} txid
 * @property {number} version
 * @property {number} weight
 * @property {number} feeRate
 */
