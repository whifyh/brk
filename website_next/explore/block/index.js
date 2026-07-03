import { brk } from "../../utils/client.js";
import { createFeeChart } from "./fee-chart.js";

const SATS_PER_BTC = 100_000_000;

/** @typedef {Awaited<ReturnType<typeof brk.getBlocksV1>>[number]} Block */

/** @param {number} sats */
function formatBtc(sats) {
  return `${(sats / SATS_PER_BTC).toFixed(8)} BTC`;
}

/** @param {number} bytes */
function formatBytes(bytes) {
  return bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(2)} MB`
    : `${bytes.toLocaleString()} B`;
}

/** @param {number} rate */
function formatFeeRate(rate) {
  if (rate >= 1_000_000) return `${(rate / 1_000_000).toFixed(1)}M`;
  if (rate >= 100_000) return `${Math.round(rate / 1_000)}k`;
  if (rate >= 1_000) return `${(rate / 1_000).toFixed(1)}k`;
  if (rate >= 100) return Math.round(rate).toLocaleString();
  if (rate >= 10) return rate.toFixed(1);
  return rate.toFixed(2);
}

/** @param {number} unixSeconds */
function formatDateTime(unixSeconds) {
  return new Date(unixSeconds * 1_000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

/** @param {number} height */
function createHeightElement(height) {
  const element = document.createElement("span");
  const prefix = document.createElement("span");
  const value = document.createElement("span");

  prefix.classList.add("dim");
  prefix.textContent = `#${"0".repeat(Math.max(0, 7 - String(height).length))}`;
  value.textContent = String(height);
  element.append(prefix, value);

  return element;
}

/** @param {number} height */
function createTitle(height) {
  const label = document.createElement("span");
  const value = document.createElement("span");

  label.classList.add("title-label");
  value.classList.add("title-height");
  label.textContent = "Block";
  value.append(createHeightElement(height));

  return [label, value];
}

/** @param {string} value */
function code(value) {
  const element = document.createElement("code");

  element.textContent = value;

  return element;
}

/** @param {(string | Node | null)[]} values */
function joinValues(values) {
  const fragment = document.createDocumentFragment();
  let added = false;

  for (const value of values) {
    if (value == null || value === "") continue;
    if (added) fragment.append(" · ");
    fragment.append(value);
    added = true;
  }

  return added ? fragment : null;
}

/** @param {string[]} values */
function joinText(values) {
  return values.filter(Boolean).join(", ") || null;
}

/**
 * @param {string} term
 * @param {string | Node | null | undefined} value
 */
function createRow(term, value) {
  if (value == null || value === "") return null;

  const row = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");

  dt.textContent = term;
  dd.append(value);
  row.append(dt, dd);

  return row;
}

/** @param {string} title */
function groupName(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * @param {HTMLElement} parent
 * @param {string} title
 * @param {[string, string | Node | null | undefined][]} rows
 * @param {Node[]} [children]
 */
function appendGroup(parent, title, rows, children = []) {
  const visibleRows = rows.flatMap(([term, value]) => {
    const row = createRow(term, value);

    return row ? [row] : [];
  });

  if (!visibleRows.length && !children.length) return;

  const section = document.createElement("section");
  const heading = document.createElement("h2");

  section.dataset.group = groupName(title);
  heading.textContent = title;
  section.append(heading, ...children);
  if (visibleRows.length) {
    const list = document.createElement("dl");

    list.append(...visibleRows);
    section.append(list);
  }
  parent.append(section);
}

export function createBlockDetails() {
  const element = document.createElement("section");
  const header = document.createElement("header");
  const title = document.createElement("h1");
  const summary = document.createElement("p");
  const content = document.createElement("div");

  element.id = "block-details";
  element.hidden = true;
  header.append(title, summary);
  element.append(header, content);

  /** @param {Block} block */
  function update(block) {
    const extras = block.extras;

    element.hidden = false;
    title.replaceChildren(...createTitle(block.height));
    summary.replaceChildren(
      joinValues([
        extras.pool.name,
        formatDateTime(block.timestamp),
        `${block.txCount.toLocaleString()} txs`,
      ]) ?? "",
    );

    for (const chart of content.querySelectorAll("[data-fee-chart]")) {
      chart.dispatchEvent(new Event("chart:destroy"));
    }
    content.textContent = "";

    appendGroup(content, "Overview", [
      ["Hash", code(block.id)],
      ["Previous", code(block.previousblockhash)],
      ["Merkle root", code(block.merkleRoot)],
      ["Timestamp", formatDateTime(block.timestamp)],
      ["Median time", formatDateTime(block.mediantime)],
      ["Version", `0x${block.version.toString(16)}`],
      ["Bits", `0x${block.bits.toString(16)}`],
      ["Nonce", block.nonce.toLocaleString()],
      ["Difficulty", block.difficulty.toLocaleString()],
      ["Stale", block.stale ? "yes" : null],
    ]);

    appendGroup(content, "Mining", [
      ["Pool", extras.pool.name],
      ["Pool slug", extras.pool.slug],
      ["Miner names", joinText(extras.pool.minerNames ?? [])],
      ["Reward", formatBtc(extras.reward)],
      ["Total fees", formatBtc(extras.totalFees)],
      ["Price", `$${extras.price.toLocaleString()}`],
      ["Coinbase address", extras.coinbaseAddress ?? null],
      ["Coinbase addresses", joinText(extras.coinbaseAddresses)],
      ["Coinbase signature", extras.coinbaseSignatureAscii || null],
    ]);

    appendGroup(content, "Transactions", [
      ["Count", block.txCount.toLocaleString()],
      ["Inputs", extras.totalInputs.toLocaleString()],
      ["Outputs", extras.totalOutputs.toLocaleString()],
      ["Input amount", formatBtc(extras.totalInputAmt)],
      ["Output amount", formatBtc(extras.totalOutputAmt)],
      ["UTXO set change", extras.utxoSetChange.toLocaleString()],
      ["UTXO set size", extras.utxoSetSize.toLocaleString()],
      ["SegWit transactions", extras.segwitTotalTxs.toLocaleString()],
    ]);

    appendGroup(content, "Fees", [], [
      createFeeChart(extras.feeRange, extras.avgFeeRate, formatFeeRate),
    ]);

    appendGroup(content, "Size", [
      ["Size", formatBytes(block.size)],
      ["Weight", `${(block.weight / 1_000_000).toFixed(2)} MWU`],
      ["Virtual size", `${extras.virtualSize.toLocaleString()} vB`],
      ["Average tx size", formatBytes(extras.avgTxSize)],
      ["SegWit size", formatBytes(extras.segwitTotalSize)],
      ["SegWit weight", `${extras.segwitTotalWeight.toLocaleString()} WU`],
    ]);
  }

  return /** @type {const} */ ({
    element,
    update,
  });
}
