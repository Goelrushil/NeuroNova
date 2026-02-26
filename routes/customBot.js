import express from "express";
import fs from "fs-extra";
import path from "path";

const router = express.Router();
const DB = path.join(process.cwd(), "data.json");

// GET existing bot
router.get("/", async (req, res) => {
  try {
    const db = await fs.readJson(DB);
    res.json(db.customBot);
  } catch (err) {
    console.error("GET /custom-bot error:", err);
    res.status(500).json({ error: "Failed to load custom bot" });
  }
});

// SAVE bot
router.post("/", async (req, res) => {
  try {
    const { personality, tone, instructions } = req.body;

    const db = await fs.readJson(DB);

    db.customBot = {
      personality: personality || "",
      tone: tone || "",
      instructions: instructions || ""
    };

    await fs.writeJson(DB, db, { spaces: 2 });

    res.json({ message: "Custom bot saved!", customBot: db.customBot });
  } catch (err) {
    console.error("POST /custom-bot error:", err);
    res.status(500).json({ error: "Failed to save custom bot" });
  }
});

export default router;
