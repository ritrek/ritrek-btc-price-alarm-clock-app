#!/usr/bin/env node

/**
 * Script to build licenses.json with license text included and local paths removed
 * This processes the output from license-checker to make it suitable for inclusion in the app
 * License texts are deduplicated using hashes to reduce file size
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function readLicenseFile(licenseFilePath) {
  if (!licenseFilePath || !fs.existsSync(licenseFilePath)) {
    return null;
  }
  try {
    return fs.readFileSync(licenseFilePath, 'utf8');
  } catch (error) {
    console.warn(`Failed to read license file: ${licenseFilePath}`, error.message);
    return null;
  }
}

function hashLicenseText(text) {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

function cleanLicenseData(rawData) {
  const cleaned = [];
  const licenseTextMap = new Map();
  let totalLicenseTexts = 0;
  let deduplicatedCount = 0;

  for (const [packageKey, data] of Object.entries(rawData)) {
    const cleanedData = {
      licenses: data.licenses || 'Unknown',
    };

    if (data.repository) {
      cleanedData.repository = data.repository;
    }

    const licenseText = data.licenseFile ? readLicenseFile(data.licenseFile) : data.licenseText;
    if (licenseText) {
      totalLicenseTexts++;
      const hash = hashLicenseText(licenseText);

      if (!licenseTextMap.has(hash)) {
        licenseTextMap.set(hash, licenseText);
      } else {
        if (licenseTextMap.get(hash) !== licenseText) {
          throw new Error('Hash collision detected for license text');
        }
        deduplicatedCount++;
      }

      cleanedData.licenseTextHash = hash;
    }

    cleanedData.packageKey = packageKey;
    cleaned.push(cleanedData);
  }

  cleaned.sort((a, b) => a.packageKey.localeCompare(b.packageKey));

  console.info(`   License texts: ${totalLicenseTexts} total, ${licenseTextMap.size} unique (${deduplicatedCount} duplicates removed)`);

  return {
    packages: cleaned,
    licenseTexts: [...licenseTextMap.entries()].sort((a, b) => a[0].localeCompare(b[0])),
  };
}

try {
  console.info('Running license-checker...');
  const output = execSync('license-checker --production --json', {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  const rawData = JSON.parse(output);
  // Local packages (private: true). license-checker reports those as UNLICENSED even when
  // package.json says MIT, so keep them off the in-app third-party list.
  const firstPartyNames = new Set(['btc-price-alarm-clock', 'btc-alarm', 'image-size']);
  for (const packageKey of Object.keys(rawData)) {
    const at = packageKey.lastIndexOf('@');
    const packageName = at > 0 ? packageKey.slice(0, at) : packageKey;
    if (firstPartyNames.has(packageName)) {
      delete rawData[packageKey];
    }
  }
  console.info(`Found ${Object.keys(rawData).length} packages`);

  console.info('Processing license data...');
  const result = cleanLicenseData(rawData);

  const outputPath = path.join(process.cwd(), 'licenses.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

  console.info(`Successfully generated ${outputPath}`);
  console.info(`   Processed ${result.packages.length} packages`);
  console.info(`   License text map: ${result.licenseTexts.length} unique texts`);
} catch (error) {
  console.error('Error building licenses:', error.message);
  if (error.stdout) {
    console.error('STDOUT:', error.stdout);
  }
  if (error.stderr) {
    console.error('STDERR:', error.stderr);
  }
  process.exit(1);
}
