import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';

// Real React components in a DOM environment. These tests do not measure layout
// or emulate WebKit; their scope is interaction, focus, text and navigation.
const source = (await readFile('src/main.tsx', 'utf8')).replace(
  "createRoot(document.getElementById('root')!).render",
  "const root=createRoot(document.getElementById('root')!); window.__mount=()=>root.render"
) + '\nwindow.__act=React.act;window.__unmount=()=>root.unmount();';
const bundle = await build({
  stdin: { contents: source, resolveDir: resolve('src'), loader: 'tsx' },
  bundle: true, write: false, format: 'iife', loader: { '.css': 'empty' },
  define: { 'import.meta.env.BASE_URL': '"/portfolio-elan-beauty/"', 'process.env.NODE_ENV': '"development"' }
});
async function page(path = '/', width = 390, reduced = false) {
  const errors = [];
  const network = [];
  const console = new VirtualConsole();
  console.on('jsdomError', e => errors.push(String(e)));
  console.on('error', (...e) => errors.push(e.map(String).join(' ')));
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://example.test/portfolio-elan-beauty' + path,
    pretendToBeVisual: true, runScripts: 'outside-only', virtualConsole: console
  });
  const w = dom.window;
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.MessageChannel = class {
    port1 = { onmessage: null };
    port2 = { postMessage: () => queueMicrotask(() => this.port1.onmessage?.()) };
  };
  w.innerWidth = width;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () { w.__lastScrolled = this; };
  w.matchMedia = query => ({ matches: query.includes('prefers-reduced-motion') ? reduced : width <= 767 });
  w.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; }
    observe(target) { this.callback([{ target, isIntersecting: true }]); }
    unobserve() {}
    disconnect() {}
  };
  w.fetch = (...args) => { network.push(args); throw Error('Unexpected fetch'); };
  w.XMLHttpRequest = class { constructor() { network.push('XHR'); throw Error('Unexpected XHR'); } };
  w.navigator.sendBeacon = (...args) => { network.push(args); return false; };
  w.eval(bundle.outputFiles[0].text);
  await w.__act(() => w.__mount());
  const doc = w.document;
  const one = selector => { const result = doc.querySelector(selector); assert(result, selector); return result; };
  const button = text => {
    const result = [...doc.querySelectorAll('button')].find(el => el.textContent.trim() === text);
    assert(result, `Button: ${text}`); return result;
  };
  const click = async el => { assert(!el.disabled, `Disabled: ${el.textContent}`); await w.__act(() => el.click()); };
  const key = async (value, shiftKey = false) => w.__act(() => w.dispatchEvent(new w.KeyboardEvent('keydown', { key: value, shiftKey, bubbles: true, cancelable: true })));
  const close = async () => {
    await w.__act(() => w.__unmount());
    assert.deepEqual(errors, [], 'React/DOM console errors');
    assert.deepEqual(network, [], 'No network/data submission');
    dom.window.close();
  };
  return { w, doc, one, button, click, key, close };
}
async function selectHairAndMaster(p) {
  await p.click(p.one('.service-option'));
  await p.click(p.button('Продолжить'));
  assert.equal(p.doc.querySelectorAll('.master-options > button').length, 1);
  assert.match(p.one('.master-options').textContent, /Анна Миронова/);
  await p.click(p.one('.master-options > button'));
  await p.click(p.button('Продолжить'));
}
async function selectDateTime(p) {
  await p.click(p.one('.calendar-heading button:last-child'));
  await p.click(p.one('.calendar-grid button:not(:disabled)'));
  await p.click(p.one('.time-slots button:not(:disabled)'));
  return p.one('.time-slots button[aria-pressed="true"]').textContent;
}

test('Full demo booking preserves procedure, specialist, date and time on every return', async () => {
  const p = await page('/booking');
  assert.equal(p.doc.activeElement, p.one('.step-heading'));
  await selectHairAndMaster(p);
  const time = await selectDateTime(p);
  await p.click(p.button('Продолжить'));
  assert.match(p.one('.confirmation').textContent, /Стрижка и форма/);
  assert.match(p.one('.confirmation').textContent, /Анна Миронова/);
  assert(p.one('.confirmation').textContent.includes(time));
  await p.click(p.button('Назад'));
  assert.equal(p.one('.time-slots button[aria-pressed="true"]').textContent, time);
  const selected = p.one('.calendar-grid button[aria-pressed="true"]');
  await p.click(selected); // Re-tapping the selected day must not discard the time.
  assert.equal(p.one('.time-slots button[aria-pressed="true"]').textContent, time);
  await p.click(p.button('Назад'));
  assert.match(p.one('.master-options .chosen').textContent, /Анна/);
  await p.click(p.button('Назад'));
  assert.match(p.one('.service-option.chosen').textContent, /Стрижка/);
  assert.equal(p.w.__lastScrolled, p.one('.step-heading'));
  assert.equal(p.doc.activeElement, p.one('.step-heading'));
  for (let i = 0; i < 3; i++) await p.click(p.button('Продолжить'));
  await p.click(p.button('Подтвердить демонстрацию'));
  assert.match(p.one('.success').textContent, /запись в салон не создана/);
  assert.equal(p.doc.querySelectorAll('input,form').length, 0);
  await p.close();
});
test('Changing direction clears incompatible specialist and appointment, then offers the correct master', async () => {
  const p = await page('/booking');
  await selectHairAndMaster(p); await selectDateTime(p);
  await p.click(p.one('.steps button'));
  await p.click([...p.doc.querySelectorAll('.service-option')].find(el => el.textContent.includes('Безупречные детали')));
  assert.equal(p.doc.querySelector('.summary-master'), null);
  await p.click(p.button('Продолжить'));
  assert.match(p.one('.master-options').textContent, /Мария Белова/);
  assert.doesNotMatch(p.one('.master-options').textContent, /Анна/);
  await p.click(p.one('.master-options > button')); await p.click(p.button('Продолжить'));
  assert.equal(p.doc.querySelector('.calendar-grid button[aria-pressed="true"]'), null);
  assert.equal(p.doc.querySelector('.time-slots button'), null);
  assert(p.button('Продолжить').disabled);
  await p.close();
});
test('Changing procedure with the same specialist clears stale time but keeps the specialist', async () => {
  const p = await page('/booking'); await selectHairAndMaster(p); await selectDateTime(p);
  await p.click(p.one('.steps button'));
  await p.click([...p.doc.querySelectorAll('.service-option')].find(el => el.textContent.includes('Цвет с вашим характером')));
  assert.match(p.one('.summary-master').textContent, /Анна/);
  await p.click(p.button('Продолжить')); await p.click(p.button('Продолжить'));
  assert.equal(p.doc.querySelector('.time-slots button[aria-pressed="true"]'), null);
  assert(p.button('Продолжить').disabled);
  await p.close();
});
test('Ritual supports editing answers, empty matches and a preselected booking link', async () => {
  const p = await page('/ritual');
  await p.click(p.button('Обновление')); await p.click(p.button('Далее'));
  await p.click(p.button('До 60 минут')); await p.click(p.button('Далее'));
  await p.click(p.button('Окрашивание волос')); await p.click(p.button('Мой ритуал'));
  assert.match(p.one('.empty-result').textContent, /нет процедур до 60 минут/);
  await p.click(p.button('Изменить ответы'));
  assert.equal(p.doc.activeElement, p.one('.step-heading'));
  assert.equal(p.w.__lastScrolled, p.one('.step-heading'));
  assert.equal(p.button('Обновление').getAttribute('aria-pressed'), 'true');
  await p.click(p.button('Далее')); await p.click(p.button('До 150 минут')); await p.click(p.button('Далее'));
  assert.equal(p.button('Окрашивание волос').getAttribute('aria-pressed'), 'true');
  await p.click(p.button('Мой ритуал'));
  assert.equal(p.doc.querySelectorAll('.quiz-result').length, 1);
  await p.click(p.one('.quiz-result a'));
  assert.match(p.one('.service-option.chosen').textContent, /Цвет с вашим характером/);
  assert.equal(p.w.location.search, '?service=color');
  await p.close();
});
test('Mobile navigation traps focus, closes with Escape and restores scroll and focus', async () => {
  const p = await page(); const toggle = p.one('.menu');
  await p.click(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert(p.one('main').hasAttribute('inert')); assert.equal(p.doc.body.style.overflow, 'hidden');
  toggle.focus(); await p.key('Tab'); assert.equal(p.doc.activeElement, p.one('header a'));
  await p.key('Escape'); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(p.doc.body.style.overflow, ''); assert.equal(p.doc.activeElement, toggle);
  await p.click(toggle); await p.click(p.one('nav a'));
  assert.equal(p.w.location.pathname, '/portfolio-elan-beauty/services');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  await p.close();
});
test('Gallery navigation does not steal focus and Escape restores the opening button', async () => {
  const p = await page('/gallery'); const opener = p.one('.gallery-grid button');
  await p.click(opener);
  const next = p.one('button[aria-label="Следующее фото"]');
  next.focus(); await p.click(next);
  assert.equal(p.doc.activeElement, next);
  await p.key('ArrowRight'); assert.match(p.one('.lightbox figcaption').textContent, /3 \/ 6/);
  await p.key('Escape'); assert.equal(p.doc.querySelector('.lightbox'), null);
  assert.equal(p.doc.activeElement, opener); assert.equal(p.doc.body.style.overflow, '');
  await p.close();
});
test('Home ritual copy has natural spaces and no platform emoji decoration', async () => {
  const p = await page(); const copy = p.one('.ritual-banner p').textContent;
  assert(copy.includes('тишины. Ответьте')); assert(copy.includes('подберём процедуры'));
  assert.equal(p.doc.querySelector('.big-flower'), null); assert(!p.doc.body.textContent.includes('✳'));
  await p.close();
});
test('Reduced motion renders content without reveal classes', async () => {
  const p = await page('/', 390, true);
  assert.equal(p.doc.querySelector('.reveal'), null); await p.close();
});
test('All routes render, internal links resolve, image and font files remain local and present', async () => {
  const routes = ['/', '/services', '/team', '/gallery', '/about', '/contacts', '/booking', '/ritual',
    ...['hair','color','nails','face','makeup','brows','spa'].map(id=>'/services/'+id),
    ...['anna','maria','sofia','elena'].map(id=>'/team/'+id)];
  for (const route of [...routes, '/missing']) {
    const p = await page(route);
    assert.equal(p.doc.querySelectorAll('h1').length, 1, route);
    for (const image of p.doc.querySelectorAll('img')) {
      const file = new URL(image.src).pathname.replace('/portfolio-elan-beauty/', 'public/');
      await access(file); assert(image.hasAttribute('alt'));
    }
    for (const anchor of p.doc.querySelectorAll('a')) {
      const url = new URL(anchor.href);
      const path = url.pathname.replace('/portfolio-elan-beauty', '') || '/';
      assert(routes.includes(path) || (url.hash && url.pathname === p.w.location.pathname), `Broken route: ${anchor.href}`);
      if (url.hash) assert(p.doc.getElementById(url.hash.slice(1)), `Broken anchor ${url.hash}`);
    }
    assert.doesNotMatch(p.doc.body.textContent, /тишины\.Ответьте|подберёмпроцедуры/);
    assert.equal(p.doc.querySelectorAll('input,form').length, 0);
    if (route === '/missing') assert.match(p.doc.querySelector('h1').textContent, /тишины/);
    await p.close();
  }
});
test('Every catalog direction completes booking with its compatible specialist and catalog price', async () => {
  const { services, masters, money } = await import('../src/data.ts');
  for (const service of services) {
    const p = await page('/booking?service=' + service.id);
    assert.match(p.one('.service-option.chosen').textContent, new RegExp(service.name));
    await p.click(p.button('Продолжить'));
    const names = [...p.doc.querySelectorAll('.master-options strong')].map(el => el.textContent);
    assert.deepEqual(names, masters.filter(m => m.services.includes(service.id)).map(m => m.name));
    await p.click(p.one('.master-options > button')); await p.click(p.button('Продолжить'));
    await selectDateTime(p);
    const availableTimes = [...p.doc.querySelectorAll('.time-slots button:not(:disabled)')];
    assert(availableTimes.every(el => { const [h,m] = el.textContent.split(':').map(Number); return h*60+m+service.duration<=1200; }));
    assert(p.doc.querySelectorAll('.time-slots button:disabled').length > 0);
    await p.click(p.button('Продолжить'));
    assert(p.one('.confirmation').textContent.includes(money(service.price)));
    await p.click(p.button('Подтвердить демонстрацию'));
    assert.match(p.one('.success').textContent, /запись в салон не создана/);
    await p.close();
  }
});
test('Calendar bounds, disabled dates and month changes work without silently changing selected appointment', async () => {
  const p = await page('/booking'); await selectHairAndMaster(p);
  assert(p.one('.calendar-heading button:first-child').disabled);
  for (const day of p.doc.querySelectorAll('.calendar-grid button')) {
    const label = day.getAttribute('aria-label');
    const date = new Date(); date.setDate(Number(day.textContent));
    if (date.getDay() === 1) assert(day.disabled, label);
    if (Number(day.textContent) < new Date().getDate()) assert(day.disabled, label);
  }
  const time = await selectDateTime(p);
  const selectedDay = p.one('.calendar-grid button[aria-pressed="true"]').getAttribute('aria-label');
  await p.click(p.one('.calendar-heading button:last-child'));
  assert(p.one('.calendar-heading button:last-child').disabled);
  await p.click(p.one('.calendar-heading button:first-child'));
  assert.equal(p.one('.calendar-grid button[aria-pressed="true"]').getAttribute('aria-label'), selectedDay);
  assert.equal(p.one('.time-slots button[aria-pressed="true"]').textContent, time);
  await p.click([...p.doc.querySelectorAll('.calendar-grid button:not(:disabled)')].find(el => el.getAttribute('aria-pressed') !== 'true'));
  assert.equal(p.doc.querySelector('.time-slots button[aria-pressed="true"]'), null);
  assert(p.button('Продолжить').disabled);
  await p.close();
});
test('Catalog filtering updates visible procedures and accessible state', async () => {
  const p = await page('/services');
  assert.equal(p.doc.querySelectorAll('.service-card').length, 7);
  await p.click(p.button('Уход за лицом'));
  assert.equal(p.doc.querySelectorAll('.service-card').length, 1);
  assert.match(p.one('.service-card').textContent, /Прикосновение сияния/);
  assert.equal(p.button('Уход за лицом').getAttribute('aria-pressed'), 'true');
  await p.click(p.button('Все направления'));
  assert.equal(p.doc.querySelectorAll('.service-card').length, 7);
  await p.close();
});
