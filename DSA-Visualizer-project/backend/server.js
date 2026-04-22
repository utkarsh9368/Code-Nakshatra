/**
 * CodeNakshatra DSA Visualizer - API Server
 * Author: Utkarsh Gupta | ABES Engineering College
 *
 * Node.js server that exposes REST API endpoints.
 * Each endpoint spawns the C++ dsa_engine binary and
 * streams back step-by-step visualization data as JSON.
 */

const express = require("express");
const { execFile } = require("child_process");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Path to compiled C++ binary
const ENGINE = path.join(__dirname, "dsa_engine");

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// ─── Helper: Run C++ Engine ───────────────────────────────────────────────────

function runEngine(algo, input) {
  return new Promise((resolve, reject) => {
    execFile(ENGINE, [algo, input], { timeout: 5000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(new Error("C++ engine returned invalid JSON"));
      }
    });
  });
}

// ─── Input Validators ─────────────────────────────────────────────────────────

function validateArray(arr) {
  if (!Array.isArray(arr)) return "Expected an array";
  if (arr.length < 2 || arr.length > 20) return "Array must have 2–20 elements";
  if (!arr.every((x) => Number.isInteger(x) && x >= -9999 && x <= 9999))
    return "Elements must be integers in [-9999, 9999]";
  return null;
}

// ─── Sorting Endpoints ────────────────────────────────────────────────────────

const SORT_ALGOS = ["bubble", "selection", "insertion", "merge", "quick"];

SORT_ALGOS.forEach((algo) => {
  app.post(`/api/sort/${algo}`, async (req, res) => {
    const { array } = req.body;
    const err = validateArray(array);
    if (err) return res.status(400).json({ error: err });

    try {
      const result = await runEngine(algo, array.join(","));
      res.json({
        success: true,
        algorithm: algo,
        complexity: getComplexity(algo),
        ...result,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// ─── Search Endpoint ──────────────────────────────────────────────────────────

app.post("/api/search/binary", async (req, res) => {
  const { array, target } = req.body;
  const err = validateArray(array);
  if (err) return res.status(400).json({ error: err });
  if (!Number.isInteger(target)) return res.status(400).json({ error: "target must be an integer" });

  try {
    const result = await runEngine("binary_search", `${array.join(",")}|${target}`);
    res.json({ success: true, algorithm: "binary_search", complexity: getComplexity("binary_search"), ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Linked List Endpoint ─────────────────────────────────────────────────────

app.post("/api/linkedlist", async (req, res) => {
  const { nodes, operation, value } = req.body;
  const validOps = ["reverse", "search", "insert_head", "insert_tail", "delete_head"];
  if (!validOps.includes(operation))
    return res.status(400).json({ error: "Invalid operation. Choose: " + validOps.join(", ") });
  if (!Array.isArray(nodes) || nodes.length < 1 || nodes.length > 12)
    return res.status(400).json({ error: "Nodes array must have 1–12 integers" });

  try {
    const input = `${nodes.join(",")}|${operation}|${value ?? 0}`;
    const result = await runEngine("linked_list", input);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Stack Endpoint ───────────────────────────────────────────────────────────

app.post("/api/stack", async (req, res) => {
  const { operations } = req.body;
  if (!Array.isArray(operations) || operations.length === 0)
    return res.status(400).json({ error: "Provide an array of operations" });

  const valid = operations.every((op) =>
    op === "pop" || op === "peek" || /^push:\d+$/.test(op)
  );
  if (!valid)
    return res.status(400).json({ error: "Operations: 'pop', 'peek', or 'push:N'" });

  try {
    // Reformat push:5 → push 5 for C++
    const formatted = operations.map((o) => o.replace("push:", "push "));
    const result = await runEngine("stack", formatted.join(","));
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Complexity Reference ─────────────────────────────────────────────────────

app.get("/api/complexity", (req, res) => {
  res.json({
    bubble:      { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)", stable: true },
    selection:   { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)", stable: false },
    insertion:   { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)", stable: true },
    merge:       { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", stable: true },
    quick:       { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)", stable: false },
    binary_search:{ best: "O(1)", average: "O(log n)", worst: "O(log n)", space: "O(1)", stable: true },
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", engine: "C++ g++ -O2", version: "1.0.0", author: "Utkarsh Gupta" });
});

// Serve frontend for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ─── Big-O Lookup ─────────────────────────────────────────────────────────────

function getComplexity(algo) {
  const map = {
    bubble:       { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
    selection:    { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
    insertion:    { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
    merge:        { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
    quick:        { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
    binary_search:{ best: "O(1)", average: "O(log n)", worst: "O(log n)", space: "O(1)" },
  };
  return map[algo] || {};
}

app.listen(PORT, () => {
  console.log(`\n🌟 CodeNakshatra DSA Visualizer`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🖥️  Frontend: http://localhost:${PORT}`);
  console.log(`⚙️  Engine: C++ (g++ -O2 -std=c++17)\n`);
});
