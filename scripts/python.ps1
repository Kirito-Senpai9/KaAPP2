param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$PythonArgs
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pythonExe = Join-Path $repoRoot '.codex-tools\\python\\python.exe'

if (-not (Test-Path $pythonExe)) {
  throw "Python local nao encontrado. Rode: npm run tools:setup"
}

& $pythonExe @PythonArgs
exit $LASTEXITCODE
