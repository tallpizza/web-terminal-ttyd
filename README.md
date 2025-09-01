# Web Terminal MVP

Minimal implementation of a mobile‑friendly web terminal using Next.js and Go.

## Run locally

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

### Backend
```bash
cd apps/server
go run ./cmd/server
```

Set environment variables or copy `.env.example`.

## iOS tips
* Use `100dvh` for full height.
* Listen to `visualViewport` resize to refit xterm.
* Keep focus on the hidden textarea to avoid IME/dictation loss.

## Troubleshooting
* If the keyboard covers the cursor, tap the terminal to refocus and it will call `fit()`.
* Ensure SSH key has permission `0600`.

## Test Scenarios
1. Korean IME: type multi‑character syllables, backspace, commit/cancel.
2. Dictation: use iOS microphone and verify text reaches terminal.
3. Virtual keys: tap `Esc`, `Ctrl`+`C` etc.
4. Keyboard show/hide: screen resizes and terminal refits.
5. Session restore: reload page and confirm tmux reconnects.
6. Upload: send a 20MB image and see saved path alert.
7. Font glyphs: powerline icons render correctly.

## Security checklist
* Serve only via HTTPS/WSS.
* Validate upload paths and limit size (50MB).
* SSH private key permissions `0600`.
* Do not log command output.

## Operations checklist
* Use `tmux new -As dev` for persistent shell.
* Use Tailscale to reach host.
* Monitor server logs; rotate regularly.
