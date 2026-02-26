import express from "express";
const router = express.Router();

const playlists = {
  happy: "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0",
  calm: "https://open.spotify.com/playlist/37i9dQZF1DWXLeA8Omikj7",
  sad: "https://open.spotify.com/playlist/37i9dQZF1DWSqBruwoIXkA",
  stressed: "https://open.spotify.com/playlist/37i9dQZF1DX3YSRoSdA634"
};

router.get("/:mood", (req, res) => {
  const mood = req.params.mood;

  if (playlists[mood]) {
    return res.json({ playlist: playlists[mood] });
  }

  return res.json({ playlist: null });
});

export default router;
