import express from "express";
import fs from "fs-extra";
import path from "path";

const router = express.Router();
const DB = path.join(process.cwd(), "data.json");

// GET all moods
router.get("/", async (req, res) => {
  try {
    const db = await fs.readJson(DB);
    res.json(db.moods || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load moods" });
  }
});

// POST new mood
router.post("/", async (req, res) => {
  try {
    const { mood, note, time } = req.body;

    const db = await fs.readJson(DB);
    const record = {
      id: Date.now(),
      mood: mood || "",
      note: note || "",
      time: time || new Date().toISOString()
    };

    db.moods.push(record);

    await fs.writeJson(DB, db, { spaces: 2 });

    res.json({ message: "Mood saved", record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save mood" });
  }
});

export default router;
