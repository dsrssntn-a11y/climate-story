const fs = require('node:fs');
const path = require('node:path');

const pnpmStoreRoot = path.join(process.cwd(), 'node_modules', '.pnpm');

if (!fs.existsSync(pnpmStoreRoot)) {
  console.log('No pnpm store found; skipping Vercel adapter patch.');
  process.exit(0);
}

function findQwikCityPackages(dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith('@builder.io+qwik-city')) {
        const packageRoot = path.join(fullPath, 'node_modules', '@builder.io', 'qwik-city');
        const adapterEntry = path.join(packageRoot, 'lib', 'adapters', 'vercel-edge', 'vite', 'index.mjs');
        if (fs.existsSync(adapterEntry)) {
          results.push(packageRoot);
        }
      }

      results.push(...findQwikCityPackages(fullPath));
    }
  }

  return results;
}

const packageRoots = [...new Set(findQwikCityPackages(pnpmStoreRoot))];

if (packageRoots.length === 0) {
  console.log('Qwik City package not found; skipping Vercel adapter patch.');
  process.exit(0);
}

let patched = 0;

for (const packageRoot of packageRoots) {
  const adapterPaths = [
    path.join(packageRoot, 'lib', 'adapters', 'vercel-edge', 'vite', 'index.mjs'),
    path.join(packageRoot, 'lib', 'adapters', 'vercel-edge', 'vite', 'index.cjs')
  ];

  for (const adapterPath of adapterPaths) {
    if (!fs.existsSync(adapterPath)) {
      continue;
    }

    const original = fs.readFileSync(adapterPath, 'utf8');
    const updated = original.replace(
      /(\b[\w$.]+\.promises)\.rename\(clientPublicOutDir, vercelStaticDir\);/,
      '$1.cp(clientPublicOutDir, vercelStaticDir, { recursive: true, force: true });\n      await $1.rm(clientPublicOutDir, { recursive: true, force: true });'
    );

    if (updated !== original) {
      fs.writeFileSync(adapterPath, updated);
      patched += 1;
    }
  }
}

if (patched === 0) {
  console.log('Vercel adapter already patched or no patch was needed.');
} else {
  console.log(`Patched ${patched} Vercel adapter file(s) to use copy-and-remove instead of rename.`);
}
