// server/routes/design.js
const express = require("express");
const router = express.Router();

router.get("/stream", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required. Run Analysis Phase first." });
  }

  // Retrieve analysis data from session store
  const { getSession } = require("../services/analysisPipeline");
  const analysisData = getSession(sessionId);

  if (!analysisData) {
    return res.status(404).json({ error: "Session not found or expired. Please run Analysis Phase again." });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event, data) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const designPipeline = require("../services/designPipeline");
    await designPipeline.runDesignPipeline(analysisData, send);
  } catch (err) {
    console.error("[design route] Pipeline error:", err);
    send("design_error", { message: err.message });
  }

  res.end();
});

module.exports = router;
