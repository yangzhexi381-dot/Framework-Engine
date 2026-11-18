#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { cp, lstat, mkdir, mkdtemp, rename, rm, rmdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PIN = '61575a45e2eac096f5b7ddcbf6c40ae2494b8ef1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FE_ROOT = path.resolve(HERE, '../..');
const PATCH = path.join(HERE, 'overlay.patch');

function git(args, options = {}) {
  const result = spawnSync('git', args, { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `git ${args[0]} failed`).trim());
  return result.stdout;
}

async function main() {
  const [checkoutArg, outputArg] = process.argv.slice(2);
  if (!checkoutArg || !outputArg || process.argv.length !== 4) {
    throw new Error('Usage: node integrations/chemistry/prepare.mjs <baseline-CF-checkout> <new-output-path>');
  }
  const checkout = path.resolve(checkoutArg);
  const output = path.resolve(outputArg);
  if (output === checkout || output.startsWith(checkout + path.sep) || checkout.startsWith(output + path.sep)) {
    throw new Error('Checkout and output paths must not contain one another.');
  }
  try { await lstat(output); throw new Error(`Output already exists; refusing overwrite: ${output}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  git(['-C', checkout, 'cat-file', '-e', `${PIN}^{commit}`]);
  const parent = path.dirname(output);
  await mkdir(parent, { recursive: true });
  const stage = await mkdtemp(path.join(parent, '.cf-fe-stage-'));
  try {
    const archive = spawnSync('git', ['-C', checkout, 'archive', PIN], { encoding: null });
    if (archive.status !== 0) throw new Error('Could not archive the pinned Chemistry Framework revision.');
    const unpack = spawnSync('tar', ['-x', '-C', stage], { input: archive.stdout, encoding: null });
    if (unpack.status !== 0) throw new Error('Could not unpack the pinned Chemistry Framework archive.');
    // Isolate git apply from any enclosing repository, including the FE checkout.
    git(['-C', stage, 'init', '--quiet']);
    git(['-C', stage, 'apply', PATCH]);
    await rm(path.join(stage, '.git'), {recursive: true});
    await mkdir(path.join(stage, 'src', 'framework-engine'), { recursive: true });
    await cp(path.join(FE_ROOT, 'src'), path.join(stage, 'src', 'framework-engine'), { recursive: true, errorOnExist: true });
    await mkdir(output);
    try {
      await rename(stage, output);
    } catch (error) {
      await rmdir(output);
      throw error;
    }
  } catch (error) {
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
  process.stdout.write(`Prepared pinned CF + Framework Engine at ${output}\n`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
