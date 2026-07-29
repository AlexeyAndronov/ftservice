from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid

from peewee import PostgresqlDatabase, Model, CharField, TextField, BooleanField, IntegrityError
from config import config

# ----- Подключение к БД через конфиг -----
database = PostgresqlDatabase(
    config.DB_NAME,
    user=config.DB_USER,
    password=config.DB_PASSWORD,
    host=config.DB_HOST,
    port=config.DB_PORT
)

# ----- Peewee модель -----
class FTModel(Model):
    id = CharField(primary_key=True, max_length=36)
    title = CharField(max_length=255, unique=True, index=True)
    description = TextField(null=True)
    completed = BooleanField(default=False)
    enabled = BooleanField(default=True)

    class Meta:
        database = database
        table_name = 'fts'

# Подключаемся и создаём таблицу, если её нет (на всякий случай)
# Но основное создание делаем через SQL-скрипт.
database.connect()
database.create_tables([FTModel])  # безопасно, если таблица уже существует

# ----- FastAPI приложение -----
app = FastAPI(title="FT Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Pydantic схемы (без изменений) -----
class FT(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    completed: bool = False
    enabled: bool = True

class FTCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    completed: bool = False
    enabled: bool = True

class FTUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    enabled: Optional[bool] = None

class FTState(BaseModel):
    state: bool

# ----- Конвертер -----
def model_to_pydantic(ft: FTModel) -> FT:
    return FT(
        id=ft.id,
        title=ft.title,
        description=ft.description or "",
        completed=ft.completed,
        enabled=ft.enabled
    )

# ----- API endpoints (без изменений) -----
@app.get("/ftlist", response_model=List[FT])
async def get_ft_list():
    fts = FTModel.select().order_by(FTModel.title)
    return [model_to_pydantic(ft) for ft in fts]

@app.post("/addft", response_model=FT)
async def add_new_ft(ft: FTCreate):
    try:
        new_ft = FTModel.create(
            id=str(uuid.uuid4()),
            title=ft.title,
            description=ft.description,
            completed=ft.completed,
            enabled=ft.enabled
        )
        return model_to_pydantic(new_ft)
    except IntegrityError:
        raise HTTPException(status_code=400, detail=f"FT with title '{ft.title}' already exists")

@app.put("/editft/{ft_id}", response_model=FT)
async def edit_ft(ft_id: str, ft_update: FTUpdate):
    try:
        ft = FTModel.get(FTModel.id == ft_id)
    except FTModel.DoesNotExist:
        raise HTTPException(status_code=404, detail="FT not found")

    if ft_update.title is not None and ft_update.title != ft.title:
        existing = FTModel.select().where(FTModel.title == ft_update.title).first()
        if existing and existing.id != ft_id:
            raise HTTPException(status_code=400, detail=f"Title '{ft_update.title}' already in use")
        ft.title = ft_update.title

    if ft_update.description is not None:
        ft.description = ft_update.description
    if ft_update.completed is not None:
        ft.completed = ft_update.completed
    if ft_update.enabled is not None:
        ft.enabled = ft_update.enabled

    ft.save()
    return model_to_pydantic(ft)

@app.delete("/deleteft/{ft_id}")
async def delete_ft(ft_id: str):
    try:
        ft = FTModel.get(FTModel.id == ft_id)
        ft.delete_instance()
        return {"message": "FT deleted successfully"}
    except FTModel.DoesNotExist:
        raise HTTPException(status_code=404, detail="FT not found")

@app.post("/setft/{ft_title}")
async def set_ft_state(ft_title: str, state: FTState):
    try:
        ft = FTModel.get(FTModel.title == ft_title)
        ft.enabled = state.state
        ft.save()
        return {"message": f"FT '{ft_title}' state set to {state.state}"}
    except FTModel.DoesNotExist:
        raise HTTPException(status_code=404, detail=f"FT with title '{ft_title}' not found")

@app.get("/getftstate/{ft_title}")
async def get_ft_state(ft_title: str):
    try:
        ft = FTModel.get(FTModel.title == ft_title)
        return {"state": ft.enabled}
    except FTModel.DoesNotExist:
        raise HTTPException(status_code=404, detail=f"FT with title '{ft_title}' not found")

@app.on_event("shutdown")
def shutdown():
    database.close()