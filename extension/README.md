# Mosaic Gallery Admin — Chrome extension

Add images, uploaded videos, YouTube videos, audio & quotes to your gallery,
manage existing tiles, and right-click any image on the web to submit it — all
talking to your running admin server (`node server.js`).

## Install (unpacked)

1. Start the server: `node server.js` (from the project root).
2. Open `chrome://extensions` in Chrome.
3. Toggle **Developer mode** (top-right).
4. Click **Load unpacked** and select this `extension/` folder.
5. Pin the extension and click its icon to open the popup.

## Use

- **Popup → Add**: add an *Image* (by URL — the server downloads it — or by file
  upload), a *Video* (file upload, with an optional poster — the first frame is
  captured automatically if left blank), a *YouTube* video, or *Audio* (a file
  upload, or a YouTube link the server extracts the audio from — with optional
  cover art and a player title), or a *Quote* (the quote text, with an optional
  author), each with optional description, external link, and a "hidden" flag.
- **Popup → Manage**: list every tile with inline editing of date / description /
  link (and replacing an image tile's photo or a video/audio cover), a hide/show
  toggle, and delete (removes the media files too).
- **Right-click an image** on any page → **Add image to Mosaic Gallery**: opens
  the popup prefilled with that image's URL (and the page URL as the link).

Every change is committed and pushed to GitHub by the server, same as the web
admin.

## Settings

The server URL defaults to `http://localhost:3000`. Change it from the popup
footer (**change**) or the extension's options page.

> The server sends `Access-Control-Allow-Origin: *` so the extension can call
> it. It binds to localhost and has no auth — intended for local use.
