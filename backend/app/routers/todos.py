from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
from typing import List, Annotated
from datetime import date
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/todos", tags=["todos"])

@router.get("/{todo_date}", response_model=List[schemas.Todo])
async def get_todos(
    todo_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Todo).where(
            and_(
                models.Todo.user_id == current_user.id,
                models.Todo.date == todo_date
            )
        )
    )
    return result.scalars().all()

@router.post("/", response_model=schemas.Todo)
async def create_todo(
    todo_in: schemas.TodoCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    db_todo = models.Todo(
        **todo_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_todo)
    await db.commit()
    await db.refresh(db_todo)
    return db_todo

@router.patch("/{todo_id}", response_model=schemas.Todo)
async def update_todo(
    todo_id: str,
    todo_update: schemas.TodoUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    import uuid
    uid = uuid.UUID(todo_id)
    
    result = await db.execute(
        select(models.Todo).where(
            and_(models.Todo.id == uid, models.Todo.user_id == current_user.id)
        )
    )
    db_todo = result.scalar_one_or_none()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    update_data = todo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)

    await db.commit()
    await db.refresh(db_todo)
    return db_todo

@router.post("/carry-over/{target_date}", response_model=List[schemas.Todo])
async def carry_over_todos(
    target_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    # Find all uncompleted todos before target_date
    stmt = select(models.Todo).where(
        and_(
            models.Todo.user_id == current_user.id,
            models.Todo.date < target_date,
            models.Todo.is_completed == False
        )
    )
    result = await db.execute(stmt)
    pending_todos = result.scalars().all()

    carried_todos = []
    for todo in pending_todos:
        # Update existing todo to mark it was carried over (optional, or just move it)
        todo.is_carried_over = True
        todo.date = target_date
        carried_todos.append(todo)

    await db.commit()
    # Refreshing all might be expensive, but needed for return
    for todo in carried_todos:
        await db.refresh(todo)
        
    return carried_todos

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: str,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    import uuid
    uid = uuid.UUID(todo_id)
    
    result = await db.execute(
        select(models.Todo).where(
            and_(models.Todo.id == uid, models.Todo.user_id == current_user.id)
        )
    )
    db_todo = result.scalar_one_or_none()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    await db.delete(db_todo)
    await db.commit()
    return None
