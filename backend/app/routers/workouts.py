from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from typing import List, Annotated, Optional
from datetime import date
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])

@router.get("/{workout_date}", response_model=List[schemas.Workout])
async def get_workouts(
    workout_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Workout)
        .options(selectinload(models.Workout.sets))
        .where(
            and_(
                models.Workout.user_id == current_user.id,
                models.Workout.date == workout_date
            )
        )
        .order_by(desc(models.Workout.created_at))
    )
    return result.scalars().all()

@router.get("/stats/range", response_model=List[schemas.Workout])
async def get_workouts_range(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Workout)
        .options(selectinload(models.Workout.sets))
        .where(
            and_(
                models.Workout.user_id == current_user.id,
                models.Workout.date >= start_date,
                models.Workout.date <= end_date
            )
        )
        .order_by(models.Workout.date.desc(), models.Workout.created_at.desc())
    )
    return result.scalars().all()

@router.get("/stats/heatmap")
async def get_workout_heatmap(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    from sqlalchemy import func
    # Count workouts per day
    result = await db.execute(
        select(models.Workout.date, func.count(models.Workout.id))
        .where(models.Workout.user_id == current_user.id)
        .group_by(models.Workout.date)
    )
    return [{"date": row[0], "count": row[1]} for row in result.all()]

@router.get("/stats/prs")
async def get_personal_records(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    from sqlalchemy import func
    # Get max weight per exercise
    stmt = (
        select(
            models.ExerciseSet.exercise_name,
            func.max(models.ExerciseSet.weight).label("max_weight")
        )
        .join(models.Workout)
        .where(models.Workout.user_id == current_user.id)
        .group_by(models.ExerciseSet.exercise_name)
        .order_by(func.max(models.ExerciseSet.weight).desc())
        .limit(10) # Top 10 exercises by weight
    )
    result = await db.execute(stmt)
    return [{"exercise": row[0], "weight": row[1]} for row in result.all()]

@router.post("/", response_model=schemas.Workout)
async def create_workout(
    workout_in: schemas.WorkoutCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    # 1. Create Workout
    db_workout = models.Workout(
        date=workout_in.date,
        type=workout_in.type,
        notes=workout_in.notes,
        user_id=current_user.id
    )
    db.add(db_workout)
    await db.flush() # Get the ID

    # 2. Create Exercise Sets
    for s in workout_in.sets:
        db_set = models.ExerciseSet(
            **s.model_dump(),
            workout_id=db_workout.id
        )
        db.add(db_set)
    
    await db.commit()
    
    # Re-fetch with sets loaded to avoid ResponseValidationError
    stmt = (
        select(models.Workout)
        .options(selectinload(models.Workout.sets))
        .where(models.Workout.id == db_workout.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/exercises/last/{exercise_name}", response_model=Optional[schemas.ExerciseSet])
async def get_last_exercise_set(
    exercise_name: str,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    # Find the most recent set for this exercise for this user
    stmt = (
        select(models.ExerciseSet)
        .join(models.Workout)
        .where(
            and_(
                models.Workout.user_id == current_user.id,
                models.ExerciseSet.exercise_name == exercise_name
            )
        )
        .order_by(desc(models.Workout.date), desc(models.ExerciseSet.created_at))
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    workout_id: str,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    import uuid
    uid = uuid.UUID(workout_id)
    
    result = await db.execute(
        select(models.Workout).where(
            and_(models.Workout.id == uid, models.Workout.user_id == current_user.id)
        )
    )
    db_workout = result.scalar_one_or_none()
    if not db_workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    await db.delete(db_workout)
    await db.commit()
    return None
