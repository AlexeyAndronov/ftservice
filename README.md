# FTServices

Простой шаблон для feature-toggle сервиса.

## Структура проекта

- **ftservice** — backend-сервис (FastAPI + Python 3.12+)
- **ftfrontend** — frontend-приложение (React, Create React App)

## Настройки БД

В БД только одна таблица, она создаётся при помощи скрипта:

```sql
CREATE TABLE IF NOT EXISTS fts (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE
);

-- Индекс для ускорения поиска по title (уже обеспечивается UNIQUE)
CREATE INDEX IF NOT EXISTS idx_fts_title ON fts (title);
```

Для настройки доступа к БД создайте файл `.env`:

```env
DB_NAME=ft_manager
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

## Запуск

### 1. ftservice (backend)

Backend написан на Python с использованием FastAPI и Poetry.

**Требования:**
- Python >= 3.12
- Poetry

**Установка и запуск:**

```bash
cd ftservice
poetry install
poetry run uvicorn ftservice.main:app --reload
```

Сервис запустится на `http://localhost:8000`.

### 2. ftfrontend (frontend)

Frontend — React-приложение, созданное через Create React App.

**Требования:**
- Node.js (версия 16+)
- npm

**Установка и запуск:**

```bash
cd ftfrontend/ft-frontend
npm install
npm start
```

Приложение откроется на `http://localhost:3000`.

## API Endpoints

### Получение состояния FT

**GET** `/getftstate/{ft_title}`

Возвращает текущее состояние для FT по его названию.

#### Параметры пути

| Параметр   | Тип   | Обязательный | Описание              |
|------------|-------|--------------|-----------------------|
| ft_title   | string| ✅ Да         | Название FT (уникально) |

#### Успешный ответ (200 OK)

```json
{
  "state": true
}
```

#### Ошибка (404)

```json
{
  "detail": "FT with title 'NonexistentFT' not found"
}
```

#### Пример запроса

```bash
curl -X GET "http://localhost:8000/getftstate/MyFirstFT" \
  -H "accept: application/json"
```

#### Примечания

- Поиск FT выполняется по точному совпадению названия (регистр учитывается).
- Метод не изменяет состояние, только читает его.