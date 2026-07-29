from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid

app = FastAPI(title="FT Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных
class FT(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    completed: bool = False
    enabled: bool = True          # новое поле

class FTCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    completed: bool = False
    enabled: bool = True          # по умолчанию включена

class FTUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    enabled: Optional[bool] = None   # добавили возможность обновления

class FTState(BaseModel):
    state: bool

# Хранилище
ft_db: List[FT] = []

# ----- Базовые CRUD -----

@app.get("/ftlist", response_model=List[FT])
async def get_ft_list():
    return ft_db

@app.post("/addft", response_model=FT)
async def add_new_ft(ft: FTCreate):
    new_ft = FT(
        id=str(uuid.uuid4()),
        title=ft.title,
        description=ft.description,
        completed=ft.completed,
        enabled=ft.enabled
    )
    ft_db.append(new_ft)
    return new_ft

@app.put("/editft/{ft_id}", response_model=FT)
async def edit_ft(ft_id: str, ft_update: FTUpdate):
    for idx, existing in enumerate(ft_db):
        if existing.id == ft_id:
            if ft_update.title is not None:
                existing.title = ft_update.title
            if ft_update.description is not None:
                existing.description = ft_update.description
            if ft_update.completed is not None:
                existing.completed = ft_update.completed
            if ft_update.enabled is not None:
                existing.enabled = ft_update.enabled
            ft_db[idx] = existing
            return existing
    raise HTTPException(status_code=404, detail="FT not found")

@app.delete("/deleteft/{ft_id}")
async def delete_ft(ft_id: str):
    for idx, existing in enumerate(ft_db):
        if existing.id == ft_id:
            del ft_db[idx]
            return {"message": "FT deleted successfully"}
    raise HTTPException(status_code=404, detail="FT not found")

# ----- НОВЫЕ МЕТОДЫ: управление состоянием включения -----

@app.post("/setft/{ft_title}")
async def set_ft_state(ft_title: str, state: FTState):
    """
    Устанавливает состояние enabled для FT с указанным названием (title).
    В теле запроса передаётся JSON: {"state": true/false}
    """
    for ft in ft_db:
        if ft.title == ft_title:
            ft.enabled = state.state
            return {"message": f"FT '{ft_title}' state set to {state.state}"}
    raise HTTPException(status_code=404, detail=f"FT with title '{ft_title}' not found")

@app.get("/getftstate/{ft_title}")
async def get_ft_state(ft_title: str):
    """
    Возвращает текущее состояние enabled для FT по названию.
    Ответ: {"state": true/false}
    """
    for ft in ft_db:
        if ft.title == ft_title:
            return {"state": ft.enabled}
    raise HTTPException(status_code=404, detail=f"FT with title '{ft_title}' not found")