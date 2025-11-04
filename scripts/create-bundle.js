#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const bundleName = 'sap-rpt-1-mcp.mcpb';

console.log('🎁 Creating MCP bundle...\n');

// Clean up previous bundle
if (fs.existsSync(path.join(rootDir, bundleName))) {
  console.log('🧹 Removing previous bundle...');
  fs.unlinkSync(path.join(rootDir, bundleName));
}

// Build the project (creates build directory)
console.log('🔨 Building project...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// Copy manifest.json into build directory
console.log('📋 Copying manifest.json to build directory...');
const manifestSrc = path.join(rootDir, 'manifest.json');
const manifestDest = path.join(buildDir, 'manifest.json');
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log('  ✓ manifest.json');
} else {
  console.error('❌ manifest.json not found!');
  process.exit(1);
}

// Create the .mcpb bundle (zip the build directory)
console.log('\n📦 Creating .mcpb bundle...');
try {
  // Zip from inside the build directory so contents are at the root
  execSync(`cd "${buildDir}" && zip -r "../${bundleName}" . -q`, {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log(`✅ Bundle created: ${bundleName}`);
} catch (error) {
  console.error('❌ Failed to create bundle. Please install zip or create manually:');
  console.error(`   cd build && zip -r ../${bundleName} .`);
  process.exit(1);
}

// Clean up manifest.json from build directory
console.log('\n🧹 Cleaning up...');
fs.unlinkSync(manifestDest);

console.log('\n✨ Done! Your MCP bundle is ready.');
console.log(`📦 Bundle location: ${bundleName}\n`);
