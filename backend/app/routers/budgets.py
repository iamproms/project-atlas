from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Annotated
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["budgets"])

@router.get("/", response_model=List[schemas.Budget])
async def get_budgets(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Budget).where(models.Budget.user_id == current_user.id)
    )
    return result.scalars().all()

@router.post("/", response_model=schemas.Budget)
async def create_or_update_budget(
    budget_in: schemas.BudgetCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    # Upsert logic
    stmt = select(models.Budget).where(
        and_(
            models.Budget.user_id == current_user.id,
            models.Budget.category == budget_in.category,
            models.Budget.period == budget_in.period
        )
    )
    result = await db.execute(stmt)
    db_budget = result.scalar_one_or_none()

    if db_budget:
        db_budget.amount = budget_in.amount
    else:
        db_budget = models.Budget(
            **budget_in.model_dump(),
            user_id=current_user.id
        )
        db.add(db_budget)
    
    await db.commit()
    await db.refresh(db_budget)
    return db_budget
