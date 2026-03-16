param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$FfprobeArgs
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ffprobeExe = Join-Path $repoRoot '.codex-tools\\ffmpeg\\bin\\ffprobe.exe'

if (-not (Test-Path $ffprobeExe)) {
  throw "FFprobe local nao encontrado. Rode: npm run tools:setup"
}

& $ffprobeExe @FfprobeArgs
exit $LASTEXITCODE
