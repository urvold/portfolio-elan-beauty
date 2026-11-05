# Публикация через GitHub Pages

Текущая подготовка: исходный код, базовый путь, HTML-точки входа и Actions workflow готовы. Создание репозитория через подключённый аккаунт отклонено GitHub: HTTP 403, Resource not accessible by integration. Публикация ещё не выполнена.

## Что требуется от владельца

1. Создать пустой публичный репозиторий `urvold/portfolio-elan-beauty` без README, лицензии и .gitignore: https://github.com/new?name=portfolio-elan-beauty .
2. Предоставить подключённой GitHub-интеграции доступ к новому репозиторию. Для дальнейшей загрузки нужны запись Contents и Workflows; для включения Pages — Pages write. Если интеграция не позволяет управлять Pages, владелец выбирает Settings → Pages → Build and deployment → Source: GitHub Actions.
3. Сообщить о готовности. Пароли и токены в чат передавать не нужно.

## Последовательность дальнейшей публикации

- Проверить доступ именно к `urvold/portfolio-elan-beauty`.
- Включить GitHub Pages с источником workflow (GitHub API: POST `/repos/urvold/portfolio-elan-beauty/pages`, JSON `{"build_type":"workflow"}`).
- Добавить origin `https://github.com/urvold/portfolio-elan-beauty.git` и загрузить локальную ветку `main` без force push.
- Дождаться успешного workflow `Publish ÉLAN BEAUTY to GitHub Pages`.
- Запустить `node scripts/check-live.mjs`: проверяет HTTPS, HTTP 200 и совпадение содержимого всех опубликованных страниц и ресурсов с локальной production-сборкой, а также прямые ссылки с параметрами.

Ожидаемый адрес: https://urvold.github.io/portfolio-elan-beauty/ . До успешной проверки этот адрес не считается работающим сайтом.
