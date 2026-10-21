param(
    [switch]$SkipApply
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $projectRoot "prototype\folia-stage"
$spicetify = Get-Command spicetify -ErrorAction SilentlyContinue

if (-not $spicetify) {
    throw "Spicetify CLI was not found in PATH. Install Spicetify first, then rerun this script."
}

$configPath = (& spicetify path).Trim()
if (-not $configPath) {
    $configPath = Join-Path $env:LOCALAPPDATA "spicetify"
}

$target = Join-Path $configPath "CustomApps\folia-stage"
New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -Path (Join-Path $source "*") -Destination $target -Recurse -Force

$enabledApps = @((& spicetify config custom_apps).Trim() -split "\|" | Where-Object { $_ })
if ($enabledApps -notcontains "folia-stage") {
    $enabledApps += "folia-stage"
}
& spicetify config custom_apps ($enabledApps -join "|")
if ($LASTEXITCODE -ne 0) {
    throw "Spicetify custom app registration failed (exit $LASTEXITCODE)."
}
if (-not $SkipApply) {
    & spicetify apply
    if ($LASTEXITCODE -ne 0) {
        throw "Spicetify apply failed (exit $LASTEXITCODE)."
    }
}

Write-Host "Installed Folia Stage prototype to $target"
