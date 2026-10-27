# Changelog

## 1.0.1 - 2026-10-27

- Reduced JIZURA switching overhead by deferring advanced settings, line editors,
  and cut editors until their sections are opened. All native effects remain
  available.
- Initialized JIZURA using the actual canvas dimensions, avoiding a redundant
  default-size lyric plan.
- Reused the English translation dictionary instead of rebuilding it for each
  label.
- Completed English settings labels and improved narrow-panel layouts, long
  option labels, image controls, and the Match album art button.
- Packaged the PayPal sponsor card so it does not require a runtime image import.
- Added regression tests for lazy settings, startup planning, and settings UI.

- Prepared the public `spotify-folia` release package.
- Added an English release UI, version information dialog, PowerShell update
  command, and sponsor button.
- Removed the in-app upstream source checker; releases are maintained by the
  project owner through GitHub.
- Added a checksum-verified PowerShell installer and GitHub Release workflow.
