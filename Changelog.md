# Changelog

## 2026-09-01
- Fixed the image generation flow to use the real ChatGPT sandbox payload contract instead of brittle browser or network capture workarounds.
- Added safeguards for empty prompt/image requests to send the correct status signal and avoid dead hangs.
- Deduplicated image downloads so the same generated asset is not saved multiple times.
- Added validation and retry logic for invalid or incomplete sandbox image downloads before continuing.
- Standardized saved image naming to `image_{noteId}_{fileId}` for consistent file tracking.
- Fixed the new-chat/session scoping issue that caused runtime problems during fresh conversations.
- Updated the chat title to reflect the active note/topic as soon as it becomes available.
- Improved the generation placeholder text with smoother typing animation and a softer blur-to-visible image reveal.

## Previous
- Made generation more stable by adding reverse API handling.