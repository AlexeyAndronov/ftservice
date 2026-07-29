# FTServices

Простой шаблон для feature-toggle сервиса.

## Структура проекта

- **ftservice** — backend-сервис (FastAPI + Python 3.12+)
- **ftfrontend** — frontend-приложение (React, Create React App)

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
