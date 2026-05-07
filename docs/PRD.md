# PRD: Stitch Design Plugin

## Мета

| Поле | Значение |
|------|----------|
| Название | `stitch-design` |
| Тип | Claude Code Plugin |
| Версия | 0.2.0 |
| Статус | Beta |
| Зависимость | Google Stitch API (Beta), `@google/stitch-sdk@0.2.0` |
| Репозиторий | https://github.com/kyzdes/claude-stitch-design |

---

## 1. Проблема

При разработке интерфейсов узкое место — переход от идеи к визуальному прототипу. Дизайнерские инструменты (Figma, Sketch) требуют ручной работы. AI-генераторы (v0, bolt) работают только через веб-интерфейс. Нет способа из рабочего окружения разработчика по текстовому описанию получить готовый HTML-экран, итерировать над ним и встроить результат в кодовую базу.

Google Stitch решает генерацию. Этот плагин решает оркестрацию: связывает Stitch API с рабочим процессом разработчика через Claude Code.

---

## 2. Решение

Claude Code плагин, который подключается к Google Stitch через MCP (stdio proxy) и предоставляет набор скиллов для conversational design flow — от брейншторма идеи до генерации, итерации и экспорта UI-дизайнов.

**Ключевое отличие от CLI-подхода**: Claude Code сам является оркестратором. Вместо отдельных команд (`stitch generate`, `stitch edit`) пользователь ведёт диалог на естественном языке, а скиллы учат Claude правильно использовать 12 MCP-инструментов Stitch (SDK 0.2.0).

---

## 3. Установка

```bash
# Добавить marketplace
claude plugin marketplace add kyzdes/claude-stitch-design

# Установить плагин
claude plugin install stitch-design

# Настроить API key (через скилл или вручную)
# Вариант 1: /stitch-setup в Claude Code
# Вариант 2: export STITCH_API_KEY="..." в ~/.zshrc
```

После установки — перезапустить Claude Code. MCP сервер подключится автоматически.

---

## 4. Архитектура

```
stitch-design/
├── .claude-plugin/
│   ├── plugin.json              # Метаданные плагина
│   └── marketplace.json         # Marketplace манифест
├── .mcp.json                    # Stitch MCP — stdio proxy
├── skills/
│   ├── stitch-design/SKILL.md   # Главный скилл: брейншторм → генерация → итерация
│   ├── stitch-edit/SKILL.md     # Редактирование экранов
│   └── stitch-theme/SKILL.md    # Извлечение Tailwind/Fonts/Icons
├── commands/
│   ├── stitch-setup.md          # /stitch-setup — настройка API key
│   └── stitch-reset.md          # /stitch-reset — сброс настроек
├── scripts/
│   ├── stitch-proxy.mjs         # MCP stdio proxy (StitchProxy + StdioServerTransport)
│   ├── download.mjs             # Скачивание HTML/PNG (zero-dep)
│   ├── extract-theme.mjs        # Парсинг Tailwind/Fonts/Icons (zero-dep)
│   └── setup-key.mjs            # Сохранение API key в ~/.zshrc
├── package.json                 # @google/stitch-sdk, @modelcontextprotocol/sdk
└── node_modules/                # Закоммичены — zero-setup installation
```

### MCP подключение

Stitch не поддерживает OAuth (Claude Code пытается OAuth для HTTP MCP). Поэтому используется **stdio proxy**: локальный Node.js процесс с `StitchProxy` из SDK, который проксирует все MCP-вызовы к `stitch.googleapis.com/mcp` с API key авторизацией.

```json
// .mcp.json
{
  "stitch": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/stitch-proxy.mjs"],
    "env": { "STITCH_API_KEY": "${STITCH_API_KEY}" }
  }
}
```

---

## 5. Conversational Design Flow

Главный workflow — диалоговый процесс дизайна:

```
Брейншторм → Параметры → Промпт → Генерация → Inline-превью → Итерация
(опционально)                      (fire-and-poll)  (Read PNG)    (edit/variants)
```

### Шаги

1. **Инициализация** — проверка API key, workspace, активного проекта
2. **Брейншторм** (опционально) — проработка идеи через вопросы и референсы
3. **Параметры** — устройство, стиль, модель (PRO/FLASH), кол-во вариантов
4. **Промпт** — Claude составляет оптимальный промпт из контекста диалога
5. **Генерация** — fire-and-poll протокол (обработка ECONNRESET таймаутов)
6. **Результат** — inline-превью в чате + файлы на диске + открытие в браузере
7. **Итерация** — edit, variants, theme extraction, design system

### Рабочие файлы

```
./stitch-design/                  # В каждом проекте
├── design-requirements.md        # ТЗ из брейншторма
├── prompts.md                    # История промптов
├── context-map.md                # Карта: проекты, экраны, связи
├── usage.json                    # Трекер кредитов (400/день)
└── references/                   # Референсы

./stitch-output/                  # Результаты генерации
└── {project-slug}/
    ├── {screen-slug}/
    │   ├── index.html            # Self-contained HTML (Tailwind CSS)
    │   └── preview.png           # Скриншот
    ├── {screen-slug}-edit-1/
    └── {screen-slug}-variant-1/
```

---

## 6. Use Cases

| UC | Описание | Скилл |
|----|----------|-------|
| UC-1 | Генерация экрана по описанию | stitch-design |
| UC-2 | Итеративное редактирование | stitch-edit |
| UC-3 | Генерация вариантов (цвет, лейаут) | stitch-design (Step 5) |
| UC-4 | Извлечение темы (Tailwind, Fonts, Icons) | stitch-theme |
| UC-5 | Дизайн-система (единый стиль) | stitch-design (Step 5) |
| UC-6 | Настройка API key | /stitch-setup |
| UC-7 | Сброс настроек | /stitch-reset |

---

## 7. Known Issues (v0.2)

### ECONNRESET при генерации

`generate_screen_from_text`, `edit_screens`, `generate_variants` могут таймаутить через ~60 сек (ECONNRESET). Это ограничение транспорта stdio proxy, не ошибка Stitch API. Генерация обычно завершается на сервере. Скилл использует fire-and-poll: после таймаута опрашивает `list_screens` чтобы найти результат.

### Лимиты кредитов

- Google AI Pro: 400 ежедневных бонусов + 15 Daily Redesign Credits
- Без подписки: 350 генераций/месяц
- Скилл ведёт локальный трекинг в `usage.json`

---

## 8. Ограничения (Beta)

- Google Stitch в статусе Beta, API может измениться
- SDK версии 0.2.0, не является officially supported Google product
- Лицензия: Apache 2.0
- Генерация: Gemini (GEMINI_3_PRO / GEMINI_3_FLASH)
- HTML-выход: Tailwind CSS only
- MCP через stdio proxy (не HTTP) из-за отсутствия OAuth в Stitch
