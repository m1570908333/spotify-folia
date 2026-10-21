param(
    [string]$Repository = "m1570908333/spotify-folia",
    [switch]$SkipApply
)

$ErrorActionPreference = "Stop"
if ($Repository -notmatch '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' -or $Repository.StartsWith('OWNER/')) {
    throw "Set the public GitHub repository in scripts/install.ps1 before publishing."
}
if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
    throw "Spicetify CLI is required. Install it first, then run this script again."
}

$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repository/releases/latest" -Headers @{ Accept = "application/vnd.github+json" }
$asset = @($release.assets | Where-Object { $_.name -eq "spotify-folia.zip" }) | Select-Object -First 1
if (-not $asset) { throw "The latest GitHub release does not contain spotify-folia.zip." }

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ([guid]::NewGuid().ToString("N"))
$archive = Join-Path $tempRoot "spotify-folia.zip"
$checksum = Join-Path $tempRoot "spotify-folia.zip.sha256"
$expanded = Join-Path $tempRoot "expanded"
try {
    New-Item -ItemType Directory -Force -Path $expanded | Out-Null
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $archive -UseBasicParsing
    $checksumAsset = @($release.assets | Where-Object { $_.name -eq "spotify-folia.zip.sha256" }) | Select-Object -First 1
    if (-not $checksumAsset) { throw "The release is missing its SHA-256 checksum." }
    Invoke-WebRequest -Uri $checksumAsset.browser_download_url -OutFile $checksum -UseBasicParsing
    $expectedHash = ((Get-Content -LiteralPath $checksum -Raw).Trim() -split '\s+')[0]
    $actualHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
    if ($actualHash -ne $expectedHash) { throw "The release archive failed SHA-256 verification." }
    Expand-Archive -LiteralPath $archive -DestinationPath $expanded -Force
    $manifest = Get-ChildItem -LiteralPath $expanded -Filter manifest.json -File -Recurse |
        Where-Object { $_.Directory.Name -eq "folia-stage" } | Select-Object -First 1
    if (-not $manifest) { throw "The release archive is missing the Folia Stage manifest." }

    $spicetifyPath = (& spicetify path).Trim()
    if (-not $spicetifyPath) { $spicetifyPath = Join-Path $env:LOCALAPPDATA "spicetify" }
    $target = Join-Path $spicetifyPath "CustomApps\folia-stage"
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Copy-Item -Path (Join-Path $manifest.Directory.FullName "*") -Destination $target -Recurse -Force

    $apps = @((& spicetify config custom_apps).Trim() -split '\|' | Where-Object { $_ })
    if ($apps -notcontains "folia-stage") { $apps += "folia-stage" }
    & spicetify config custom_apps ($apps -join "|")
    if ($LASTEXITCODE -ne 0) { throw "Could not register the Folia Stage custom app." }
    if (-not $SkipApply) {
        & spicetify apply
        if ($LASTEXITCODE -ne 0) { throw "Spicetify could not apply the update." }
    }
    Write-Host "Installed Spotify Folia $($release.tag_name). Restart Spotify if the app is not visible."
}
finally {
    if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force }
}
