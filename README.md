# Spotify Folia

A full-screen, animated lyrics stage for Spotify, delivered as a Spicetify
Custom App. Spotify Folia combines lyric lookup and import with stage visuals
inspired by Folia and the JIZURA lyric-PV engine.

> This is an independent community project. It is not affiliated with,
> endorsed by, or sponsored by Spotify, Folia, or JIZURA.

## Install

Requirements: Windows 10/11, Spotify desktop, and Spicetify CLI. Install and
configure Spicetify first using its official documentation, then open
PowerShell and run:

```powershell
irm https://raw.githubusercontent.com/m1570908333/spotify-folia/main/scripts/install.ps1 | iex
```

The installer downloads the latest public GitHub Release, verifies its SHA-256
checksum, installs the `folia-stage` Custom App, registers it with Spicetify,
and applies the changes. Restart Spotify if the app does not appear.

Updates use the same command. The Version button in the app checks the public
GitHub Releases API and displays the PowerShell command when a newer release is
available. No GitHub token or Spotify password is required by this project.

## Features

- Animated lyric stages, including English Stage and JIZURA.
- Lyric lookup from local files, Spotify, LRCLIB, and NetEase Cloud Music.
- Import synchronized LRC, enhanced LRC, YRC, QRC, TTML, and text lyrics.
- Per-track lyric timing offsets, translation display, and editable word
  segmentation.
- Fullscreen playback, animated backgrounds, typography controls, and stage
  settings.
- JIZURA project import/export, per-line editing, undo/redo, effect preview,
  local audio analysis, and offline export formats where the browser supports
  them.
- Version information for Spotify Folia and the Folia/JIZURA source baselines.

Lyrics and imported media remain on the user's device unless the selected lyric
provider is contacted to search for lyrics. Do not import media you do not have
the right to use.

## Development

The Spicetify Custom App source is in `prototype/folia-stage`. Install locally
from a checkout with:

```powershell
./scripts/install-prototype.ps1
```

Run smoke tests with Node.js:

```powershell
Get-ChildItem tests/*-smoke.js | ForEach-Object { node $_.FullName; if ($LASTEXITCODE) { exit $LASTEXITCODE } }
```

To publish a release, configure the repository owner in
`prototype/folia-stage/release-config.js`, set `FUNDING.yml`, update the version,
and push a `vX.Y.Z` tag. GitHub Actions builds the installable archive and
publishes it with a checksum. The release workflow needs the repository's
standard `GITHUB_TOKEN` permission; no personal access token is stored in the
source tree.

## Credits and Licensing

Spotify Folia is distributed under the GNU Affero General Public License v3.0;
see [LICENSE](LICENSE). This distribution includes third-party components with
their own notices and licenses. In particular, the JIZURA engine is MIT
licensed and remains attributed to its upstream authors. See
[`prototype/folia-stage/JIZURA-THIRD-PARTY-NOTICES.md`](prototype/folia-stage/JIZURA-THIRD-PARTY-NOTICES.md)
and the corresponding license files before redistributing modified builds.

Folia upstream: <https://github.com/chthollyphile/folia-major>  
JIZURA upstream: <https://github.com/852wa/JIZURA>  
Spicetify: <https://github.com/spicetify/cli>
