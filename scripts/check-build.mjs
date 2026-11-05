import { readFile, access, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = '/portfolio-elan-beauty/';
const routes = ['', 'services', 'team', 'gallery', 'about', 'booking', 'ritual', 'contacts',
  ...['hair','color','nails','face','makeup','brows','spa'].map(id=>`services/${id}`),
  ...['anna','maria','sofia','elena'].map(id=>`team/${id}`)];
for (const route of routes) {
  const html = await readFile(`dist/${route ? route+'/' : ''}index.html`, 'utf8');
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (url.startsWith('https:')) continue;
    assert(url.startsWith(base), `Wrong base: ${route}: ${url}`);
    await access('dist/'+url.slice(base.length));
  }
}
const css = await readFile('dist/fonts/fonts.css', 'utf8');
for (const [, font] of css.matchAll(/url\(\.\/([^)]+)\)/g)) await access('dist/fonts/'+font);
for (const id of ['hero','salon','hair','color','nails','face','makeup','brows','spa','detail','anna','maria','sofia','elena']) {
  await access(`dist/images/${id}.jpg`); await access(`dist/images/${id}-small.webp`);
}
const source = await readFile('src/main.tsx','utf8');
assert(!/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket)\s*\(/.test(source), 'Unexpected network API');
assert(!/<(?:input|form)\b/.test(source), 'Unexpected personal-data form');
assert(!/\b(localStorage|sessionStorage)\b/.test(source), 'Unexpected persistence');
await access('dist/404.html'); await access('dist/.nojekyll');
console.log(`Build verified: ${routes.length} page entries, local assets, fonts, demo has no data transport or personal-data forms.`);
