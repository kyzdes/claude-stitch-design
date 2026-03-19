# API Specs: Google Stitch

> Полная спецификация Google Stitch API для использования при разработке скилла.
> Источники: официальная документация, npm package, GitHub репозиторий, agent skills.

---

## 1. Обзор

Google Stitch — AI-сервис генерации UI-дизайнов. Принимает текстовый промпт, возвращает полноценный HTML-экран с Tailwind CSS и PNG-скриншот. Работает через Model Context Protocol (MCP) — удалённый сервер в облаке Google.

| Параметр | Значение |
|----------|----------|
| MCP Endpoint | `https://stitch.googleapis.com/mcp` |
| Протокол | Streamable HTTP (MCP over HTTP) |
| SDK пакет | `@google/stitch-sdk` |
| SDK версия | `0.0.3` |
| npm | https://www.npmjs.com/package/@google/stitch-sdk |
| GitHub | https://github.com/google-labs-code/stitch-sdk |
| Документация | https://stitch.withgoogle.com/docs |
| Лицензия | Apache 2.0 |
| Статус | Beta |

---

## 2. Аутентификация

### 2.1. API Key (рекомендуется)

Создаётся на странице настроек Stitch: https://stitch.withgoogle.com/settings
```bash
export STITCH_API_KEY="your-api-key"
```

Используется во всех клиентах: SDK, MCP, Claude Code, Cursor и т.д.

### 2.2. OAuth

Для окружений без постоянного хранения ключей.
```bash
export STITCH_ACCESS_TOKEN="ya29...."
export GOOGLE_CLOUD_PROJECT="my-gcp-project-id"
```

Требуется: Google Cloud SDK (`gcloud`), настроенный GCP-проект с разрешениями.

При OAuth оба поля обязательны: `accessToken` + `projectId`.

### 2.3. Переменные окружения

| Переменная | Обязательна | Описание |
|-----------|-------------|----------|
| `STITCH_API_KEY` | Да (или OAuth) | API-ключ аутентификации |
| `STITCH_ACCESS_TOKEN` | Нет | OAuth access token (альтернатива API key) |
| `GOOGLE_CLOUD_PROJECT` | С OAuth | ID проекта Google Cloud |
| `STITCH_HOST` | Нет | Override URL MCP-сервера |

---

## 3. Установка SDK
```bash
# Core SDK
npm install @google/stitch-sdk

# Bun
bun add @google/stitch-sdk

# С поддержкой Vercel AI SDK
npm install @google/stitch-sdk ai @ai-sdk/google
```

Требования: Node.js 20+, или Bun.

---

## 4. MCP Tools — полный список (14 инструментов)

Все инструменты доступны через MCP-сервер и SDK.

### 4.1. Project Management

| # | Tool | Описание | Read-Only |
|---|------|----------|-----------|
| 1 | `create_project` | Создать новый проект | Нет |
| 2 | `get_project` | Получить проект по ID | Да |
| 3 | `delete_project` | Удалить проект | Нет |
| 4 | `list_projects` | Список всех доступных проектов | Да |

### 4.2. Screen Management

| # | Tool | Описание | Read-Only |
|---|------|----------|-----------|
| 5 | `list_screens` | Список экранов в проекте | Да |
| 6 | `get_screen` | Получить экран по ID | Да |

### 4.3. AI Generation

| # | Tool | Описание | Read-Only |
|---|------|----------|-----------|
| 7 | `generate_screen_from_text` | Генерация экрана из текстового промпта | Нет |
| 8 | `upload_screens_from_images` | Создание экрана из загруженного изображения | Нет |
| 9 | `edit_screens` | Итеративное редактирование экрана по промпту | Нет |
| 10 | `generate_variants` | Генерация вариантов существующего экрана | Нет |

### 4.4. Design Systems

| # | Tool | Описание | Read-Only |
|---|------|----------|-----------|
| 11 | `create_design_system` | Создать дизайн-систему | Нет |
| 12 | `update_design_system` | Обновить дизайн-систему | Нет |
| 13 | `list_design_systems` | Список дизайн-систем | Да |
| 14 | `apply_design_system` | Применить дизайн-систему к экранам | Нет |

---

## 5. SDK API Reference

### 5.1. Экспорты из `@google/stitch-sdk`
```typescript
import {
  stitch,              // Синглтон (автоконфигурация из env)
  Stitch,              // Класс (ручная конфигурация)
  StitchToolClient,    // Низкоуровневый MCP-клиент
  StitchProxy,         // MCP-прокси сервер
  StitchError,         // Класс ошибок
} from "@google/stitch-sdk";
```

Дополнительный subpath для AI SDK:
```typescript
import { stitchTools } from "@google/stitch-sdk/ai";
```

### 5.2. `stitch` (Singleton)

Предконфигурированный экземпляр `Stitch`. Читает `STITCH_API_KEY` из окружения. Lazy-инициализация при первом использовании.
```typescript
import { stitch } from "@google/stitch-sdk";
const projects = await stitch.projects();
```

### 5.3. Класс `Stitch`

Корневой класс. Управляет проектами.

| Метод | Параметры | Возвращает | Описание |
|-------|-----------|------------|----------|
| `createProject(title)` | `title: string` | `Promise<Project>` | Создать новый проект |
| `projects()` | — | `Promise<Project[]>` | Список всех проектов |
| `project(id)` | `id: string` | `Project` | Ссылка на проект по ID (без API-вызова) |

Дополнительные infrastructure-методы (через StitchToolClient):

| Метод | Параметры | Возвращает | Описание |
|-------|-----------|------------|----------|
| `listTools()` | — | `Promise<{ tools }>` | Список доступных MCP-инструментов |
| `callTool(name, args)` | `name: string, args: Record<string, any>` | `Promise<T>` | Вызов любого MCP-инструмента по имени |

### 5.4. Класс `Project`

Проект Stitch, содержащий экраны.

**Properties:**

| Свойство | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | Алиас для `projectId` |
| `projectId` | `string` | Bare project ID (без префикса `projects/`) |

**Methods:**

| Метод | Параметры | Возвращает | Описание |
|-------|-----------|------------|----------|
| `generate(prompt, deviceType?)` | `prompt: string`, `deviceType?: DeviceType` | `Promise<Screen>` | Генерация экрана по промпту |
| `screens()` | — | `Promise<Screen[]>` | Список всех экранов |
| `getScreen(screenId)` | `screenId: string` | `Promise<Screen>` | Получить конкретный экран |

### 5.5. Класс `Screen`

Сгенерированный UI-экран. Доступ к HTML и скриншотам.

**Properties:**

| Свойство | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | Алиас для `screenId` |
| `screenId` | `string` | Bare screen ID |
| `projectId` | `string` | ID родительского проекта |

**Methods:**

| Метод | Параметры | Возвращает | Описание |
|-------|-----------|------------|----------|
| `getHtml()` | — | `Promise<string>` | URL для скачивания HTML экрана |
| `getImage()` | — | `Promise<string>` | URL для скачивания PNG-скриншота |
| `edit(prompt, deviceType?, modelId?)` | `prompt: string` | `Promise<Screen>` | Редактирование экрана (возвращает новый Screen, оригинал не меняется) |
| `variants(prompt, options, deviceType?, modelId?)` | `prompt: string`, `options: VariantOptions` | `Promise<Screen[]>` | Генерация вариантов |

**Кэширование:** `getHtml()` и `getImage()` используют кэшированные данные из ответа генерации когда доступны. Если Screen загружен через `screens()` или `getScreen()`, методы автоматически вызывают `get_screen` API.

### 5.6. `StitchToolClient`

Низкоуровневый MCP-клиент для прямого доступа к инструментам.
```typescript
const client = new StitchToolClient({ apiKey: "..." });
const result = await client.callTool("create_project", { title: "Test" });
await client.close();
```

| Метод | Параметры | Возвращает | Описание |
|-------|-----------|------------|----------|
| `callTool<T>(name, args)` | `name: string`, `args: Record<string, any>` | `Promise<T>` | Вызов MCP-инструмента |
| `listTools()` | — | `Promise<{ tools }>` | Список инструментов |
| `connect()` | — | `Promise<void>` | Установить соединение (вызывается автоматически) |
| `close()` | — | `Promise<void>` | Закрыть соединение |

**Конструктор `StitchToolClient`:**

| Опция | Тип | Default | Описание |
|-------|-----|---------|----------|
| `apiKey` | `string` | `STITCH_API_KEY` | API-ключ |
| `accessToken` | `string` | `STITCH_ACCESS_TOKEN` | OAuth-токен |
| `projectId` | `string` | `GOOGLE_CLOUD_PROJECT` | GCP Project ID |
| `baseUrl` | `string` | `https://stitch.googleapis.com/mcp` | URL MCP-сервера |
| `timeout` | `number` | `300000` (5 мин) | Timeout запроса (мс) |

### 5.7. `StitchProxy`

MCP-прокси, пробрасывающий запросы к Stitch. Позволяет выставить Stitch-инструменты через собственный MCP-сервер.
```typescript
import { StitchProxy } from "@google/stitch-sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const proxy = new StitchProxy({ apiKey: "..." });
const transport = new StdioServerTransport();
await proxy.start(transport);
```

### 5.8. `stitchTools()` (AI SDK adapter)

Адаптер для Vercel AI SDK. Импорт из subpath `@google/stitch-sdk/ai`.
```typescript
import { stitchTools } from "@google/stitch-sdk/ai";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const { text } = await generateText({
  model: google("gemini-2.0-flash"),
  tools: stitchTools(),
  prompt: "Create a project called My App and generate a login page",
});
```

Требуемые пакеты: `@google/stitch-sdk`, `ai`, `@ai-sdk/google`
Требуемые ключи: `STITCH_API_KEY` + `GOOGLE_GENERATIVE_AI_API_KEY`

Можно фильтровать tools и переопределять API key через параметры `stitchTools(options?)`.

---

## 6. Enum-типы

### DeviceType
```typescript
"MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC"
```

### ModelId
```typescript
"GEMINI_3_PRO" | "GEMINI_3_FLASH"
```

### VariantOptions
```typescript
{
  variantCount: number;    // 1–5, default: 3
  creativeRange: string;   // "REFINE" | "EXPLORE" | "REIMAGINE"
  aspects: string[];       // "LAYOUT" | "COLOR_SCHEME" | "IMAGES" | "TEXT_FONT" | "TEXT_CONTENT"
}
```

### ScreenType Enum

Тип экрана (из MCP Reference).

### ColorMode Enum

Цветовая схема.

### Font Enum

Шрифт для дизайна.

### Roundness Enum

Уровень скруглений.

### CreativeRange Enum
```
"REFINE"    — минимальные изменения
"EXPLORE"   — умеренные вариации
"REIMAGINE" — радикально другой подход
```

### VariantAspect Enum
```
"LAYOUT"       — структура/лейаут
"COLOR_SCHEME" — цветовая палитра
"IMAGES"       — изображения
"TEXT_FONT"    — типографика
"TEXT_CONTENT" — текстовое наполнение
```

---

## 7. Shared Types (MCP Reference)

| Тип | Описание |
|-----|----------|
| `Screen` | Объект экрана с метаданными и артефактами |
| `File` | Файл с `downloadUrl` (HTML или изображение) |
| `FileUpload` | Загружаемый файл |
| `DesignSystem` | Дизайн-система проекта |
| `Asset` | Ассет экрана |
| `DesignTheme` | Тема дизайна |
| `ScreenMetadata` | Метаданные экрана |
| `SessionOutputComponent` | Компонент вывода сессии генерации |
| `UserFeedback` | Обратная связь пользователя |
| `VariantOptions` | Параметры генерации вариантов |

---

## 8. Выходные артефакты

Каждый Screen генерирует два артефакта:

### 8.1. HTML-файл

- Полный HTML-документ с inline Tailwind CSS
- Содержит встроенную Tailwind CSS конфигурацию
- Ссылки на Google Fonts
- Ссылки на Material Symbols (иконки)
- Доступен через `screen.getHtml()` — возвращает download URL

### 8.2. PNG-скриншот

- Визуальный скриншот экрана
- Доступен через `screen.getImage()` — возвращает download URL

### 8.3. Извлекаемые данные из HTML

Из HTML можно извлечь:

- **Tailwind config** — CSS-конфигурация для переиспользования
- **Google Fonts** — ссылки на подключённые шрифты
- **Material Symbols** — используемые иконки

Для парсинга в репозитории SDK есть хелпер: `packages/sdk/test/helpers/stitch-html.ts`

---

## 9. Обработка ошибок
```typescript
import { StitchError } from "@google/stitch-sdk";

try {
  await project.screens();
} catch (error) {
  if (error instanceof StitchError) {
    error.code;        // Код ошибки
    error.message;     // Человекочитаемое описание
    error.recoverable; // Можно ли retry
  }
}
```

### Коды ошибок

| Код | Описание | Recoverable |
|-----|----------|-------------|
| `AUTH_FAILED` | Неверный API-ключ или токен | Нет |
| `NOT_FOUND` | Проект/экран не найден | Нет |
| `PERMISSION_DENIED` | Нет доступа к ресурсу | Нет |
| `RATE_LIMITED` | Превышен лимит запросов | Да |
| `NETWORK_ERROR` | Сетевая ошибка | Да |
| `VALIDATION_ERROR` | Ошибка валидации входных данных | Нет |
| `UNKNOWN_ERROR` | Неизвестная ошибка | Нет |

---

## 10. MCP-конфигурация для AI-клиентов

### Claude Code
```json
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

### Cursor

В настройках MCP добавить remote server:
- URL: `https://stitch.googleapis.com/mcp`
- Аутентификация: API Key в заголовке

### VSCode

Аналогично Cursor — через настройки MCP extensions.

### Gemini CLI
```bash
gemini --mcp-server "https://stitch.googleapis.com/mcp" --mcp-header "x-api-key: $STITCH_API_KEY"
```

---

## 11. Ссылки на документацию

| Раздел | URL |
|--------|-----|
| Главная документация | https://stitch.withgoogle.com/docs |
| MCP Setup & Auth | https://stitch.withgoogle.com/docs/mcp/setup |
| MCP Guide (Getting Started) | https://stitch.withgoogle.com/docs/mcp/guide |
| MCP Reference (14 tools) | https://stitch.withgoogle.com/docs/mcp/reference |
| SDK Tutorial | https://stitch.withgoogle.com/docs/sdk/tutorial |
| SDK + Vercel AI SDK | https://stitch.withgoogle.com/docs/sdk/ai-sdk |
| Agent-driven Workflows | https://stitch.withgoogle.com/docs/sdk/agent-workflows |
| How to Edit a Screen | https://stitch.withgoogle.com/docs/sdk/edit-screen |
| How to Generate Variants | https://stitch.withgoogle.com/docs/sdk/generate-variants |
| How to Download Artifacts | https://stitch.withgoogle.com/docs/sdk/download-artifacts |
| How to Extract Themes | https://stitch.withgoogle.com/docs/sdk/extract-themes |
| SDK Reference | https://stitch.withgoogle.com/docs/sdk/reference |
| Architecture | https://stitch.withgoogle.com/docs/sdk/architecture |
| npm | https://www.npmjs.com/package/@google/stitch-sdk |
| GitHub repo | https://github.com/google-labs-code/stitch-sdk |
| Agent Skills (GitHub) | https://github.com/google-labs-code/stitch-sdk/tree/main/.agents/skills |
| Stitch Settings (API Keys) | https://stitch.withgoogle.com/settings |

---

## 12. Архитектура SDK (внутренняя)

SDK — не рукописный REST-клиент. Это сгенерированный domain layer поверх MCP:

**Layer 1: StitchToolClient** (transport) — HTTP-соединение с MCP-сервером `stitch.googleapis.com/mcp`. Методы `callTool()`, `listTools()`.

**Layer 2: Generated domain classes** (domain) — `Stitch`, `Project`, `Screen`. Сгенерированы из `domain-map.json` кодогенератором `generate-sdk.ts`. Каждый метод класса маппится на конкретный MCP-tool.

**Layer 3: stitch singleton** (convenience) — предконфигурированный экземпляр для zero-setup использования.

Один API surface: инструменты доступные через SDK — точно те же инструменты, что использует AI-агент через MCP.

---

## 13. Ключевые файлы в репозитории

| Файл | Путь | Назначение |
|------|------|-----------|
| tools-manifest.json | `packages/sdk/generated/` | Raw MCP tool schemas (inputSchema + outputSchema) |
| domain-map.json | `packages/sdk/generated/` | IR: маппинг tool → class → method |
| tool-definitions.ts | `packages/sdk/generated/src/` | JSON Schema для AI SDK tools |
| tools-adapter.ts | `packages/sdk/src/` | `stitchTools()` — Vercel AI SDK адаптер |
| ir-schema.ts | `scripts/` | Zod-схема валидного IR |
| stitch-html.ts | `packages/sdk/test/helpers/` | Парсер HTML: Tailwind config + font extraction |
| component-validator.ts | `packages/sdk/test/helpers/` | SWC AST валидатор для React-компонентов |
| Agent Skills | `.agents/skills/` | Готовые SKILL.md для AI-агентов |

---

## 14. Краткий cheatsheet для агента
```typescript
// === SETUP ===
// env: STITCH_API_KEY="..."
import { stitch } from "@google/stitch-sdk";

// === СОЗДАТЬ ПРОЕКТ ===
const project = await stitch.createProject("My App");

// === ГЕНЕРАЦИЯ ЭКРАНА ===
const screen = await project.generate("A login page with email and password");

// === ПОЛУЧИТЬ АРТЕФАКТЫ ===
const htmlUrl = await screen.getHtml();   // URL для скачивания HTML
const imageUrl = await screen.getImage(); // URL для скачивания PNG

// === РЕДАКТИРОВАНИЕ ===
const edited = await screen.edit("Make background dark, add sidebar");

// === ВАРИАНТЫ ===
const variants = await screen.variants("Try different color schemes", {
  variantCount: 3,
  creativeRange: "EXPLORE",
  aspects: ["COLOR_SCHEME", "LAYOUT"],
});

// === СПИСОК ПРОЕКТОВ ===
const projects = await stitch.projects();

// === СПИСОК ЭКРАНОВ ===
const screens = await project.screens();

// === НИЗКОУРОВНЕВЫЙ ДОСТУП (для агентов) ===
const tools = await stitch.listTools();
const result = await stitch.callTool("generate_screen_from_text", {
  projectId: "123",
  prompt: "A dashboard",
});

// === AI SDK ===
import { stitchTools } from "@google/stitch-sdk/ai";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const { text } = await generateText({
  model: google("gemini-2.0-flash"),
  tools: stitchTools(),
  prompt: "Create a dashboard project with 3 screens",
});
```