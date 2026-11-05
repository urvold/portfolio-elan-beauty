# Публикация через GitHub Pages

Репозиторий: https://github.com/urvold/portfolio-elan-beauty

Сайт: https://urvold.github.io/portfolio-elan-beauty/

## Конфигурация

В Settings → Pages выбран источник GitHub Actions. HTTPS включён.

Workflow `.github/workflows/pages.yml` запускается при push в `main` или вручную. Он устанавливает зависимости через `npm ci`, запускает тесты, собирает проект, проверяет пути ресурсов и загружает production-артефакт в Pages. Публикацию выполняет `actions/deploy-pages` с минимальными правами. Пользовательские секреты не требуются.

Базовый путь: `/portfolio-elan-beauty/`. Сборка создаёт HTML-точки входа для 19 известных страниц, отдельный `404.html` и `.nojekyll`. Фотографии и шрифты локальные. Для прямых ссылок и обновления страниц не требуется SPA-редирект через 404.

## Проверки

- `npm test` — 6 тестов доменной логики.
- `npm run build` — TypeScript и production-сборка.
- `node scripts/check-build.mjs` — пути всех страниц, фотографии, шрифты и отсутствие форм персональных данных и сетевой отправки в приложении.
- `node scripts/check-live.mjs` — после успешного workflow проверяет HTTPS, HTTP 200 и совпадение содержимого всех опубликованных страниц и ресурсов с локальной сборкой, а также прямые ссылки с параметрами.

Статус публикаций: https://github.com/urvold/portfolio-elan-beauty/actions

Исходный репозиторий исключает node_modules, dist, env, ключи и служебные каталоги. Демо не создаёт реальную запись и не собирает персональные данные.
