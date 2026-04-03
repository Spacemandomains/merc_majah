import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rm } from 'node:fs/promises';
import { build as esbuild } from 'esbuild';
import esbuildPluginPino from 'esbuild-plugin-pino';

// allow plugins to use require() in ESM
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(artifactDir, 'dist');

// Remove the old dist folder; otherwise stale worker files remain
await rm(distDir, { recursive: true, force: true });

await esbuild({
  entryPoints: [path.resolve(artifactDir, 'src/vercel.ts')],
  platform: 'node',
  bundle: true,
  format: 'esm',
  outdir: distDir,
  outExtension: { '.js': '.mjs' },
  logLevel: 'info',
  // external packages omitted for brevity …
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
  banner: {
    js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
  },
});

console.log(`Vercel bundle built → ${path.relative(process.cwd(), distDir)}/vercel.mjs`);
