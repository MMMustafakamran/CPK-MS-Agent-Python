import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAllDocDrift } from './check-doc-drift.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';

// Parse command line arguments
const args = process.argv.slice(2);
const shouldPull = args.includes('--pull');
const shouldUpgrade = args.includes('--upgrade');
const skipInstall = args.includes('--skip-install');
const ignoreDocDrift = args.includes('--ignore-doc-drift') || args.includes('--force');
const forwardArgs = args.filter(
  (arg) => !['--pull', '--upgrade', '--skip-install', '--ignore-doc-drift', '--force'].includes(arg),
);

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🚀 CopilotKit Automation Pipeline');
console.log('═══════════════════════════════════════════════════════════════');

let backendProc = null;
let frontendProc = null;

// Helper to kill a process and its child tree
function killTree(proc, signal = 'SIGTERM') {
  if (!proc || !proc.pid) return;
  try {
    if (isWindows) {
      execSync(`taskkill /pid ${proc.pid} /T /F 2>nul || exit 0`, { stdio: 'ignore' });
    } else {
      process.kill(-proc.pid, signal);
    }
  } catch {
    try {
      proc.kill(signal);
    } catch {
      // ignore
    }
  }
}

// Cleanup hook
function cleanup() {
  console.log('\n🧹 Cleaning up running processes...');
  if (backendProc) {
    killTree(backendProc);
    backendProc = null;
  }
  if (frontendProc) {
    killTree(frontendProc);
    frontendProc = null;
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});
process.on('exit', () => {
  cleanup();
});

// Run a command synchronously with inherited stdio
function runSync(command, cwd, description) {
  console.log(`\n▶ [Step] ${description}...`);
  try {
    execSync(command, { cwd, stdio: 'inherit', shell: true });
  } catch (err) {
    console.error(`❌ Failed during: ${description}`);
    throw err;
  }
}

// Check URL health with polling
async function waitForHealth(url, name, timeoutMs = 45000) {
  const start = Date.now();
  process.stdout.write(`⏳ Waiting for ${name} (${url})... `);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) {
        process.stdout.write('✅ READY!\n');
        return true;
      }
    } catch {
      // Retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  process.stdout.write('❌ TIMEOUT\n');
  throw new Error(`Timeout waiting for ${name} at ${url}`);
}

async function main() {
  try {
    // 0. Live Doc Drift Check
    console.log('▶ [Step 0] Checking for live documentation drift against doc-snapshot...');
    const driftResult = await checkAllDocDrift();
    if (driftResult.drifted) {
      console.log('\n🚨 [DOC DRIFT DETECTED] Upstream documentation has changed on the following pages:');
      console.log('───────────────────────────────────────────────────────────────────────────');
      for (const p of driftResult.driftedPages) {
        console.log(` • [${p.severity}] ${p.docPath}`);
        if (p.oldHash && p.newHash) {
          console.log(`   Hash: ${p.oldHash} ➔ ${p.newHash} (${p.file})`);
        }
      }
      console.log('───────────────────────────────────────────────────────────────────────────');

      if (!ignoreDocDrift) {
        console.log('⚠️ Halting automated recording pipeline so you can review doc changes.');
        console.log('👉 Review in browser: http://localhost:3000/doc-sync');
        console.log('👉 To run anyway, pass `--ignore-doc-drift` or `--force`.');
        process.exit(2);
      } else {
        console.log('⚠️ --ignore-doc-drift provided. Proceeding with pipeline anyway...\n');
      }
    } else {
      console.log(`✅ [Doc Drift Check]: All ${driftResult.total} doc pages match the local snapshot.\n`);
    }

    // 1. Git pull if requested
    if (shouldPull) {
      runSync('git pull', ROOT_DIR, 'Updating repository (git pull)');
    }

    // 2. Dependency updates
    if (!skipInstall) {
      runSync('uv sync --prerelease=allow', path.join(ROOT_DIR, 'backend'), 'Syncing Backend Dependencies (uv sync)');

      if (shouldUpgrade) {
        runSync('npx npm-check-updates -u --filter "/copilotkit|ag-ui/"', path.join(ROOT_DIR, 'frontend'), 'Upgrading CopilotKit & AG-UI frontend dependencies');
      }

      runSync('npm install', path.join(ROOT_DIR, 'frontend'), 'Installing Frontend Dependencies (npm install)');
      runSync('npm install', path.join(ROOT_DIR, 'autorecorder'), 'Installing Autorecorder Dependencies');
    }

    // 3. Start Backend
    console.log('\n▶ [Step] Starting Backend Server (:8000)...');
    backendProc = spawn('uv run --prerelease=allow main.py', {
      cwd: path.join(ROOT_DIR, 'backend'),
      stdio: 'ignore',
      shell: true,
      detached: !isWindows,
    });

    // 4. Start Frontend
    console.log('▶ [Step] Starting Frontend Server (:3000)...');
    frontendProc = spawn('npm run dev', {
      cwd: path.join(ROOT_DIR, 'frontend'),
      stdio: 'ignore',
      shell: true,
      detached: !isWindows,
    });

    // 5. Health Checks
    await waitForHealth('http://127.0.0.1:8000/health', 'Backend Agent', 45000);
    await waitForHealth('http://127.0.0.1:3000', 'Frontend Next.js App', 60000);

    // 6. Run Autorecorder
    console.log('\n▶ [Step] Running Autorecorder...');
    const recorderCmd = forwardArgs.length > 0
      ? `npm run record -- ${forwardArgs.join(' ')}`
      : 'npm run record';

    runSync(recorderCmd, path.join(ROOT_DIR, 'autorecorder'), 'Executing Autorecorder');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  🎉 Automation completed successfully! All videos recorded.');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('\n❌ Automation failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

main();
