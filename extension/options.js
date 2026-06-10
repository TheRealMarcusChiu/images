'use strict';

const DEFAULT_SERVER = 'http://localhost:3000';
const input = document.getElementById('url');
const saved = document.getElementById('saved');

chrome.storage.sync.get({ serverUrl: DEFAULT_SERVER }).then(({ serverUrl }) => {
  input.value = serverUrl;
});

document.getElementById('save').addEventListener('click', async () => {
  const serverUrl = (input.value.trim() || DEFAULT_SERVER).replace(/\/+$/, '');
  input.value = serverUrl;
  await chrome.storage.sync.set({ serverUrl });
  saved.classList.add('show');
  setTimeout(() => saved.classList.remove('show'), 1500);
});
