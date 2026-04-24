# R2 Uploader

A lightweight desktop tool for quickly uploading images to Cloudflare R2 storage with drag-and-drop, auto-rename, and clipboard copy features.

## Features

- 🖱️ **Drag & Drop** — Drop images directly onto the app
- 📋 **Auto Clipboard** — URL is automatically copied after upload
- 🔄 **Auto Rename** — Rename to timestamp or random ID on upload
- 👤 **Credential Profiles** — Save & switch between multiple R2 configs
- 📜 **Upload History** — Browse and re-copy past upload URLs
- 🖥️ **System Tray** — Minimize to tray for quick access
- 🌐 **Cross-platform** — Windows, macOS, and Linux

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

## Tech Stack

- **Electron** + **electron-vite** — Desktop framework
- **React 18** + **TypeScript** — UI
- **AWS SDK v3** (`@aws-sdk/client-s3`) — S3-compatible R2 uploads
- **electron-store** — Persistent encrypted config

## CI/CD

GitHub Actions automatically builds for all platforms on push to `main`. To create a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the build → package → release pipeline, creating a GitHub Release with platform installers attached.

## License

MIT
