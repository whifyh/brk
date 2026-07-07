import { brk } from "../../../utils/client.js";

/**
 * @param {import("../../../modules/brk-client/index.js").BlockInfoV1} block
 */
export async function loadBlockPreview(block) {
  const firstTxIndex = (
    await brk.series.transactions.raw.firstTxIndex.by.height
      .get(block.height)
      .fetch()
  ).data[0];
  const start = /** @type {number} */ (firstTxIndex);
  const end = start + block.txCount;
  const tx = brk.series.transactions;
  const indexes = brk.series.indexes.txIndex;
  const [
    txids,
    versions,
    weights,
    feeRates,
    rbfs,
    inputCounts,
    outputCounts,
  ] = await Promise.all([
    tx.raw.txid.by.tx_index.slice(start, end).fetch(),
    tx.raw.txVersion.by.tx_index.slice(start, end).fetch(),
    tx.size.weight.txIndex.by.tx_index.slice(start, end).fetch(),
    tx.fees.feeRate.by.tx_index.slice(start, end).fetch(),
    tx.raw.isExplicitlyRbf.by.tx_index.slice(start, end).fetch(),
    indexes.inputCount.by.tx_index.slice(start, end).fetch(),
    indexes.outputCount.by.tx_index.slice(start, end).fetch(),
  ]);

  return txids.data.map((txid, index) => ({
    txid,
    version: versions.data[index],
    weight: weights.data[index],
    feeRate: feeRates.data[index],
    rbf: rbfs.data[index],
    inputCount: inputCounts.data[index],
    outputCount: outputCounts.data[index],
  }));
}
