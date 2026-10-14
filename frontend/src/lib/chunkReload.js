import { lazy } from 'react';

const RELOAD_KEY = 'coco-chunk-reload';
const RELOAD_COOLDOWN_MS = 60_000;

/**
 * After a deploy, a cached index.html can reference chunks that no longer exist.
 * Reload to pick up the new build, at most once a minute so a truly missing chunk can't loop.
 * Returns false when a reload was attempted too recently.
 */
export function reloadOnceForNewBuild() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY));
    if (last && Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      return await importer();
    } catch {
      await wait(400);
      try {
        return await importer();
      } catch (err) {
        if (reloadOnceForNewBuild()) return new Promise(() => {});
        throw err;
      }
    }
  });
}
