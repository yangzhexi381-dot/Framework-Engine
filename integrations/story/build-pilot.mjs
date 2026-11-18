import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const oldRead = 'JSON.parse(localStorage.getItem(key))';
const oldWrite = 'localStorage.setItem(key,JSON.stringify(value))';
const oldRemove = 'localStorage.removeItem(';
const adapterImport = "'../../data/json-document.js'";

function replaceOnce(source, marker, replacement) {
  const first = source.indexOf(marker);
  if (first === -1 || source.indexOf(marker, first + marker.length) !== -1) {
    throw new Error('Source does not match the supported Story Framework pilot structure.');
  }
  return source.slice(0, first) + replacement + source.slice(first + marker.length);
}

function moduleUrl(source) {
  return 'data:text/javascript;base64,' + Buffer.from(source, 'utf8').toString('base64');
}

export function buildPilot(source, { jsonDocument, adapter }) {
  const start = source.indexOf('<script>');
  const end = source.indexOf('</script>', start);
  if (start < 0 || end < 0 || source.indexOf('<script>', start + 8) >= 0) {
    throw new Error('Expected one classic script in the supported pilot.');
  }
  const program = source.slice(start + 8, end);
  if (!program.includes('designRevealBtn') || !program.includes("if(e==='TRUE')meta.worldAwake=true;") ||
      !program.includes(oldRemove)) {
    throw new Error('Expected the branching pilot with its true-ending reveal and save controls.');
  }
  const withRead = replaceOnce(program, oldRead, 'feStorySaveStore.read(key)');
  const withWrite = replaceOnce(withRead, oldWrite, 'feStorySaveStore.write(key,value)');
  const integrated = withWrite.replaceAll(oldRemove, 'feStorySaveStore.remove(');
  const adapterSource = replaceOnce(adapter, adapterImport, JSON.stringify(moduleUrl(jsonDocument)));
  const bootstrap = [
    '<script type="module" data-framework-engine="story">',
    'import { createStorySaveStore } from ' + JSON.stringify(moduleUrl(adapterSource)) + ';',
    'const feStorySaveStore = createStorySaveStore({ getStorage: () => globalThis.localStorage });',
    ''
  ].join('\n');
  return source.slice(0, start) + bootstrap + integrated + source.slice(end);
}

export async function writePilot(sourcePath, outputPath) {
  const [source, jsonDocument, adapter] = await Promise.all([
    readFile(sourcePath, 'utf8'),
    readFile(new URL('../../src/data/json-document.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/adapters/story/save-store.js', import.meta.url), 'utf8')
  ]);
  await writeFile(outputPath, buildPilot(source, { jsonDocument, adapter }), { encoding: 'utf8', flag: 'wx' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [source, output, ...extra] = process.argv.slice(2);
  if (!source || !output || extra.length) {
    console.error('Usage: npm run integrate:story -- <source.html> <new-output.html>');
    process.exitCode = 2;
  } else {
    try {
      await writePilot(source, output);
      console.log('Built standalone FE Story Framework pilot at ' + output);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
