from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
async def update_user_profile(
    user_update: schemas.UserUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_update.username is not None and user_update.username != current_user.username:
        # Check uniqueness
        result = await db.execute(select(models.User).where(models.User.username == user_update.username))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = user_update.username

    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.ai_personality is not None:
        current_user.ai_personality = user_update.ai_personality
        
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/export_data")
async def export_user_data(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Fetch all data related to user
    # Habits
    habits_res = await db.execute(select(models.Habit).where(models.Habit.user_id == current_user.id))
    habits = habits_res.scalars().all()
    
    # Projects
    projects_res = await db.execute(select(models.Project).where(models.Project.user_id == current_user.id))
    projects = projects_res.scalars().all()
    
    # Expenses
    expenses_res = await db.execute(select(models.Expense).where(models.Expense.user_id == current_user.id))
    expenses = expenses_res.scalars().all()
    
    # Daily Notes
    notes_res = await db.execute(select(models.DailyNote).where(models.DailyNote.user_id == current_user.id))
    notes = notes_res.scalars().all()

    return {
        "user_info": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "joined": current_user.created_at
        },
        "habits": habits,
        "projects": projects,
        "expenses": expenses,
        "daily_notes": notes
    }
