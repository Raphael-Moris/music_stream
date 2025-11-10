# Music Streaming Platform – SAE 3.02

Full-stack streaming & blind-test platform built for the IUT R&T (semester 3).  
Everything runs inside Docker so the experience is identical on Windows, macOS, and Linux.

---

## ✨ Main features

- JWT + Bcrypt authentication (signup/login).
- Music player, playlists management, user profile with Cloudinary avatar.
- BlindTest game (solo & multiplayer) powered by Socket.io.
- Admin dashboard (users/songs/playlists/stats).
- MongoDB dump (`Streaming_platform/`) auto-imported at startup.

---

## 🧱 Tech stack

| Layer     | Technologies                             |
|-----------|------------------------------------------|
| Backend   | Node.js 18, Express, Socket.io, Mongoose |
| Frontend  | HTML, CSS, vanilla JS                    |
| Storage   | MongoDB 7 (Docker volume), Cloudinary    |
| Auth      | JWT, Bcrypt                              |
| Infra     | Docker, Docker Compose                   |

---

## 📁 Repo layout

```
Projet/
├─ backend/            # Express routes, models, scripts
├─ frontend/           # Static pages + assets
├─ config/, data/, temp/
├─ Streaming_platform/ # BSON dump imported into Mongo
├─ docker-compose.yml
├─ Dockerfile
├─ init-mongo.sh       # automatic restore
├─ README-DOCKER.md    # deep dive / troubleshooting
└─ README.md           # quick guide (this file)
```

---

## ✅ Prerequisites

1. **Docker Desktop** (Windows/macOS) or **Docker Engine + Compose plugin** (Linux).  
   - Check: `docker --version` and `docker compose version`.
2. Internet connection (pull images + Cloudinary assets).
3. Git access to clone the repository.

---

## 🚀 Getting started (clone + Docker)

1. **Clone the repository**
   ```bash
   git clone git@github.com:Raphael-Moris/music_stream.git
   cd music_stream
   # or HTTPS:
   # git clone https://github.com/Raphael-Moris/music_stream.git
   ```

2. **Copy the Docker env file**
   ```bash
   # Windows PowerShell
   copy .env.docker .env
   # Linux / macOS
   cp .env.docker .env
   ```
   `.env.docker` already embeds the shared Cloudinary keys and Docker-internal Mongo URI.  
   No personal Cloudinary/MongoDB account is required to test.

3. **Start the stack**
   ```bash
   docker compose up --build
   ```
   - Pulls Node & Mongo images, builds the app.
   - Restores Mongo using `Streaming_platform/`.
   - Exposes the UI/API on `http://localhost:3500`.

4. **Test the application**
   - User UI: `http://localhost:3500`
   - Admin page: `http://localhost:3500/admin.html`
   - BlindTest: `http://localhost:3500/blindtest.html`
   - Test credentials: see `README-DOCKER.md` or check the `users` collection.

5. **Optional checks / diagnostics**
   ```bash
   docker compose ps
   docker compose logs -f app
   docker compose exec mongodb \
     mongosh Streaming_platform --eval "db.users.countDocuments()"
   ```

6. **Stop / restart**
   ```bash
   docker compose stop          # stop containers only
   docker compose up -d         # restart in background
   docker compose down -v       # full reset (containers + Mongo volume)
   ```

---

## 🧪 Quick verification list

- Visit `http://localhost:3500` and log in / play music.
- Upload a song (Cloudinary) and confirm it appears in Mongo.
- Launch a BlindTest session from `/blindtest.html`.
- Run `docker compose logs -f` to ensure no runtime errors.

---

## 🤝 Collaboration across OS

- Everyone uses the same Docker workflow above; no OS-specific tweaks.
- Before sharing a build (team mate / professor):
  1. Ensure `docker compose up --build` succeeds on your OS.
  2. Confirm Cloudinary upload + BlindTest still work.
  3. Update `README-DOCKER.md` if you changed the setup.
- Deliverables: either push to GitHub or send a `.zip`/`.tar.gz` including `Streaming_platform/`.

---

## 🛠️ Running without Docker (optional)

1. Install Node.js 18+ and MongoDB locally.
2. `npm install` (root folder).
3. Create `.env` (copy `.env.docker` then adjust `MONGODB_URI`).
4. Import the dump manually: `mongorestore --db Streaming_platform Streaming_platform/`.
5. Launch with `npm run dev` (nodemon).

Docker remains the reference environment for grading/demo.

---

## 📚 Support & docs

- `README-DOCKER.md` → advanced usage, troubleshooting, backup/restore tips.
- Utility scripts: `init-mongo.sh`, `fix-email-index.js`, `check-songs-duration.js`.
- Diagnostic page: `http://localhost:3500/diagnostic.html`.

---

© SAE 3.02 – IUT Réseaux & Télécommunications – Promotion 2025
