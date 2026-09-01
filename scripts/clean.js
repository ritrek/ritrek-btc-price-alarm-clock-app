#!/usr/bin/env node
/**
 * Wipe Expo, Metro, and Gradle outputs so Kotlin (including modules/btc-alarm)
 * and config-plugin assets are compiled from scratch on the next build.
 *
 * Usage: npm run clean
 * Full native rebuild: npm run rebuild
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function rm(rel) {
  const abs = path.join(root, rel);
  fs.rmSync(abs, { recursive: true, force: true });
  if (fs.existsSync(abs)) {
    throw new Error(`Failed to remove ${rel}`);
  }
  console.log(`removed ${rel}`);
}

function rmGlob(relDir, predicate) {
  const dir = path.join(root, relDir);
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    if (predicate(name)) {
      rm(path.join(relDir, name));
    }
  }
}

const android = path.join(root, 'android');
const gradlewName = process.platform === 'win32' ? 'gradlew.bat' : 'gradlew';
const gradlew = path.join(android, gradlewName);

if (fs.existsSync(gradlew)) {
  console.log('Stopping Gradle daemon…');
  spawnSync(gradlew, ['--stop'], { cwd: android, stdio: 'inherit' });
  console.log('Gradle clean…');
  const cleaned = spawnSync(gradlew, ['clean'], { cwd: android, stdio: 'inherit' });
  if (cleaned.status !== 0) {
    console.warn('gradlew clean exited non-zero; continuing with cache wipe');
  }
} else {
  console.log('No android/gradlew yet; skipping Gradle clean');
}

for (const dir of [
  '.expo',
  'node_modules/.cache',
  'android/build',
  'android/app/build',
  'android/app/.cxx',
  'modules/btc-alarm/android/build',
  'modules/btc-alarm/android/.cxx',
]) {
  rm(dir);
}

rmGlob('android/app/src/main/res/raw', (name) => name.endsWith('.mp3'));

const res = path.join(root, 'android/app/src/main/res');
if (fs.existsSync(res)) {
  for (const name of fs.readdirSync(res)) {
    if (!name.startsWith('mipmap-')) {
      continue;
    }
    rmGlob(path.join('android/app/src/main/res', name), (file) =>
      file.startsWith('ic_launcher') && (file.endsWith('.webp') || file.endsWith('.png'))
    );
  }
}

console.log('Clean finished.');
