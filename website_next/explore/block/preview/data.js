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
  const [
    txids,
    versions,
    weights,
    feeRates,
  ] = await Promise.all([
    tx.raw.txid.by.tx_index.slice(start, end).fetch(),
    tx.raw.txVersion.by.tx_index.slice(start, end).fetch(),
    tx.size.weight.txIndex.by.tx_index.slice(start, end).fetch(),
    tx.fees.feeRate.by.tx_index.slice(start, end).fetch(),
  ]);

  return txids.data.map((txid, index) => ({
    txid,
    version: versions.data[index],
    weight: weights.data[index],
    feeRate: feeRates.data[index],
  }));
}
