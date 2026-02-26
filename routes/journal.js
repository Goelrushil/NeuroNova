import express from "express";
import fs from "fs-extra";
import path from "path";
const router = express.Router();
const DB = path.join(process.cwd(), "data.json");
router.post("/", async (req, res) => {
  const db = await fs.readJson(DB);
  db.journals.push(req.body);
  await fs.writeJson(DB, db, { spaces: 2 });
  res.json({ message: "Journal saved" });
});
router.get("/", async (req, res) => {
  const db = await fs.readJson(DB);
  res.json(db.journals);
});
export default router;
