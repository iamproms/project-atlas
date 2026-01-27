from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from typing import List, Annotated, Optional
from datetime import date, datetime, timedelta
from .. import models, schemas, database
from ..auth import get_current_user
import uuid

router = APIRouter(prefix="/finance", tags=["finance"])

# --- Categories ---

@router.get("/categories", response_model=List[schemas.FinancialCategory])
async def get_categories(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None,
    type: Optional[str] = None
):
    stmt = select(models.FinancialCategory).where(
        models.FinancialCategory.user_id == current_user.id,
        models.FinancialCategory.is_active == True
    )
    if type:
        stmt = stmt.where(models.FinancialCategory.type == type)
    
    result = await db.execute(stmt)
    categories = result.scalars().all()
    
    # Defaults if none exist
    if not categories and not type:
        defaults = [
            ("Food", "EXPENSE", "🍴"), ("Transport", "EXPENSE", "🚗"),
            ("Home", "EXPENSE", "🏠"), ("Bills", "EXPENSE", "💳"),
            ("Salary", "INCOME", "💰"), ("Freelance", "INCOME", "💻"),
            ("Misc", "EXPENSE", "✨")
        ]
        for name, cat_type, icon in defaults:
            db.add(models.FinancialCategory(user_id=current_user.id, name=name, type=cat_type, icon=icon))
        await db.commit()
        result = await db.execute(select(models.FinancialCategory).where(models.FinancialCategory.user_id == current_user.id))
        categories = result.scalars().all()
        
    return categories

@router.post("/categories", response_model=schemas.FinancialCategory)
async def create_category(
    cat_in: schemas.FinancialCategoryCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    db_cat = models.FinancialCategory(**cat_in.model_dump(), user_id=current_user.id)
    db.add(db_cat)
    await db.commit()
    await db.refresh(db_cat)
    return db_cat

# --- Accounts ---

@router.get("/accounts", response_model=List[schemas.Account])
async def get_accounts(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Account).where(
            models.Account.user_id == current_user.id,
            models.Account.is_active == True
        )
    )
    accounts = result.scalars().all()
    
    if not accounts:
        cash_account = models.Account(
            user_id=current_user.id, name="Cash", type="CASH", balance_cents=0, is_default=True
        )
        db.add(cash_account)
        await db.commit()
        await db.refresh(cash_account)
        return [cash_account]
        
    return accounts

@router.post("/accounts", response_model=schemas.Account)
async def create_account(
    account_in: schemas.AccountCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    db_account = models.Account(**account_in.model_dump(), user_id=current_user.id)
    db.add(db_account)
    await db.commit()
    await db.refresh(db_account)
    return db_account

@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_account(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Account).where(and_(models.Account.id == account_id, models.Account.user_id == current_user.id))
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Check for active ledger entries
    tx_check = await db.execute(
        select(models.LedgerEntry).where(
            and_(models.LedgerEntry.account_id == account_id, models.LedgerEntry.deleted_at == None)
        )
    )
    if tx_check.first():
         raise HTTPException(status_code=400, detail="Cannot delete account with active transactions. Delete or Archive transactions first.")

    account.is_active = False # Soft delete/archive
    await db.commit()
    return None

# --- Ledger Entries ---

@router.post("/ledger", response_model=schemas.LedgerEntry)
async def create_ledger_entry(
    entry_in: schemas.LedgerEntryCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    # Verify account
    acc_res = await db.execute(select(models.Account).where(models.Account.id == entry_in.account_id))
    account = acc_res.scalar_one_or_none()
    if not account or account.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Account not found")

    # Handle Balance
    if entry_in.type == "INCOME":
        account.balance_cents += entry_in.amount_cents
    elif entry_in.type == "EXPENSE":
        account.balance_cents -= entry_in.amount_cents
    elif entry_in.type == "TRANSFER":
        if not entry_in.to_account_id:
            raise HTTPException(status_code=400, detail="to_account_id required for transfers")
        to_acc_res = await db.execute(select(models.Account).where(models.Account.id == entry_in.to_account_id))
        to_account = to_acc_res.scalar_one_or_none()
        if not to_account or to_account.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Target account not found")
        account.balance_cents -= entry_in.amount_cents
        to_account.balance_cents += entry_in.amount_cents

    db_entry = models.LedgerEntry(**entry_in.model_dump(), user_id=current_user.id)
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@router.get("/ledger", response_model=List[schemas.LedgerEntry])
async def get_ledger(
    date: Optional[date] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    stmt = select(models.LedgerEntry).where(
        models.LedgerEntry.user_id == current_user.id,
        models.LedgerEntry.deleted_at == None
    )
    if date:
        stmt = stmt.where(models.LedgerEntry.date == date)
    elif month and year:
        # Filter by month/year
        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
        stmt = stmt.where(and_(models.LedgerEntry.date >= start_date, models.LedgerEntry.date <= end_date))
    
    result = await db.execute(stmt.order_by(desc(models.LedgerEntry.date), desc(models.LedgerEntry.created_at)))
    return result.scalars().all()

@router.delete("/ledger/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ledger_entry(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.LedgerEntry).where(and_(models.LedgerEntry.id == entry_id, models.LedgerEntry.user_id == current_user.id))
    )
    entry = result.scalar_one_or_none()
    if not entry or entry.deleted_at:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Reverse balance
    acc_res = await db.execute(select(models.Account).where(models.Account.id == entry.account_id))
    account = acc_res.scalar_one_or_none()
    if account:
        if entry.type == "INCOME":
            account.balance_cents -= entry.amount_cents
        elif entry.type == "EXPENSE":
            account.balance_cents += entry.amount_cents
        elif entry.type == "TRANSFER":
            account.balance_cents += entry.amount_cents
            if entry.to_account_id:
                to_acc_res = await db.execute(select(models.Account).where(models.Account.id == entry.to_account_id))
                to_account = to_acc_res.scalar_one_or_none()
                if to_account:
                    to_account.balance_cents -= entry.amount_cents

    entry.deleted_at = datetime.utcnow()
    await db.commit()
    return None

@router.get("/summary", response_model=dict)
async def get_finance_summary(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    today = date.today()
    month_start = date(today.year, today.month, 1)
    
    # Basic monthly aggregations
    async def get_total(entry_type: str):
        stmt = select(func.sum(models.LedgerEntry.amount_cents)).where(
            and_(
                models.LedgerEntry.user_id == current_user.id,
                models.LedgerEntry.type == entry_type,
                models.LedgerEntry.date >= month_start,
                models.LedgerEntry.deleted_at == None
            )
        )
        res = await db.execute(stmt)
        return res.scalar() or 0

    income = await get_total("INCOME")
    expenses = await get_total("EXPENSE")
    
    # Net worth
    acc_res = await db.execute(select(func.sum(models.Account.balance_cents)).where(
        and_(models.Account.user_id == current_user.id, models.Account.is_active == True)
    ))
    net_worth = acc_res.scalar() or 0

    return {
        "this_month": {"income": income, "expenses": expenses, "net": income - expenses},
        "net_worth": net_worth
    }
