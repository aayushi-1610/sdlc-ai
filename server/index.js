const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const analysisRouter = require("./routes/analysis");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/analysis", analysisRouter);

app.get("*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SDLC Platform running on port ${PORT}`));
