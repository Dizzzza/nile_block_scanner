# TRON Wallet Monitor

Node.js сервис для мониторинга кошельков TRON с поддержкой TRX, TRC10 и TRC20 токенов.

## Возможности

- 🔍 **Мониторинг кошельков** - добавление/удаление адресов для отслеживания
- 📊 **Отслеживание балансов** - автоматическое обновление балансов TRX, TRC10, TRC20
- 🔄 **Сканирование блоков** - постоянное сканирование новых блоков через TronGrid API
- 💾 **База данных** - сохранение транзакций и балансов в PostgreSQL
- 🌐 **HTTP API** - RESTful API для управления мониторингом
- ⚙️ **Мультисетевость** - автоматический выбор таблицы блоков по NETWORK_ID

## Конфигурация сетей

Система автоматически определяет таблицу для хранения отсканированных блоков на основе:
- `NETWORK_ID` из .env файла
- Поля `scanner_table_name` из таблицы `networks`

### Поддерживаемые сети:

| Network ID | Название | Scanner Table | TronGrid URL |
|------------|----------|---------------|--------------|
| 1 | TRON Mainnet | scanned_blocks | https://api.trongrid.io |
| 2 | TRON Nile Testnet | nile_scanned_blocks | https://nile.trongrid.io |

## Установка

### Через Docker Compose (рекомендуется)

1. Клонируйте репозиторий:
\`\`\`bash
git clone <repository-url>
cd tron-wallet-monitor
\`\`\`

2. Настройте переменные окружения:
\`\`\`bash
cp .env.example .env
# Отредактируйте .env файл, установите NETWORK_ID
\`\`\`

3. Запустите сервисы:
\`\`\`bash
docker-compose up -d
\`\`\`

### Ручная установка

1. Установите зависимости:
\`\`\`bash
npm install
\`\`\`

2. Настройте PostgreSQL и создайте базу данных:
\`\`\`bash
createdb tron_monitor
psql -d tron_monitor -f scripts/create_tables.sql
psql -d tron_monitor -f scripts/seed_data.sql
\`\`\`

3. Настройте переменные окружения:
\`\`\`bash
cp .env.example .env
# Отредактируйте .env файл, установите NETWORK_ID
\`\`\`

4. Запустите сервис:
\`\`\`bash
npm start
\`\`\`

## Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | URL подключения к PostgreSQL | postgresql://user:pass@localhost:5432/db |
| `NETWORK_ID` | ID сети из таблицы networks | 1 (mainnet), 2 (nile) |
| `TRONGRID_API_URL` | URL TronGrid API | https://api.trongrid.io |
| `TRONGRID_API_KEY` | API ключ TronGrid | your_api_key |
| `SCAN_INTERVAL` | Интервал сканирования (мс) | 3000 |
| `BATCH_SIZE` | Размер батча блоков | 10 |
| `START_BLOCK` | Начальный блок | 0 |

## API Endpoints

### Системные endpoints

#### Статус сервиса
\`\`\`http
GET /api/status
\`\`\`

Возвращает:
- Информацию о сети
- Статус сканера
- Последний отсканированный блок
- Название таблицы блоков

#### Информация о сети
\`\`\`http
GET /api/status/network
\`\`\`

### Управление кошельками

#### Добавить кошелек в мониторинг
\`\`\`http
POST /api/wallet/monitor
Content-Type: application/json

{
  "address": "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH"
}
\`\`\`

#### Удалить кошелек из мониторинга
\`\`\`http
DELETE /api/wallet/monitor/TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH
\`\`\`

## Архитектура

\`\`\`
src/
├── config/           # Конфигурация
├── database/         # Подключение к БД
├── models/           # Модели данных
│   ├── Network.js           # Модель сетей
│   ├── ScannedBlocks.js     # Фабрика динамических моделей блоков
│   └── ...
├── services/         # Бизнес-логика
│   ├── NetworkService.js    # Управление сетями
│   ├── BlockScanner.js      # Сканирование блоков
│   └── ...
└── server.js         # Главный файл
\`\`\`

## Мультисетевая архитектура

Система поддерживает работу с несколькими сетями TRON:

1. **Динамические таблицы блоков** - каждая сеть использует свою таблицу
2. **Автоматический выбор** - таблица выбирается по NETWORK_ID
3. **Изоляция данных** - блоки разных сетей не пересекаются

### Добавление новой сети:

1. Добавить запись в таблицу `networks`
2. Создать таблицу для блоков (например, `shasta_scanned_blocks`)
3. Установить `NETWORK_ID` в .env
4. Запустить сервис

## Запуск для разных сетей

### Mainnet:
\`\`\`bash
NETWORK_ID=1 TRONGRID_API_URL=https://api.trongrid.io npm start
\`\`\`

### Nile Testnet:
\`\`\`bash
NETWORK_ID=2 TRONGRID_API_URL=https://nile.trongrid.io npm start
\`\`\`

## Мониторинг

Endpoint `/api/status` показывает:
- Активную сеть и её параметры
- Используемую таблицу блоков
- Прогресс сканирования
- Количество отслеживаемых адресов
