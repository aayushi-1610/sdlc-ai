const express = require("express");
const router = express.Router();
const { getSessionMeta, createSession } = require("../services/analysisPipeline");

// Seed a session for testing / verification (Analysis → Design handoff)
router.post("/seed", (req, res) => {
  const data = req.body;
  if (!data || !data.extracted) {
    return res.status(400).json({ error: "Request body must include analysis artefacts (at least 'extracted')." });
  }
  const sessionId = createSession(data);
  res.json({ sessionId, expiresInHours: 2 });
});

router.get("/:sessionId", (req, res) => {
  if (req.params.sessionId === "seed") return res.status(405).json({ error: "Use POST /api/session/seed" });
  const meta = getSessionMeta(req.params.sessionId);
  if (!meta) {
    return res.status(404).json({ error: "Session not found or expired. Run Analysis Phase again." });
  }
  res.json(meta);
});

module.exports = router;
