param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$FfmpegArgs
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ffmpegExe = Join-Path $repoRoot '.codex-tools\\ffmpeg\\bin\\ffmpeg.exe'

if (-not (Test-Path $ffmpegExe)) {
  throw "FFmpeg local nao encontrado. Rode: npm run tools:setup"
}

& $ffmpegExe @FfmpegArgs
exit $LASTEXITCODE
