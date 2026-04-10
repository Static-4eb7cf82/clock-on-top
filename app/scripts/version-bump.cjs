#!/usr/bin/env node
// version-bump.cjs
// Usage: node scripts/version-bump.cjs 1.2.3

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node scripts/version-bump.cjs <new-version>');
  process.exit(1);
}

const newVersion = process.argv[2];

// Helper to update JSON files
function updateJson(filePath, updater) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  updater(json);
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
}

// Update package.json
const pkgPath = path.join(__dirname, '../package.json');
updateJson(pkgPath, json => { json.version = newVersion; });
console.log(`Updated package.json to ${newVersion}`);

// Update tauri.conf.json
const tauriConfPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
updateJson(tauriConfPath, json => {
  if (json.package) {
    json.package.version = newVersion;
  } else if (json.tauri && json.tauri.package) {
    json.tauri.package.version = newVersion;
  } else if (json.version) {
    json.version = newVersion;
  }
});
console.log(`Updated tauri.conf.json to ${newVersion}`);

// Update Cargo.toml
const cargoPath = path.join(__dirname, '../src-tauri/Cargo.toml');
let cargoToml = fs.readFileSync(cargoPath, 'utf8');
cargoToml = cargoToml.replace(/version\s*=\s*"[^"]+"/, `version = "${newVersion}"`);
fs.writeFileSync(cargoPath, cargoToml);
console.log(`Updated Cargo.toml to ${newVersion}`);

// Run npm install and cargo update
const { execSync } = require('child_process');
try {
  execSync('npm install', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  execSync('cargo update', { cwd: path.join(__dirname, '../src-tauri'), stdio: 'inherit' });
  console.log('Updated lock files.');
} catch (e) {
  console.error('Error updating lock files:', e);
  process.exit(1);
}
