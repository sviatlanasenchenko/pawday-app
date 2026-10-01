# Pawday PWA

The GitHub Pages root is the standalone app. Tilda continues to load its existing shared assets, unchanged. New matching corrections are isolated in `pwa/`.

Routes: `/` (English), `/en/`, `/ru/`, `/zh/`. Relative manifest, icon and service-worker URLs support both a project URL (`/pawday-assets/`) and a custom-domain root. One installation ID covers all languages. Switching language retains quiz state; launching from the default icon starts in English.

Offline: the application shell, all quiz data/code, and basic illustrations are cached after a successful first online visit (~6.8 MB). Up to 80 previously viewed breed photos are cached. Uncached photos use a paw placeholder offline. External fonts fall back to system fonts. External attribution links require internet. No quiz answers are sent to a server by the PWA layer.

Updates: change the version in sw.js whenever a core asset changes. Installation must successfully cache the complete core before activating. No skipWaiting: close all app windows to activate a waiting update; active quizzes are not force-reloaded. Navigation uses the installed version's shell. Do not delete another application's caches.

Deployment: keep the existing GitHub Pages configuration until DNS and HTTPS for app.paw-day.com are ready. Do not add CNAME blindly: changing this repository's Pages domain redirects the asset URLs that Tilda uses. Verify those asset redirects and HTTPS before enabling the custom domain; alternatively use a separate Pages repository for the app. The DNS subdomain CNAME target is sviatlanasenchenko.github.io (not a repository path). Leave apex-domain/Tilda DNS records untouched.

Validation: tests/pwa-browser.cjs expects the complete deployed directory as the project root (set PAWDAY_PWA_ROOT). It checks localhost root/project paths, manifest parsing, service-worker control, offline languages/quiz, size counter, and narrow-screen overflow. Run with Node + Playwright and its Chromium browser installed. Physical iOS/Android installation remains a manual check. Lighthouse's former PWA category is deprecated.

Icons: generated from the owner's supplied PD/paw logo using the built-in image-generation tool, with mask-safe padding; exported to PNG at 192/512 and Apple 180 pixels. Prompt: preserve white PD and two paws; reduce composition to central 65%, extend dark teal background; no rounded corners, new text, or shadows.
