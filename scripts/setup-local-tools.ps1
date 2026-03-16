$ErrorActionPreference = 'Stop'

param(
  [switch]$Force
)

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

function Install-LocalPython {
  param(
    [string]$RepoRoot,
    [switch]$ForceInstall
  )

  $pythonVersion = '3.12.4'
  $toolsRoot = Join-Path $RepoRoot '.codex-tools'
  $pythonRoot = Join-Path $toolsRoot 'python'
  $pythonExe = Join-Path $pythonRoot 'python.exe'

  if ((Test-Path $pythonExe) -and -not $ForceInstall) {
    Write-Host "Python local ja existe em $pythonRoot"
    return $pythonExe
  }

  $tempRoot = Join-Path $env:TEMP 'kaapp2-local-tools'
  $pythonInstaller = Join-Path $tempRoot "python-$pythonVersion-amd64.exe"
  New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

  Write-Host "Baixando Python $pythonVersion..."
  Invoke-WebRequest -Uri "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-amd64.exe" -OutFile $pythonInstaller

  if (Test-Path $pythonRoot) {
    Remove-Item -Path $pythonRoot -Recurse -Force
  }

  New-Item -ItemType Directory -Force -Path $pythonRoot | Out-Null

  Write-Host "Instalando Python em $pythonRoot..."
  Start-Process -FilePath $pythonInstaller -ArgumentList @(
    '/quiet',
    'InstallAllUsers=0',
    'PrependPath=0',
    'Include_launcher=0',
    'Include_test=0',
    'Include_pip=1',
    'AssociateFiles=0',
    'Shortcuts=0',
    "TargetDir=$pythonRoot"
  ) -Wait

  if (-not (Test-Path $pythonExe)) {
    throw "Falha ao instalar Python local em $pythonRoot"
  }

  return $pythonExe
}

function Install-LocalFfmpeg {
  param(
    [string]$RepoRoot,
    [switch]$ForceInstall
  )

  $toolsRoot = Join-Path $RepoRoot '.codex-tools'
  $ffmpegRoot = Join-Path $toolsRoot 'ffmpeg'
  $ffmpegExe = Join-Path $ffmpegRoot 'bin\\ffmpeg.exe'

  if ((Test-Path $ffmpegExe) -and -not $ForceInstall) {
    Write-Host "FFmpeg local ja existe em $ffmpegRoot"
    return $ffmpegExe
  }

  $tempRoot = Join-Path $env:TEMP 'kaapp2-local-tools'
  $ffmpegZip = Join-Path $tempRoot 'ffmpeg-release-essentials.zip'
  $extractRoot = Join-Path $tempRoot ('ffmpeg-' + [guid]::NewGuid().ToString())
  New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

  Write-Host 'Baixando FFmpeg...'
  Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile $ffmpegZip

  if (Test-Path $ffmpegRoot) {
    Remove-Item -Path $ffmpegRoot -Recurse -Force
  }

  Write-Host "Extraindo FFmpeg em $ffmpegRoot..."
  Expand-Archive -Path $ffmpegZip -DestinationPath $extractRoot -Force
  $sourceDir = (Get-ChildItem -Path $extractRoot -Directory | Select-Object -First 1).FullName
  New-Item -ItemType Directory -Force -Path $ffmpegRoot | Out-Null
  Copy-Item -Path (Join-Path $sourceDir '*') -Destination $ffmpegRoot -Recurse -Force

  if (-not (Test-Path $ffmpegExe)) {
    throw "Falha ao instalar FFmpeg local em $ffmpegRoot"
  }

  return $ffmpegExe
}

$repoRoot = Get-RepoRoot
$toolsRoot = Join-Path $repoRoot '.codex-tools'
New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null

$pythonExe = Install-LocalPython -RepoRoot $repoRoot -ForceInstall:$Force
$ffmpegExe = Install-LocalFfmpeg -RepoRoot $repoRoot -ForceInstall:$Force

Write-Host ''
Write-Host 'Ferramentas locais prontas:'
& $pythonExe --version
& $ffmpegExe -version | Select-Object -First 1
