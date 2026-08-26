/**
 * Shared paths, ports and URLs for the CI/CD pipeline.
 *
 * Everything under ci/ imports from here rather than rebuilding paths, so a
 * moved folder or a changed port is a one-line edit.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const CI_DIR = path.join(ROOT_DIR, 'ci');
export const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
export const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
export const RECORDER_DIR = path.join(ROOT_DIR, 'autorecorder');
export const VIDEOS_DIR = path.join(RECORDER_DIR, 'videos');
export const AUDIO_DIR = path.join(RECORDER_DIR, 'audio');
export const LOGS_DIR = path.join(VIDEOS_DIR, 'logs');

export const isWindows = process.platform === 'win32';

export const BACKEND_PORT = Number(process.env.AGENT_PORT || 8000);
export const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 3000);

export const BACKEND_HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;
export const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;

/**
 * Routes compiled before recording starts. Next.js builds routes on demand, so
 * the first hit of each is slow enough to blow the recorder's preflight
 * timeout. Warming them keeps that cost out of the recording itself.
 */
export const WARMUP_ROUTES = ['/', '/quickstart/demo-chat'];
