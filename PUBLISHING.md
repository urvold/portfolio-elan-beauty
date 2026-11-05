# Публикация через GitHub Pages

Репозиторий создан владельцем: https://github.com/urvold/portfolio-elan-beauty . Исходный код загружен в `main`, включая `.github/workflows/pages.yml`.

Базовый путь: `/portfolio-elan-beauty/`. Сборка создаёт HTML-точки входа для 19 известных страниц, отдельный `404.html` и `.nojekyll`. Фотографии и шрифты локальные.

## Включение Pages

API включения Pages отклонил запрос подключённой интеграции: HTTP 403, Resource not accessible by integration. Владелец должен один раз выбрать Settings → Pages → Build and deployment → Source: GitHub Actions:
https://github.com/urvold/portfolio-elan-beauty/settings/pages

Если начальный workflow завершится до включения Pages, его необходимо повторить после выбора источника. Дальнейшие обновления публикуются автоматически при push в `main`.

## Проверки

- `npm test` — 6 тестов доменной логики.
- `npm run build` — TypeScript и production-сборка.
- `node scripts/check-build.mjs` — пути всех страниц, фотографии, шрифты и отсутствие форм персональных данных и сетевой отправки в приложении.
- `node scripts/check-live.mjs` — после завершения workflow проверяет HTTPS, HTTP 200 и совпадение содержимого всех опубликованных страниц и ресурсов с локальной сборкой, а также прямые ссылки с параметрами.

Ожидаемый адрес: https://urvold.github.io/portfolio-elan-beauty/ . До успешного workflow и HTTP-проверки публикация не считается подтверждённой.

Исходный репозиторий исключает node_modules, dist, env, ключи и служебные каталоги. Workflow не требует пользовательских секретов. Демо не создаёт реальную запись и не собирает персональные данные.
