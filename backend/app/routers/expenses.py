from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Annotated
from datetime import date
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.get("/range", response_model=List[schemas.Expense])
async def get_expenses_range(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Expense).where(
            and_(
                models.Expense.user_id == current_user.id,
                models.Expense.date >= start_date,
                models.Expense.date <= end_date
            )
        ).order_by(models.Expense.date.desc())
    )
    return result.scalars().all()

@router.get("/{expense_date}", response_model=List[schemas.Expense])
async def get_expenses(
    expense_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Expense).where(
            and_(
                models.Expense.user_id == current_user.id,
                models.Expense.date == expense_date
            )
        )
    )
    return result.scalars().all()

@router.post("/", response_model=schemas.Expense)
async def create_expense(
    expense_in: schemas.ExpenseCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    db_expense = models.Expense(
        **expense_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_expense)
    await db.commit()
    await db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    import uuid
    try:
        uid = uuid.UUID(expense_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid expense ID")

    result = await db.execute(
        select(models.Expense).where(
            and_(models.Expense.id == uid, models.Expense.user_id == current_user.id)
        )
    )
    db_expense = result.scalar_one_or_none()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    await db.delete(db_expense)
    await db.commit()
    return None

@router.get("/stats/summary", response_model=dict)
async def get_expenses_summary(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    stmt = select(
        models.Expense.category,
        func.sum(models.Expense.amount).label("total")
    ).where(
        and_(
            models.Expense.user_id == current_user.id,
            models.Expense.date >= start_date,
            models.Expense.date <= end_date
        )
    ).group_by(models.Expense.category)
    
    result = await db.execute(stmt)
    summary = {row[0]: row[1] or 0.0 for row in result.all()}
    return summary
