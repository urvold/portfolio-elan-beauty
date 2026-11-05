import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const origin = new URL('https://urvold.github.io/portfolio-elan-beauty/');
const sha = data => createHash('sha256').update(data).digest('hex');
async function files(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await files(directory + '/' + entry.name, path + '/'));
    else if (entry.name !== '.nojekyll' && entry.name !== '404.html') result.push(path);
  }
  return result;
}
const paths = await files('dist');
const queue = [...paths];
await Promise.all(Array.from({length: 4}, async () => {
  for (let path; (path = queue.shift()) !== undefined;) {
    const url = new URL(path.endsWith('index.html') ? path.slice(0, -10) : path, origin);
    const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000) });
    assert.equal(new URL(response.url).protocol, 'https:', `HTTPS required: ${path}`);
    assert.equal(response.status, 200, `HTTP error: ${url}`);
    const actual = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(actual), sha(await readFile('dist/' + path)), `Published file differs: ${url}`);
    console.log(`OK ${url.pathname}`);
  }
}));
for (const path of ['booking?service=hair', 'services/hair', 'team/anna']) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `Deep link failed: ${path}`);
  assert((await response.text()).includes('id="root"'));
}
console.log(`HTTPS publication verified: ${paths.length} files and three direct/query links.`);
