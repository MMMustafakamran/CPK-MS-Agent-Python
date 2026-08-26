/**
 * The page list, read from the recorder's own config.
 *
 * `autorecorder/config/pages.config.ts` is the single source of truth for which
 * demos exist. The workflow used to restate all 20 ids in two more places
 * (dispatch checkboxes and a bash mapping), which drifted silently whenever a
 * page was renamed. Everything now reads them from here instead.
 *
 * The ids are extracted textually rather than by importing the module, so this
 * stays a plain .mjs helper with no tsx/TypeScript dependency.
 */
import fs from 'node:fs';
import path from 'node:path';
import { RECORDER_DIR } from './config.mjs';

const PAGES_CONFIG = path.join(RECORDER_DIR, 'config', 'pages.config.ts');

export function readPageIds() {
  let src;
  try {
    src = fs.readFileSync(PAGES_CONFIG, 'utf8');
  } catch {
    throw new Error(`Cannot read page config at ${PAGES_CONFIG}`);
  }

  const ids = [...src.matchAll(/^\s*id:\s*'([^']+)'/gm)].map((m) => m[1]);
  if (ids.length === 0) {
    throw new Error(`No page ids found in ${PAGES_CONFIG}`);
  }
  return ids;
}

/**
 * Validate a comma-separated selection against the real page list. Returns the
 * cleaned ids. Throws naming the unknown ones, so a typo fails immediately
 * instead of silently recording nothing.
 */
export function resolvePageSelection(raw) {
  const known = readPageIds();
  const wanted = String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (wanted.length === 0) return [];

  const unknown = wanted.filter((id) => !known.includes(id));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown page id(s): ${unknown.join(', ')}\nValid ids: ${known.join(', ')}`,
    );
  }
  return wanted;
}
