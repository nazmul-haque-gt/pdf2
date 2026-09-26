# PDF Editor — Android App Build

This repo is a **Capacitor** project that wraps the web app in `www/`
into a native Android APK, built automatically by **GitHub Actions**.
No GitHub Pages, no signing keystore, no repo secrets required.

```
www/                The app itself (pdf.js + pdf-lib + Tesseract.js,
                     vendor libraries already included in www/vendor/)
resources/          Source app icon (icon.png, icon-foreground.png,
                     icon-background.png) used to generate the Android
                     launcher icon on every build
package.json         Capacitor dependencies
capacitor.config.json  Capacitor project config (app id, name, web folder)
.github/workflows/
  build-apk.yml       Builds a debug APK on every push (and on demand)
```

## Test in a browser first (optional, but easy)

From the repo root:

```bash
cd www
python3 -m http.server 8080
```

Open `http://localhost:8080` — this is the full app. Since `www/vendor/`
is already populated, it works fully offline, no CDN needed.

## Get the Android APK

1. Push this repo to GitHub.
2. Pushing to `main` automatically triggers `.github/workflows/build-apk.yml`
   (or trigger it manually from the **Actions** tab → "Run workflow").
3. Open the finished run → scroll to **Artifacts** → download
   `pdf-editor-debug-apk` (a zip containing `app-debug.apk`).
4. Transfer `app-debug.apk` to your Android phone (email, Drive, USB) and
   tap it to install.
   - Android will ask you to allow "Install unknown apps" for whichever
     app you used to open it — allow it.

No PC, local server, or same-Wi-Fi requirement — the installed APK runs
standalone with everything it needs already bundled inside it.

## Re-building after changes

Edit anything inside `www/` and push — the workflow rebuilds
automatically. You can also trigger a rebuild manually from the Actions
tab any time (`workflow_dispatch` is enabled).

## About this build

- This is a **debug APK** — fine for personal use and testing, not signed
  for the Play Store. Publishing to the Play Store needs a separate
  signing-key setup; ask if you want that added later.
- `appId` (`com.example.pdfeditor`) and `appName` live in
  `capacitor.config.json` — change them there if you want a different
  package name or display name before your first build.
- The Android project itself (the `android/` folder) is generated fresh
  by the workflow every run from `www/` + `capacitor.config.json` — it's
  not committed to the repo (see `.gitignore`).

## App icon

The launcher icon shown on the home screen comes from `resources/icon.png`
(plus `icon-foreground.png` / `icon-background.png` for Android's adaptive
icon). The workflow runs `@capacitor/assets` on every build to turn those
into every Android density/shape the OS needs — that's why the icon no
longer shows Capacitor's default placeholder logo.

To change the icon later: replace the three files in `resources/` (keep
them square, at least 1024×1024, `icon-foreground.png` transparent with
the artwork centered in the middle ~50% of the canvas) and push — no
other changes needed. The same artwork is also copied into
`www/icon-192.png`, `www/icon-512.png`, and `www/icon-512-maskable.png`
for the web/PWA manifest.

## PDF/Acrobat compatibility

Unchanged: saving/exporting goes through `pdf-lib`, which writes
standards-compliant PDF files, so anything edited and saved here opens
correctly in Adobe Acrobat (desktop or mobile).
