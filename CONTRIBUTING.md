# Contributing to Spotify Folia

Thanks for helping improve Spotify Folia.

## Before opening an issue

Search existing issues first. For lyric problems, include the provider, file
format, Spotify desktop version, Spicetify version, and the stage mode involved.
Do not attach Spotify credentials, private playlists, or copyrighted media.

## Development

The Custom App source is in `prototype/folia-stage`. Run the smoke tests before
opening a pull request:

```powershell
Get-ChildItem tests/*-smoke.js | ForEach-Object { node $_.FullName; if ($LASTEXITCODE) { exit $LASTEXITCODE } }
```

Keep third-party source notices and license files intact. Changes to the
embedded JIZURA engine must preserve its MIT attribution and source snapshot.

## Pull requests

Keep pull requests focused, describe user-visible changes, and include the
Spicetify and Spotify versions used for manual verification.
