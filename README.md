<<<<<<< HEAD
# VAMP

VAMP is an Electron-based IDE for Luau scripts with licensing, sandboxed runtime, and admin tools.

Structure:
- `server/` — license API and runtime bridge
- `client/` — Electron + React UI
- `admin/` — license CLI

Dev quickstart:

1. Install dependencies: `npm install`
2. Start server: `npm run dev:server`
3. Start Electron (after building/serving client): `npm run dev:electron`

Building a Working Windows .exe (recommended via CI)

- The development environment here may block Electron binary extraction. To reliably produce a Windows installer (`.exe`) without local Electron issues, use the included GitHub Actions workflow which builds on a Windows runner and uploads the installer as an artifact.

Steps:

1. Commit and push this repository to GitHub.
2. Open the Actions tab and run the `Build Windows Installer` workflow (or wait for it on push to `main`).
3. When the workflow completes, download the `vamp-windows-installer` artifact containing the Windows installer `.exe`.

This avoids local permissions/antivirus problems and gives you a ready-to-run installer.

If you prefer a local build, run:

```powershell
npm install
npm run build
npm run build:win
```

Note: local packaging requires a working Electron install and may need administrator rights.
