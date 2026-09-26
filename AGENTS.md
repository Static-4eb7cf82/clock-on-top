# Project Notes

- Windows desktop clock built with Tauri 2, React, TypeScript, and Vite.
- Frontend code is in `app/src` (`components`, `hooks`, and `utils`); Rust/Tauri code is in `app/src-tauri/src`.
- The root `mise.toml` selects Node LTS and Rust stable. Run tools with `mise exec --` or use the VS Code tasks.
- Install tools with `mise install`; install frontend packages with `npm ci` from `app`; fetch Rust crates with `cargo fetch` from `app/src-tauri`.
- Validate with `npm run build` from `app` and `cargo check` from `app/src-tauri`. VS Code's `check: all builds` runs both.
- Keep `app/package-lock.json` and `app/src-tauri/Cargo.lock` authoritative; avoid unintended dependency or lockfile updates.