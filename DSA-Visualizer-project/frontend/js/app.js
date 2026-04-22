/**
 * CodeNakshatra DSA Visualizer — Frontend JS
 * Utkarsh Gupta | ABES Engineering College
 *
 * Connects to the Node/C++ backend, renders step-by-step
 * visualizations, manages playback & UI state.
 */

"use strict";

// ─── Config ───────────────────────────────────────────────────────────────────

const API = "http://localhost:3000/api";
const PSEUDOCODE = {
  bubble:    `bubbleSort(arr):\n  for i = 0 to n-1:\n    for j = 0 to n-i-2:\n      if arr[j] > arr[j+1]:\n        swap(arr[j], arr[j+1])`,
  selection: `selectionSort(arr):\n  for i = 0 to n-1:\n    minIdx = i\n    for j = i+1 to n:\n      if arr[j] < arr[minIdx]:\n        minIdx = j\n    swap(arr[i], arr[minIdx])`,
  insertion: `insertionSort(arr):\n  for i = 1 to n:\n    key = arr[i]; j = i-1\n    while j >= 0 and arr[j] > key:\n      arr[j+1] = arr[j]; j--\n    arr[j+1] = key`,
  merge:     `mergeSort(arr, l, r):\n  if l >= r: return\n  mid = (l+r)/2\n  mergeSort(arr, l, mid)\n  mergeSort(arr, mid+1, r)\n  merge(arr, l, mid, r)`,
  quick:     `quickSort(arr, low, high):\n  if low < high:\n    pi = partition(arr, low, high)\n    quickSort(arr, low, pi-1)\n    quickSort(arr, pi+1, high)`,
  binary_search: `binarySearch(arr, target):\n  left=0, right=n-1\n  while left <= right:\n    mid = (left+right)/2\n    if arr[mid] == target: return mid\n    elif arr[mid] < target: left = mid+1\n    else: right = mid-1\n  return -1`,
};

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  steps: [], currentStep: 0, isPlaying: false, playTimer: null,
  type: "sort", currentAlgo: "bubble", currentOp: "reverse", speed: 700,
};

// ─── DOM ──────────────────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const vizArea      = $("#viz-area");
const descText     = $("#desc-text");
const descStep     = $("#desc-step");
const descPseudo   = $("#desc-pseudo");
const pbPlay       = $("#pb-play");
const pbFill       = $("#pb-fill");
const pbCounter    = $("#pb-counter");
const statAlgo     = $("#stat-algo");
const statSteps    = $("#stat-steps");
const statCmp      = $("#stat-cmp");
const statSwaps    = $("#stat-swaps");
const statTime     = $("#stat-time");

// ─── Navigation ───────────────────────────────────────────────────────────────

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const sec = btn.dataset.section;
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`section-${sec}`).classList.add("active");
  });
});

// ─── Category Tabs ────────────────────────────────────────────────────────────

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const cat = tab.dataset.cat;
    document.querySelectorAll(".controls-block").forEach(b => b.classList.remove("active"));
    document.getElementById(`ctrl-${cat}`).classList.add("active");
    state.type = cat;
    resetViz();
  });
});

// ─── Algorithm Buttons ────────────────────────────────────────────────────────

document.querySelectorAll("#ctrl-sorting .algo-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#ctrl-sorting .algo-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.currentAlgo = btn.dataset.algo;
  });
});
document.querySelectorAll("#ctrl-linkedlist .algo-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#ctrl-linkedlist .algo-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.currentOp = btn.dataset.op;
  });
});

// ─── Array Generators ────────────────────────────────────────────────────────

$("#sort-random").addEventListener("click", () => {
  const arr = Array.from({length: 10}, () => Math.floor(Math.random() * 95) + 5);
  $("#sort-input").value = arr.join(", ");
});
$("#sort-nearly").addEventListener("click", () => {
  const arr = Array.from({length: 10}, (_, i) => (i + 1) * 8 + Math.floor(Math.random() * 10) - 5);
  $("#sort-input").value = arr.join(", ");
});
$("#sort-reverse").addEventListener("click", () => {
  const arr = Array.from({length: 10}, (_, i) => 90 - i * 8);
  $("#sort-input").value = arr.join(", ");
});

// ─── Speed Slider ────────────────────────────────────────────────────────────

$("#speed-slider").addEventListener("input", e => {
  state.speed = parseInt(e.target.value);
});

// ─── Run Buttons ─────────────────────────────────────────────────────────────

$("#run-sort").addEventListener("click", runSort);
$("#run-search").addEventListener("click", runSearch);
$("#run-ll").addEventListener("click", runLinkedList);
$("#run-stack").addEventListener("click", runStack);

// ─── Playback ────────────────────────────────────────────────────────────────

$("#pb-play").addEventListener("click", togglePlay);
$("#pb-first").addEventListener("click", () => { stopPlay(); gotoStep(0); });
$("#pb-last").addEventListener("click", () => { stopPlay(); gotoStep(state.steps.length - 1); });
$("#pb-prev").addEventListener("click", () => { stopPlay(); gotoStep(state.currentStep - 1); });
$("#pb-next").addEventListener("click", () => { stopPlay(); gotoStep(state.currentStep + 1); });

// ─── API Calls ────────────────────────────────────────────────────────────────

async function runSort() {
  const raw = $("#sort-input").value;
  const arr = raw.split(/[,\s]+/).map(Number).filter(x => !isNaN(x));
  if (arr.length < 2 || arr.length > 20) return showError("Array must have 2–20 integers.");

  showLoading(true);
  disableRunBtn("#run-sort", true);
  try {
    const res = await fetch(`${API}/sort/${state.currentAlgo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ array: arr }),
    });
    const data = await res.json();
    if (!res.ok) return showError(data.error);

    updateStats(data);
    showComplexity(data.complexity);
    showPseudo(state.currentAlgo);
    loadSteps(data.steps, "sort");
    autoPlay();
  } catch (e) {
    showError("Cannot reach server. Is it running? → cd backend && node server.js");
  } finally {
    showLoading(false);
    disableRunBtn("#run-sort", false);
  }
}

async function runSearch() {
  const raw = $("#search-input").value;
  const arr = raw.split(/[,\s]+/).map(Number).filter(x => !isNaN(x));
  const target = parseInt($("#search-target").value);
  if (arr.length < 2) return showError("Provide at least 2 numbers.");
  if (isNaN(target)) return showError("Enter a valid target integer.");

  showLoading(true);
  disableRunBtn("#run-search", true);
  try {
    const res = await fetch(`${API}/search/binary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ array: arr, target }),
    });
    const data = await res.json();
    if (!res.ok) return showError(data.error);

    updateStats({ ...data, totalSwaps: 0, algorithm: "binary_search" });
    showComplexity(data.complexity);
    showPseudo("binary_search");
    loadSteps(data.steps, "sort");
    autoPlay();
  } catch (e) {
    showError("Cannot reach server. Is it running?");
  } finally {
    showLoading(false);
    disableRunBtn("#run-search", false);
  }
}

async function runLinkedList() {
  const raw = $("#ll-input").value;
  const nodes = raw.split(/[,\s]+/).map(Number).filter(x => !isNaN(x));
  const value = parseInt($("#ll-value").value) || 0;
  if (nodes.length < 1) return showError("Enter at least 1 node.");

  showLoading(true);
  disableRunBtn("#run-ll", true);
  try {
    const res = await fetch(`${API}/linkedlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, operation: state.currentOp, value }),
    });
    const data = await res.json();
    if (!res.ok) return showError(data.error);

    updateStats({ algorithm: "linked_list", totalSteps: data.steps.length, totalComparisons: 0, totalSwaps: 0 });
    hideComplexity();
    hidePseudo();
    loadSteps(data.steps, "linkedlist");
    autoPlay();
  } catch (e) {
    showError("Cannot reach server. Is it running?");
  } finally {
    showLoading(false);
    disableRunBtn("#run-ll", false);
  }
}

async function runStack() {
  const raw = $("#stack-ops").value.trim().split("\n").map(s => s.trim()).filter(Boolean);
  if (raw.length === 0) return showError("Enter at least one operation.");

  // Convert to API format: push:5 stays push:5 for frontend, but we validate here
  const valid = raw.every(op => op === "pop" || op === "peek" || /^push:\d+$/.test(op));
  if (!valid) return showError("Valid ops only: push:N, pop, peek");

  showLoading(true);
  disableRunBtn("#run-stack", true);
  try {
    const res = await fetch(`${API}/stack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operations: raw }),
    });
    const data = await res.json();
    if (!res.ok) return showError(data.error);

    updateStats({ algorithm: "stack", totalSteps: data.steps.length, totalComparisons: 0, totalSwaps: 0 });
    hideComplexity();
    hidePseudo();
    loadSteps(data.steps, "stack");
    autoPlay();
  } catch (e) {
    showError("Cannot reach server. Is it running?");
  } finally {
    showLoading(false);
    disableRunBtn("#run-stack", false);
  }
}

// ─── Step Management ──────────────────────────────────────────────────────────

function loadSteps(steps, type) {
  state.steps = steps;
  state.currentStep = 0;
  state.type = type;
  stopPlay();
  renderStep(0);
  updatePlayback();
}

function gotoStep(n) {
  n = Math.max(0, Math.min(n, state.steps.length - 1));
  state.currentStep = n;
  renderStep(n);
  updatePlayback();
}

function togglePlay() {
  state.isPlaying ? stopPlay() : startPlay();
}

function startPlay() {
  if (state.currentStep >= state.steps.length - 1) gotoStep(0);
  state.isPlaying = true;
  pbPlay.textContent = "⏸";
  pbPlay.classList.add("playing");
  scheduleNext();
}

function stopPlay() {
  state.isPlaying = false;
  if (state.playTimer) { clearTimeout(state.playTimer); state.playTimer = null; }
  pbPlay.textContent = "▶";
  pbPlay.classList.remove("playing");
}

function scheduleNext() {
  if (!state.isPlaying) return;
  if (state.currentStep >= state.steps.length - 1) { stopPlay(); return; }
  state.playTimer = setTimeout(() => {
    gotoStep(state.currentStep + 1);
    scheduleNext();
  }, state.speed);
}

function autoPlay() {
  setTimeout(startPlay, 200);
}

function updatePlayback() {
  const total = state.steps.length;
  const cur = state.currentStep;
  pbCounter.textContent = `${cur + 1} / ${total}`;
  pbFill.style.width = total > 1 ? `${(cur / (total - 1)) * 100}%` : "100%";
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderStep(idx) {
  const step = state.steps[idx];
  if (!step) return;

  // Update description
  descStep.textContent = `Step ${idx + 1}`;
  descText.textContent = step.desc || step.description || "";
  descPseudo.textContent = step.pseudo || "";

  if (state.type === "sort" || state.type === "searching") {
    renderBars(step.arr);
  } else if (state.type === "linkedlist") {
    renderLinkedList(step.nodes);
    descText.textContent = step.desc;
  } else if (state.type === "stack") {
    renderStack(step.stack);
    descText.textContent = step.desc;
  }
}

function renderBars(items) {
  if (!items || !items.length) return;
  const placeholder = vizArea.querySelector(".viz-placeholder");
  if (placeholder) placeholder.style.display = "none";

  // Remove old bars
  vizArea.querySelectorAll(".bar-wrap,.legend").forEach(el => el.remove());

  const maxVal = Math.max(...items.map(b => b.val));
  const availH = vizArea.clientHeight - 60;

  // Legend
  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `
    <div class="legend-item"><div class="legend-dot" style="background:var(--c-default)"></div>Default</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--c-comparing)"></div>Comparing</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--c-swapping)"></div>Swapping</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--c-sorted)"></div>Sorted</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--c-pivot)"></div>Pivot/Found</div>
  `;
  vizArea.appendChild(legend);

  items.forEach(item => {
    const wrap = document.createElement("div");
    wrap.className = "bar-wrap";

    const bar = document.createElement("div");
    bar.className = `bar ${item.color || "default"}`;
    bar.style.height = `${Math.max(14, (item.val / maxVal) * availH)}px`;

    const val = document.createElement("div");
    val.className = "bar-val";
    val.textContent = item.val;

    wrap.appendChild(bar);
    wrap.appendChild(val);
    vizArea.appendChild(wrap);
  });
}

function renderLinkedList(nodes) {
  vizArea.querySelectorAll(".ll-container,.viz-placeholder,.legend").forEach(e => e.remove());
  if (!nodes || !nodes.length) return;

  const container = document.createElement("div");
  container.className = "ll-container";

  nodes.forEach((node, i) => {
    const wrap = document.createElement("div");
    wrap.className = "ll-node-wrap";

    const nodeEl = document.createElement("div");
    nodeEl.className = `ll-node${node.highlight ? " active" : ""}${i === 0 ? " head-label" : ""}`;
    nodeEl.textContent = node.val;
    wrap.appendChild(nodeEl);

    if (i < nodes.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "ll-arrow";
      arrow.textContent = "→";
      wrap.appendChild(arrow);
    }
    container.appendChild(wrap);
  });

  const nullEl = document.createElement("span");
  nullEl.className = "ll-null";
  nullEl.textContent = "→ NULL";
  container.appendChild(nullEl);

  vizArea.style.alignItems = "center";
  vizArea.style.justifyContent = "center";
  vizArea.appendChild(container);
}

function renderStack(items) {
  vizArea.querySelectorAll(".stack-container,.viz-placeholder,.legend").forEach(e => e.remove());

  const container = document.createElement("div");
  container.className = "stack-container";

  if (!items || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "stack-empty";
    empty.textContent = "[ empty stack ]";
    container.appendChild(empty);
  } else {
    items.forEach((val, i) => {
      const item = document.createElement("div");
      item.className = `stack-item${i === items.length - 1 ? " top-item" : ""}`;
      item.textContent = val;
      if (i === items.length - 1) {
        const tag = document.createElement("span");
        tag.className = "top-tag";
        tag.textContent = "← TOP";
        item.appendChild(tag);
      }
      container.appendChild(item);
    });
  }

  const base = document.createElement("div");
  base.className = "stack-base";
  container.appendChild(base);

  vizArea.style.alignItems = "center";
  vizArea.style.justifyContent = "center";
  vizArea.appendChild(container);
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function updateStats(data) {
  statAlgo.textContent  = (data.algorithm || "—").replace("_", " ").toUpperCase();
  statSteps.textContent = data.totalSteps   ?? "—";
  statCmp.textContent   = data.totalComparisons ?? "—";
  statSwaps.textContent = data.totalSwaps   ?? "—";
  statTime.textContent  = data.timeMs != null ? `${data.timeMs.toFixed(3)} ms` : "—";
}

function showComplexity(cx) {
  if (!cx) return;
  const card = $("#complexity-card");
  card.style.display = "flex";
  $("#cx-best").textContent  = cx.best   || "—";
  $("#cx-avg").textContent   = cx.average|| "—";
  $("#cx-worst").textContent = cx.worst  || "—";
  $("#cx-space").textContent = cx.space  || "—";
}

function hideComplexity() { $("#complexity-card").style.display = "none"; }

function showPseudo(algo) {
  const panel = $("#pseudo-panel");
  const code  = $("#pseudo-code");
  if (!PSEUDOCODE[algo]) { panel.style.display = "none"; return; }
  panel.style.display = "block";
  code.textContent = PSEUDOCODE[algo];
}
function hidePseudo() { $("#pseudo-panel").style.display = "none"; }

function resetViz() {
  stopPlay();
  state.steps = []; state.currentStep = 0;
  vizArea.innerHTML = `<div class="viz-placeholder">
    <div class="placeholder-icon">◈</div>
    <p>Select an algorithm and click <strong>Visualize</strong></p>
    <p class="sub">Powered by a C++ engine — real O(n) execution, step-by-step traces</p>
  </div>`;
  vizArea.style.alignItems = "flex-end";
  vizArea.style.justifyContent = "center";
  descText.textContent = "Waiting…";
  descPseudo.textContent = "";
  descStep.textContent = "Step 0";
  pbFill.style.width = "0%";
  pbCounter.textContent = "0 / 0";
  statAlgo.textContent = statSteps.textContent = statCmp.textContent = statSwaps.textContent = statTime.textContent = "—";
  hideComplexity();
  hidePseudo();
}

function showLoading(show) {
  vizArea.querySelectorAll(".loading-overlay").forEach(e => e.remove());
  if (show) {
    const ov = document.createElement("div");
    ov.className = "loading-overlay";
    ov.innerHTML = `<div class="spinner"></div><div class="loading-text">C++ engine computing…</div>`;
    vizArea.appendChild(ov);
  }
}

function disableRunBtn(sel, disabled) {
  const btn = $(sel);
  if (btn) { btn.disabled = disabled; btn.textContent = disabled ? "Running…" : btn.textContent.replace("Running…", "▶ Visualize"); }
}

const toast = document.createElement("div");
toast.className = "toast";
document.body.appendChild(toast);

function showError(msg) {
  toast.textContent = "⚠ " + msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
  showLoading(false);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

resetViz();

// Check server health on load
fetch(`${API}/health`)
  .then(r => r.json())
  .then(d => console.log(`✅ ${d.platform || "CodeNakshatra"} — C++ engine connected`))
  .catch(() => console.warn("⚠ Backend not reachable. Start with: cd backend && node server.js"));
