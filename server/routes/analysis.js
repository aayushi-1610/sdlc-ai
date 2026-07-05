// server/routes/analysis.js
const express = require("express");
const router = express.Router();

router.get("/stream", async (req, res) => {
  const { requirements } = req.query;
  if (!requirements) {
    return res.status(400).json({ error: "Requirements text required" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event, data) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const pipeline = require("../services/analysisPipeline");
    await pipeline.runAnalysisPipeline(requirements, send);
  } catch (err) {
    console.error(err);
    send("error", { message: err.message });
  }

  // Close SSE stream
  res.end();
});

module.exports = router;
