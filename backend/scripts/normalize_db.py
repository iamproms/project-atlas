import asyncio
import sys
import os

# Add the parent directory (backend) to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, text
from app import database, models

async def run_migration():
    """
    Runs one-time migrations and normalizations.
    1. Normalizes email/username to lowercase.
    2. Migrates 'ledger_entries' back to simple Expense/Transaction models.
    """
    async with database.SessionLocal() as db:
        print("🔍 Starting database normalization and migration...")
        
        # 1. Normalize ALL user identifiers (email/username)
        try:
            users_res = await db.execute(select(models.User))
            users = users_res.scalars().all()
            for user in users:
                modified = False
                if user.email and user.email != user.email.lower().strip():
                    user.email = user.email.lower().strip()
                    modified = True
                if user.username and user.username != user.username.lower().strip():
                    user.username = user.username.lower().strip()
                    modified = True
                if modified:
                    db.add(user)
            await db.commit()
            print(f"✅ User normalization complete ({len(users)} users checked).")
        except Exception as e:
            await db.rollback()
            print(f"⚠️ User normalization skipped or failed: {e}")

        # 2. Rollback Migration (V3 -> V2 "Simple")
        try:
            res = await db.execute(text("SELECT count(*) FROM ledger_entries"))
            if res.scalar() > 0:
                print("📦 Rolling back professional LedgerEntry to simple Expense/Transaction...")
                
                # Fetch entries
                ledger_res = await db.execute(text("SELECT user_id, amount_cents, type, description, date, account_id, to_account_id FROM ledger_entries"))
                for row in ledger_res.all():
                    user_id, amt_cents, e_type, desc, e_date, acc_id, to_acc_id = row
                    amount = float(amt_cents) / 100.0
                    
                    if e_type == "EXPENSE":
                        # Add to expenses table
                        db_exp = models.Expense(
                            user_id=user_id, amount=amount, date=e_date, 
                            description=desc, category="Misc" # Defaulting back to simple string
                        )
                        db.add(db_exp)
                    
                    # Also keep simple transaction history if accounts exist
                    db_tx = models.Transaction(
                        user_id=user_id, account_id=acc_id, to_account_id=to_acc_id,
                        amount=amount, type=e_type, description=desc, date=e_date,
                        category="Misc"
                    )
                    db.add(db_tx)
                
                # Update Account Balances back to Float
                acc_res = await db.execute(text("SELECT id, balance_cents FROM accounts"))
                for acc_row in acc_res.all():
                    bal = float(acc_row[1]) / 100.0
                    await db.execute(text(f"UPDATE accounts SET balance = {bal} WHERE id = '{acc_row[0]}'"))
                
                await db.commit()
                # await db.execute(text("DELETE FROM ledger_entries")) # Keep for safety during migration
                print("✅ Rollback migration complete.")
        except Exception as e:
            print(f"ℹ️ Rollback skipped or table 'ledger_entries' not found: {e}")

if __name__ == "__main__":
    try:
        if sys.platform == 'win32':
             asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        asyncio.run(run_migration())
    except KeyboardInterrupt:
        print("Migration cancelled.")
