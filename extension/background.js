// Service worker: registers the right-click "add image" menu and opens the
// popup (prefilled with the image URL) in a small window.

const MENU_ID = 'mosaic-add-image';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Add image to Mosaic Gallery',
    contexts: ['image'],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.srcUrl) return;
  const params = new URLSearchParams({ src: info.srcUrl });
  if (info.pageUrl) params.set('page', info.pageUrl);
  chrome.windows.create({
    url: chrome.runtime.getURL('popup.html') + '?' + params.toString(),
    type: 'popup',
    width: 460,
    height: 700,
  });
});
