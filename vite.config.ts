import { defineConfig } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { services, masters } from './src/data';

// Real HTML entry points let GitHub Pages serve deep links with HTTP 200.
export default defineConfig({
  base: '/portfolio-elan-beauty/',
  plugins: [{
    name: 'github-pages-route-entrypoints',
    async closeBundle() {
      const output = resolve('dist');
      const html = await readFile(resolve(output, 'index.html'), 'utf8');
      const routes = ['services', 'team', 'gallery', 'about', 'booking', 'ritual', 'contacts',
        ...services.map(s => `services/${s.id}`), ...masters.map(m => `team/${m.id}`)];
      for (const route of routes) {
        const directory = resolve(output, route);
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, 'index.html'), html);
      }
      await writeFile(resolve(output, '404.html'), html);
      await writeFile(resolve(output, '.nojekyll'), '');
    }
  }]
});
