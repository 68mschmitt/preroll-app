import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const app = express();
app.use(cors());
app.use(express.json());

const ENABLED_DIR = '/app/server/preroll/enabled';
const DISABLED_DIR = '/app/server/preroll/disabled';

for (const d of [ENABLED_DIR, DISABLED_DIR]) {
  if (!existsSync(d)) await fs.mkdir(d, { recursive: true });
}

const isYouTube = (url) => {
  try {
    const u = new URL(url);
    return ['www.youtube.com','youtube.com','youtu.be','m.youtube.com'].includes(u.hostname);
  } catch { return false; }
};

const extractYouTubeId = (url) => {
  const u = new URL(url);
  if (u.hostname === 'youtu.be') return u.pathname.slice(1);
  if (u.searchParams.has('v')) return u.searchParams.get('v');
  // Shorts /embed fallback
  const m = u.pathname.match(/\/(shorts|embed)\/([^/?#]+)/);
  if (m) return m[2];
  return null;
};

const listMp4 = async (dir) =>
  (await fs.readdir(dir)).filter(f => f.toLowerCase().endsWith('.mp4'));

const statList = async (dir, kind) => {
  const files = await listMp4(dir);
  const items = await Promise.all(files.map(async f => {
    const p = path.join(dir, f);
    const s = await fs.stat(p);
    const id = path.parse(f).name; // ytid
    return {
      id,
      file: f,
      absPath: p,
      enabled: kind === 'enabled',
      mtimeMs: s.mtimeMs,
      size: s.size,
      // YouTube thumbnails (client can try maxres then fallback to hq):
      thumbMax: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      thumbHQ:  `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    };
  }));
  return items;
};

import updateCinemaTrailersPrerollID from './plexUtils.js';

const updatePlexPreroll = async () => {
  const enabled = await listMp4(ENABLED_DIR);
  // Absolute paths, comma-separated (sequential play)
  const value = enabled
    .map(f => path.join(ENABLED_DIR, f))
    .join(';');

  const configFilePath = path.resolve('./preroll/plex-config/Preferences.xml');
  updateCinemaTrailersPrerollID(configFilePath, value);
};

const listAll = async () => {
  const [en, dis] = await Promise.all([
    statList(ENABLED_DIR, 'enabled'),
    statList(DISABLED_DIR, 'disabled')
  ]);
  // Sort newest first by mtime
  return [...en, ...dis].sort((a,b) => b.mtimeMs - a.mtimeMs);
};

// ---------- Routes ----------

// List videos
app.get('/api/videos', async (_req, res) => {
  try { res.json(await listAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Import a single YouTube URL
app.post('/api/import', async (req, res) => {
  const { url } = req.body || {};
  if (!url || !isYouTube(url)) return res.status(400).json({ error: 'Provide a YouTube video URL.' });

  // extract id and reject playlists
  const id = extractYouTubeId(url);
  if (!id) return res.status(400).json({ error: 'Could not parse YouTube video ID.' });
  if (/list=/.test(url)) return res.status(400).json({ error: 'Playlists are not allowed.' });

  const targetA = path.join(ENABLED_DIR,  `${id}.mp4`);
  const targetB = path.join(DISABLED_DIR, `${id}.mp4`);
  if (existsSync(targetA) || existsSync(targetB)) return res.status(409).json({ error: 'Duplicate video (already downloaded).' });

  // Download into DISABLED by default; user can enable via toggle
  const outTemplate = path.join(DISABLED_DIR, `${id}.%(ext)s`);

  const args = [
    '--no-playlist',
    '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',
    '--merge-output-format', 'mp4',
    '-o', outTemplate,
    url
  ];

  console.log(`Starting import for video with ID: ${id}`);
  const child = spawn('yt-dlp', args, { stdio: ['ignore','pipe','pipe'] });
  let logs = '';
  child.stdout.on('data', d => logs += d.toString());
  child.stderr.on('data', d => logs += d.toString());
  child.on('close', async (code) => {
    if (code !== 0) return res.status(500).json({ error: `yt-dlp failed (${code})`, logs });
    try {
      res.json({ ok: true, id });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

// Toggle enable/disable
app.patch('/api/videos/:id/toggle', async (req, res) => {
  const { enabled } = req.body || {};
  const id = req.params.id;
  const from = enabled ? path.join(DISABLED_DIR, `${id}.mp4`) : path.join(ENABLED_DIR, `${id}.mp4`);
  const to   = enabled ? path.join(ENABLED_DIR, `${id}.mp4`)  : path.join(DISABLED_DIR, `${id}.mp4`);

  try {
    if (!existsSync(from)) return res.status(404).json({ error: 'File not found in source folder.' });
    await fs.rename(from, to);
    console.log(`File moved to ${to}`);
    await updatePlexPreroll();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete
app.delete('/api/videos/:id', async (req, res) => {
  const id = req.params.id;
  const p1 = path.join(ENABLED_DIR, `${id}.mp4`);
      const p2 = path.join(DISABLED_DIR, `${id}.mp4`);
      console.log(`Attempting to delete files at paths: ${p1} and ${p2}`);
  try {
    if (existsSync(p1)) {
      await fs.rm(p1);
      console.log(`Deleted file at path: ${p1}`);
    }
    else if (existsSync(p2)) {
      await fs.rm(p2);
      console.log(`Deleted file at path: ${p2}`);
    }
    else return res.status(404).json({ error: 'Not found.' });

    await updatePlexPreroll();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bulk enable/disable
app.post('/api/enableAll', async (_req, res) => {
  try {
    const files = await listMp4(DISABLED_DIR);
    await Promise.all(files.map(f => fs.rename(path.join(DISABLED_DIR, f), path.join(ENABLED_DIR, f))));
    await updatePlexPreroll();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/disableAll', async (_req, res) => {
  try {
    const files = await listMp4(ENABLED_DIR);
    await Promise.all(files.map(f => fs.rename(path.join(ENABLED_DIR, f), path.join(DISABLED_DIR, f))));
    await updatePlexPreroll();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = 5175;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
