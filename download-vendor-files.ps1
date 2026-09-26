# Run this ONCE, on any Windows PC with internet access, from the same
# folder as final.html (or pass -Root to point at a different folder). It
# downloads every library the app needs - the PDF renderer, the PDF export
# engine, and the OCR (text recognition) engine, including the English
# language data - into a local "vendor" folder next to final.html. After
# this finishes, final.html works fully offline, including "Scan text"
# (OCR) on images inside PDFs. Nothing here downloads again on later runs;
# you only need to re-run this if you add another OCR language (see the
# bottom of this file).
#
# The only thing that will still need internet afterwards is the
# "Translate selection" AI feature, since that calls Google's Gemini API.

param(
  [string]$Root = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
$root = $Root

# Older Windows PowerShell (5.1) often defaults to TLS 1.0, which cdnjs and
# jsdelivr both reject - the download then fails even with a perfectly good
# internet connection, and looks identical to "no internet". Force TLS 1.2.
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch {}

function Get-File($url, $relPath) {
  $dest = Join-Path $root $relPath
  New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
  Write-Host "Downloading $relPath ..."

  $maxAttempts = 3
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    try {
      Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 30
      return
    } catch {
      if ($attempt -eq $maxAttempts) {
        # Re-throw with the real reason attached instead of a generic failure,
        # so the caller can tell the user what actually went wrong.
        throw "Failed to download $relPath from $url after $maxAttempts attempts: $($_.Exception.Message)"
      }
      Write-Host "  attempt $attempt failed ($($_.Exception.Message)), retrying..." -ForegroundColor DarkYellow
      Start-Sleep -Seconds ([Math]::Pow(2, $attempt))
    }
  }
}

# --- PDF renderer (pdf.js) ---
Get-File 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'        'vendor/pdfjs/pdf.min.js'
Get-File 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js' 'vendor/pdfjs/pdf.worker.min.js'

# --- PDF export engine (pdf-lib) ---
Get-File 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js' 'vendor/pdflib/pdf-lib.min.js'

# --- OCR engine (tesseract.js) ---
Get-File 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js' 'vendor/tesseract/tesseract.min.js'
Get-File 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js'    'vendor/tesseract/worker.min.js'

# --- OCR engine core (WebAssembly) - all 4 variants, tesseract.js
#     auto-picks the right one for the user's browser/CPU ---
$coreFiles = @(
  'tesseract-core.wasm.js', 'tesseract-core.wasm',
  'tesseract-core-simd.wasm.js', 'tesseract-core-simd.wasm',
  'tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm',
  'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm'
)
foreach ($f in $coreFiles) {
  Get-File "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/$f" "vendor/tesseract-core/$f"
}

# --- OCR language data: English ---
# To add another language later (e.g. Bengali, "ben"), also:
#   1. Get-File 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/ben@1.0.0/4.0.0_best_int/ben.traineddata.gz' 'vendor/tessdata/ben.traineddata.gz'
#   2. In final.html, change:  var OCR_LANG = 'eng';  to  var OCR_LANG = 'eng+ben';
Get-File 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz' 'vendor/tessdata/eng.traineddata.gz'

Write-Host ""
Write-Host "Done. The 'vendor' folder now sits next to final.html - the app" -ForegroundColor Green
Write-Host "will use it automatically and work fully offline from now on." -ForegroundColor Green
