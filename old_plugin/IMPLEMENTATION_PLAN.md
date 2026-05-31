# IINA Movie Plugin Plan

## Current State

- Diagnostic sidebar is confirmed to render when installed manually in IINA.
- The repo was accidentally deleted and has been restored to the last known-good diagnostic baseline.

## Next Step

Rebuild the dynamic sidebar incrementally from this working baseline:

1. keep `src/index.js` minimal and stable
2. reintroduce dynamic HTML in a separate file
3. add UI messaging
4. add `home` loading
5. add search
6. add playback

## Progress

- `src/index.js` remains minimal
- `ui/index.html`, `ui/app.js`, and `ui/styles.css` have been restored with sample content only
- next step is message wiring from sidebar webview to plugin script
