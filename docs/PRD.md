# PRD: Stitch Design Skill

## Мета

| Поле | Значение |
|------|----------|
| Название | `stitch-design-skill` |
| Версия | 0.1.0 |
| Статус | Draft |
| Автор | — |
| Дата | 2025-06-19 |
| Зависимость | Google Stitch API (Beta), `@google/stitch-sdk@0.0.3` |

---

## 1. Проблема

При разработке интерфейсов узкое место — переход от идеи к визуальному прототипу. Дизайнерские инструменты (Figma, Sketch) требуют ручной работы. AI-генераторы (v0, bolt) работают только через веб-интерфейс. Нет способа из CLI или агента по текстовому описанию получить готовый HTML-экран, итерировать над ним и встроить результат прямо в кодовую базу — всё в рамках одного рабочего флоу.

Google Stitch решает генерацию. Этот скилл решает оркестрацию: связывает Stitch API с рабочим процессом разработчика через CLI и AI-агентов.

---

## 2. Решение

TypeScript-скилл, который оборачивает Google Stitch SDK и предоставляет набор высокоуровневых команд для генерации, итерации и экспорта UI-дизайнов. Работает из CLI, интегрируется с Claude Code и другими AI-агентами через MCP.

---

## 3. Связка с аккаунтом Stitch

### 3.1. Получение API-ключа

1. Открыть https://stitch.withgoogle.com
2. Войти с Google-аккаунтом
3. Перейти в Settings → API Keys
4. Сгенерировать ключ
5. Сохранить ключ в переменной окружения:
```bash
export STITCH_API_KEY="sk-stitch-..."
```

Альтернатива — добавить в `.env` файл проекта (не коммитить в git).

### 3.2. OAuth-метод (опционально)

Для окружений, где хранение ключей на диске нежелательно:

1. Установить Google Cloud SDK (`gcloud`)
2. Настроить проект GCP с разрешениями для Stitch
3. Получить access token через `gcloud auth print-access-token`
4. Задать переменные:
```bash
export STITCH_ACCESS_TOKEN="ya29...."
export GOOGLE_CLOUD_PROJECT="my-project-id"
```

### 3.3. Проверка подключения
```bash
npx tsx scripts/check-connection.ts
# → "Connected. 14 tools available. Projects: 3"
```

---

## 4. Use Cases

### UC-1: Генерация экрана по описанию

**Актор:** Разработчик в CLI / AI-агент
**Триггер:** Текстовый промпт с описанием экрана
**Флоу:**

1. Пользователь запускает команду: `stitch generate "Дашборд аналитики с графиками продаж, тёмная тема, таблица топ-продуктов"`
2. Скилл создаёт/выбирает проект
3. Вызывает `project.generate(prompt)` с указанным deviceType (desktop/mobile/tablet)
4. Получает Screen-объект
5. Скачивает HTML и скриншот в локальную директорию `./stitch-output/`
6. Выводит путь к файлам и URL превью

**Выход:** `./stitch-output/{screenId}/index.html`, `./stitch-output/{screenId}/preview.png`

### UC-2: Итеративное редактирование

**Актор:** Разработчик в диалоге с агентом
**Триггер:** Follow-up промпт к существующему экрану
**Флоу:**

1. Пользователь указывает ID экрана + промпт: `stitch edit <screenId> "Сделай sidebar collapsible, добавь аватар пользователя в хедер"`
2. Скилл вызывает `screen.edit(prompt)`
3. Получает новый Screen (оригинал сохраняется)
4. Сохраняет обновлённый HTML и скриншот рядом с оригиналом
5. Показывает diff-превью (было/стало)

**Выход:** Новый HTML + скриншот, ссылка на оба варианта

### UC-3: Генерация вариантов

**Актор:** Дизайнер/Разработчик, исследующий варианты
**Триггер:** Запрос на альтернативные версии экрана
**Флоу:**

1. `stitch variants <screenId> "Попробуй другие цветовые схемы" --count 3 --range explore --aspects color_scheme,layout`
2. Скилл вызывает `screen.variants(prompt, options)`
3. Получает массив Screen-объектов
4. Сохраняет каждый вариант в поддиректорию
5. Генерирует сводную HTML-страницу с превью всех вариантов

**Выход:** Директория с N вариантами + `index.html` с grid-превью

### UC-4: Экстракция темы для интеграции в проект

**Актор:** Разработчик, встраивающий дизайн в существующий проект
**Триггер:** Нужно извлечь Tailwind-конфиг, шрифты, иконки из сгенерированного дизайна
**Флоу:**

1. `stitch extract-theme <screenId>`
2. Скилл получает HTML через `screen.getHtml()`
3. Парсит из HTML: Tailwind CSS конфигурацию, Google Fonts ссылки, Material Symbols иконки
4. Генерирует файлы: `tailwind.config.extract.js`, `fonts.css`, `icons-manifest.json`

**Выход:** Набор конфигурационных файлов, готовых к копированию в проект

### UC-5: Batch-генерация многоэкранного приложения

**Актор:** AI-агент, строящий прототип приложения
**Триггер:** Спецификация нескольких экранов (JSON/YAML)
**Флоу:**

1. Агент получает файл `screens.yaml` с описанием каждого экрана
2. Скилл создаёт проект
3. Последовательно генерирует каждый экран
4. Применяет единую дизайн-систему ко всем экранам через `apply_design_system`
5. Экспортирует все артефакты в структурированную директорию

**Выход:** Директория с HTML и скриншотами всех экранов + единая дизайн-система

### UC-6: Загрузка скриншота/wireframe для оцифровки

**Актор:** Дизайнер с бумажным скетчем или скриншотом конкурента
**Триггер:** Изображение на входе
**Флоу:**

1. `stitch upload ./wireframe.png "Преврати в чистый UI с Material Design"`
2. Скилл вызывает `upload_screens_from_images` с файлом
3. Получает Screen-объект на основе загруженного изображения
4. Далее — стандартный флоу edit/variants для итерации

**Выход:** Редактируемый Screen на основе изображения

### UC-7: Дизайн-система как код

**Актор:** Тех-лид, стандартизирующий UI проекта
**Триггер:** Необходимость единообразного стиля для всех экранов
**Флоу:**

1. `stitch design-system create "Corporate Blue"`
2. `stitch design-system apply <projectId>` — применить ко всему проекту
3. При каждой новой генерации — автоматически применять дизайн-систему

**Выход:** Все экраны проекта в едином стилистическом ключе

### UC-8: Интеграция с AI-агентом (Claude Code / Cursor)

**Актор:** AI-агент в IDE
**Триггер:** Агент решает создать UI в процессе решения задачи
**Флоу:**

1. Агент через MCP подключается к Stitch-серверу (URL: `https://stitch.googleapis.com/mcp`)
2. Использует `callTool` / `listTools` для программного управления
3. Либо использует адаптер `stitchTools()` через Vercel AI SDK
4. Генерирует экраны, сохраняет в проект, применяет к кодовой базе

**Выход:** Дизайны, встроенные в рабочий процесс агента

---

## 5. CLI-интерфейс
```
stitch <command> [options]

Commands:
  generate <prompt>               Генерация экрана по описанию
  edit <screenId> <prompt>        Итеративное редактирование
  variants <screenId> <prompt>    Генерация вариантов
  upload <imagePath> [prompt]     Загрузка изображения для оцифровки
  extract-theme <screenId>        Извлечение темы (Tailwind, Fonts, Icons)
  list-projects                   Список проектов
  list-screens <projectId>        Список экранов в проекте
  design-system <sub-command>     Управление дизайн-системами
  batch <specFile>                Batch-генерация из спецификации
  check                           Проверка подключения и конфигурации

Global Options:
  --project <id>       ID проекта (если не указан — создаётся новый)
  --device <type>      DESKTOP | MOBILE | TABLET | AGNOSTIC (default: DESKTOP)
  --model <id>         GEMINI_3_PRO | GEMINI_3_FLASH (default: авто)
  --output <dir>       Выходная директория (default: ./stitch-output)
  --format <type>      html | png | both (default: both)
  --api-key <key>      API-ключ (override для STITCH_API_KEY)
```

---

## 6. Архитектура скилла
```
stitch-design-skill/
├── src/
│   ├── index.ts              # Точка входа CLI
│   ├── commands/
│   │   ├── generate.ts       # UC-1
│   │   ├── edit.ts           # UC-2
│   │   ├── variants.ts       # UC-3
│   │   ├── extract-theme.ts  # UC-4
│   │   ├── batch.ts          # UC-5
│   │   ├── upload.ts         # UC-6
│   │   └── design-system.ts  # UC-7
│   ├── core/
│   │   ├── client.ts         # Обёртка над StitchToolClient
│   │   ├── downloader.ts     # Скачивание HTML/PNG по URL
│   │   ├── theme-parser.ts   # Парсинг Tailwind/Fonts/Icons из HTML
│   │   └── project-manager.ts # Управление проектами (кэш, выбор)
│   └── config/
│       └── env.ts            # Загрузка STITCH_API_KEY, настроек
├── SKILL.md                  # Описание скилла для AI-агентов
├── package.json
└── tsconfig.json
```

---

## 7. Конфигурация MCP для Claude Code

Для интеграции с Claude Code скилл регистрирует Stitch как remote MCP server:
```json
// .claude/settings.json
{
  "mcpServers": {
    "stitch": {
      "type": "streamable-http",
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "x-api-key": "${STITCH_API_KEY}"
      }
    }
  }
}
```

Все 14 инструментов Stitch становятся доступны Claude Code как MCP-tools.

---

## 8. Нефункциональные требования

- Timeout: 300 секунд на запрос генерации (настраивается)
- Retry: Автоматический retry при RATE_LIMITED и NETWORK_ERROR
- Кэширование: `getHtml()` / `getImage()` используют кэш из ответа генерации
- Логирование: Каждая операция логируется с ID проекта/экрана
- Выходные файлы: HTML — полный документ с inline Tailwind CSS, PNG — скриншот экрана

---

## 9. Ограничения (Beta)

- Google Stitch в статусе Beta, API может измениться
- SDK версии 0.0.3, не является officially supported Google product
- Лицензия: Apache 2.0
- Генерация использует Gemini (GEMINI_3_PRO / GEMINI_3_FLASH)
- HTML-выход — Tailwind CSS only, не поддерживает произвольные CSS-фреймворки нативно