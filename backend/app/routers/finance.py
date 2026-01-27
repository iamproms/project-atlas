from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from typing import List, Annotated, Optional
from datetime import date, timedelta
from .. import models, schemas, database
from ..auth import get_current_user
import uuid

router = APIRouter(prefix="/finance", tags=["finance"])

# Accounts
@router.get("/accounts", response_model=List[schemas.Account])
async def get_accounts(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Account).where(models.Account.user_id == current_user.id)
    )
    accounts = result.scalars().all()
    
    # If no accounts, create a default "Cash" account
    if not accounts:
        cash_account = models.Account(
            user_id=current_user.id,
            name="Cash",
            type="CASH",
            balance=0.0,
            is_default=True
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
    db_account = models.Account(
        **account_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_account)
    await db.commit()
    await db.refresh(db_account)
    return db_account

@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
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
    
    # Check if it has transactions
    tx_check = await db.execute(select(models.Transaction).where(models.Transaction.account_id == account_id))
    if tx_check.first():
         raise HTTPException(status_code=400, detail="Cannot delete account with existing transactions. Delete transactions first.")

    await db.delete(account)
    await db.commit()
    return None

@router.get("/categories", response_model=List[str])
async def get_categories():
    return ["Food", "Transport", "Home", "Lifestyle", "Bills", "Shopping", "Misc", "Health", "Gift", "Education", "Travel"]

# Transactions
@router.post("/transactions", response_model=schemas.Transaction)
async def create_transaction(
    tx_in: schemas.TransactionCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    # Verify account ownership
    acc_result = await db.execute(
        select(models.Account).where(and_(models.Account.id == tx_in.account_id, models.Account.user_id == current_user.id))
    )
    account = acc_result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Handle balance update
    if tx_in.type == "INCOME":
        account.balance += tx_in.amount
    elif tx_in.type == "EXPENSE":
        account.balance -= tx_in.amount
    elif tx_in.type == "TRANSFER":
        if not tx_in.to_account_id:
            raise HTTPException(status_code=400, detail="to_account_id required for transfers")
        
        to_acc_result = await db.execute(
            select(models.Account).where(and_(models.Account.id == tx_in.to_account_id, models.Account.user_id == current_user.id))
        )
        to_account = to_acc_result.scalar_one_or_none()
        if not to_account:
            raise HTTPException(status_code=404, detail="Target account not found")
        
        account.balance -= tx_in.amount
        to_account.balance += tx_in.amount

    db_tx = models.Transaction(
        **tx_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_tx)
    await db.commit()
    await db.refresh(db_tx)
    return db_tx

@router.get("/transactions/{target_date}", response_model=List[schemas.Transaction])
async def get_daily_transactions(
    target_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Transaction).where(
            and_(
                models.Transaction.user_id == current_user.id,
                models.Transaction.date == target_date
            )
        ).order_by(desc(models.Transaction.created_at))
    )
    return result.scalars().all()

@router.get("/summary", response_model=dict)
async def get_finance_summary(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_last_week = start_of_week - timedelta(days=7)
    
    # helper for range sum
    async def get_range_total(start: date, end: date, tx_type: str):
        stmt = select(func.sum(models.Transaction.amount)).where(
            and_(
                models.Transaction.user_id == current_user.id,
                models.Transaction.type == tx_type,
                models.Transaction.date >= start,
                models.Transaction.date <= end
            )
        )
        res = await db.execute(stmt)
        return res.scalar() or 0.0

    this_week_expense = await get_range_total(start_of_week, today, "EXPENSE")
    last_week_expense = await get_range_total(start_of_last_week, start_of_week - timedelta(days=1), "EXPENSE")
    
    this_week_income = await get_range_total(start_of_week, today, "INCOME")
    last_week_income = await get_range_total(start_of_last_week, start_of_week - timedelta(days=1), "INCOME")

    # Categories
    stmt_cat = select(
        models.Transaction.category,
        func.sum(models.Transaction.amount)
    ).where(
        and_(
            models.Transaction.user_id == current_user.id,
            models.Transaction.type == "EXPENSE",
            models.Transaction.date >= (today - timedelta(days=30))
        )
    ).group_by(models.Transaction.category)
    cat_res = await db.execute(stmt_cat)
    categories = {row[0]: row[1] for row in cat_res.all()}

    return {
        "this_week": {"expense": this_week_expense, "income": this_week_income},
        "last_week": {"expense": last_week_expense, "income": last_week_income},
        "categories_30d": categories,
        "net_worth": sum([a.balance for a in (await db.execute(select(models.Account).where(models.Account.user_id == current_user.id))).scalars().all()])
    }

@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Transaction).where(
            and_(models.Transaction.id == transaction_id, models.Transaction.user_id == current_user.id)
        )
    )
    db_tx = result.scalar_one_or_none()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Reverse balance update
    acc_result = await db.execute(select(models.Account).where(models.Account.id == db_tx.account_id))
    account = acc_result.scalar_one_or_none()
    if account:
        if db_tx.type == "INCOME":
            account.balance -= db_tx.amount
        elif db_tx.type == "EXPENSE":
            account.balance += db_tx.amount
        elif db_tx.type == "TRANSFER":
            account.balance += db_tx.amount
            if db_tx.to_account_id:
                to_acc_result = await db.execute(select(models.Account).where(models.Account.id == db_tx.to_account_id))
                to_account = to_acc_result.scalar_one_or_none()
                if to_account:
                    to_account.balance -= db_tx.amount

    await db.delete(db_tx)
    await db.commit()
    return None

@router.get("/export/csv")
async def export_finance_csv(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    from fastapi.responses import StreamingResponse
    import io
    import csv

    result = await db.execute(
        select(models.Transaction).where(models.Transaction.user_id == current_user.id).order_by(desc(models.Transaction.date))
    )
    transactions = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Category", "Amount", "Description", "Currency"])
    
    for tx in transactions:
        writer.writerow([tx.date, tx.type, tx.category, tx.amount, tx.description, tx.currency])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=atlas_finance_{date.today()}.csv"}
    )
