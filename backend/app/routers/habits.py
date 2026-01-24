from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Annotated
from datetime import date
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/habits", tags=["habits"])

@router.get("/", response_model=List[schemas.Habit])
async def get_habits(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Habit).where(models.Habit.user_id == current_user.id)
    )
    return result.scalars().all()

@router.post("/", response_model=schemas.Habit)
async def create_habit(
    habit_in: schemas.HabitCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    db_habit = models.Habit(
        **habit_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_habit)
    await db.commit()
    await db.refresh(db_habit)
    return db_habit

@router.get("/logs/{log_date}", response_model=List[schemas.HabitLog])
async def get_habit_logs(
    log_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.HabitLog).where(
            and_(
                models.HabitLog.user_id == current_user.id,
                models.HabitLog.date == log_date
            )
        )
    )
    return result.scalars().all()

@router.get("/logs/stats/range", response_model=List[schemas.HabitLog])
async def get_habit_logs_range(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.HabitLog).where(
            and_(
                models.HabitLog.user_id == current_user.id,
                models.HabitLog.date >= start_date,
                models.HabitLog.date <= end_date
            )
        )
    )
    return result.scalars().all()

@router.post("/logs", response_model=schemas.HabitLog)
async def toggle_habit_log(
    log_in: schemas.HabitLogCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    # Verify the habit belongs to the user
    habit_result = await db.execute(
        select(models.Habit).where(
            and_(models.Habit.id == log_in.habit_id, models.Habit.user_id == current_user.id)
        )
    )
    if not habit_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Habit not found")

    # Upsert logic for the ledger
    stmt = select(models.HabitLog).where(
        and_(
            models.HabitLog.user_id == current_user.id,
            models.HabitLog.habit_id == log_in.habit_id,
            models.HabitLog.date == log_in.date
        )
    )
    result = await db.execute(stmt)
    db_log = result.scalar_one_or_none()

    if db_log:
        db_log.completed = log_in.completed
    else:
        db_log = models.HabitLog(
            **log_in.model_dump(),
            user_id=current_user.id
        )
        db.add(db_log)
    
    await db.commit()
    await db.refresh(db_log)
    return db_log

@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: str,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    import uuid
    uid = uuid.UUID(habit_id)
    
    result = await db.execute(
        select(models.Habit).where(
            and_(models.Habit.id == uid, models.Habit.user_id == current_user.id)
        )
    )
    db_habit = result.scalar_one_or_none()
    if not db_habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    await db.delete(db_habit)
    await db.commit()
    return None
