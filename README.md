# R2 Uploader

A privacy-first, minimalist desktop tool designed to help you quickly upload images to Cloudflare R2 storage.

Built with a security-first mindset — all credentials are stored locally and masked by default. While optimized for image workflows (drag, drop, get URL), it supports uploading any file type to R2.

## Features

- **Drag & Drop** — Drop files directly onto the app for instant upload
- **Click to Browse** — Or select files with a standard file picker
- **Auto Clipboard** — Optionally copy the upload URL right after upload (Raw / Markdown / HTML)
- **Auto Rename** — Rename files to timestamp or random ID on upload to avoid collisions
- **Credential Profiles** — Save and switch between multiple R2 connection configs
- **Privacy by Default** — All sensitive fields (endpoint, keys, bucket) are masked with show/hide toggle
- **Upload History** — Browse and re-copy past upload URLs from a standalone history file
- **Light / Dark Mode** — Switch themes from Settings
- **Config Versioning** — Built-in schema migration for future-proof config upgrades
- **Export / Import** — Back up and restore all settings and history as JSON
- **System Tray** — Minimize to tray for quick access
- **Cross-platform** — Windows, macOS, and Linux

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Configuration

1. Launch the app and go to the **Settings** tab
2. Fill in your Cloudflare R2 credentials:
   - **S3 API Endpoint**: `https://<account-id>.r2.cloudflarestorage.com`
   - **Access Key ID** and **Secret Access Key**: Generate from Cloudflare Dashboard → R2 → Manage R2 API Tokens
   - **Bucket Name**: Your R2 bucket name
   - **Public URL Base**: Your custom domain (e.g., `https://images.yourdomain.com`)
3. Click **Test Connection** to verify
4. Switch to the **Upload** tab and start uploading!

> All credential fields are masked by default. Click the eye icon to reveal values when needed.

## Design Philosophy

- **Image-first** — Optimized for the workflow of uploading images and getting shareable URLs
- **Privacy & Security** — Credentials never leave your machine; all sensitive fields masked by default
- **Minimalist** — No bloat, no accounts, no telemetry — just a fast uploader
- **Cross-platform consistency** — Pure SVG icons, no emoji dependencies

## Tech Stack

- **Electron** + **electron-vite** — Desktop framework
- **React 18** + **TypeScript** — UI
- **AWS SDK v3** (`@aws-sdk/client-s3`) — S3-compatible R2 uploads
- **electron-store** — Persistent local config (config + history as separate files)

## CI/CD

GitHub Actions automatically builds for all platforms on push to `main`. To create a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the build → package → release pipeline, creating a GitHub Release with platform installers attached.

## License

MIT
