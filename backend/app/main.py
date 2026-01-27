import os
import resend
from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Annotated
from . import models, schemas, auth, database
from .routers import habits, projects, daily_notes, finance, search, budgets, todos, learning, workouts, user_data, ai
from datetime import timedelta
from jose import JWTError, jwt

app = FastAPI(title="Atlas API")

@app.on_event("startup")
async def startup():
    # Create tables if they don't exist
    async with database.engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    
    # Professional Finance & User Normalization Migration
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

        # 2. Professional Finance Migration (V2 -> V3)
        # Migrate Transaction -> LedgerEntry and convert Float -> Cent Integer
        try:
            from sqlalchemy import text
            # Check if old transactions table exists and has data
            res = await db.execute(text("SELECT count(*) FROM transactions"))
            if res.scalar() > 0:
                print("📦 Migrating transactions to professional LedgerEntry (cents)...")
                # 1. Ensure categories exist for users
                users_res = await db.execute(select(models.User))
                users = users_res.scalars().all()
                
                # Fetch/Create default category for migration
                # (Ideally we'd map them, but for safety we use descriptions and names)
                
                # 2. Migrate entries
                tx_res = await db.execute(text("SELECT id, user_id, account_id, to_account_id, date, amount, type, category, description, currency, created_at FROM transactions"))
                for row in tx_res.all():
                    # amount cents
                    amt_cents = int(round(row[5] * 100))
                    
                    # Create LedgerEntry
                    entry = models.LedgerEntry(
                        id=row[0], user_id=row[1], account_id=row[2], to_account_id=row[3],
                        date=row[4], amount_cents=amt_cents, type=row[6],
                        description=f"[{row[7]}] {row[8]}", # Preserve old category in description if not mapped
                        currency=row[9], created_at=row[10]
                    )
                    db.add(entry)
                
                # 3. Update Account Balances
                acc_res = await db.execute(text("SELECT id, balance FROM accounts"))
                for acc_row in acc_res.all():
                    bal_cents = int(round(acc_row[1] * 100))
                    await db.execute(text(f"UPDATE accounts SET balance_cents = {bal_cents} WHERE id = '{acc_row[0]}'"))
                
                await db.commit()
                # 4. Clear/Drop old table if desired (or just empty it)
                await db.execute(text("DELETE FROM transactions"))
                await db.commit()
                print("✅ Professional finance migration complete.")
        except Exception as e:
            print(f"ℹ️ Migration skipped or table 'transactions' not found: {e}")

    print("Database tables initialized.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def register(user_in: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    # Normalize email to lowercase
    email_lower = user_in.email.lower().strip()
    from sqlalchemy import func
    result = await db.execute(select(models.User).where(func.lower(models.User.email) == email_lower))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = auth.get_password_hash(user_in.password)
    db_user = models.User(
        email=email_lower,
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

app.include_router(habits.router)
app.include_router(projects.router)
app.include_router(daily_notes.router)
app.include_router(finance.router)
app.include_router(search.router)
app.include_router(budgets.router)
app.include_router(todos.router)
app.include_router(learning.router)
app.include_router(workouts.router)
app.include_router(user_data.router)
app.include_router(ai.router)

@app.post("/auth/login", response_model=schemas.Token)
async def login(
    username: str = Form(...), # This 'username' field from OAuth2 form will hold either email or username
    password: str = Form(...),
    db: AsyncSession = Depends(database.get_db)
):
    from sqlalchemy import or_, func
    
    # Check if 'username' is an email (contains @) or a username
    identifier = username.lower().strip()
    
    result = await db.execute(
        select(models.User).where(
            or_(
                func.lower(models.User.email) == identifier,
                func.lower(models.User.username) == identifier
            )
        )
    )
    user = result.scalar_one_or_none()
    
    if not user or not auth.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

from pydantic import BaseModel
class RefreshTokenRequest(BaseModel):
    refresh_token: str

@app.post("/auth/refresh", response_model=schemas.Token)
async def refresh_token(
    refresh_req: RefreshTokenRequest,
    db: AsyncSession = Depends(database.get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_req.refresh_token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        if payload.get("type") != "refresh":
            raise credentials_exception
            
        import uuid
        user_id = uuid.UUID(user_id_str)
    except Exception:
        raise credentials_exception
    
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise credentials_exception
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_req.refresh_token, # Return same refresh token or rotate
        "token_type": "bearer"
    }

@app.post("/auth/forgot-password")
async def forgot_password(
    request: schemas.ForgotPasswordRequest,
    db: AsyncSession = Depends(database.get_db)
):
    from sqlalchemy import func
    email_lower = request.email.lower().strip()
    result = await db.execute(select(models.User).where(func.lower(models.User.email) == email_lower))
    user = result.scalar_one_or_none()
    
    if not user:
        return {"message": "If an account exists with that email, a reset link has been sent."}
    
    # Create a reset token (JWT) valid for 15 minutes
    reset_token = auth.create_access_token(
        data={"sub": str(user.id), "type": "password_reset"},
        expires_delta=timedelta(minutes=15)
    )
    
    # Send Email via Resend
    resend.api_key = os.getenv("RESEND_API_KEY")
    try:
        resend.Emails.send({
            "from": "Atlas <onboarding@resend.dev>",
            "to": [user.email],
            "subject": "Reset your Atlas Password",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                    <h2 style="color: #2eaadc; margin-bottom: 20px;">Reset your password</h2>
                    <p>You requested a password reset for your Atlas account. Copy the token below and paste it into the reset page:</p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 14px; word-break: break-all; border: 1px solid #ddd; margin: 20px 0;">
                        {reset_token}
                    </div>
                    <p style="color: #666; font-size: 12px; line-height: 1.5;">
                        This token will expire in <strong>15 minutes</strong>.<br/>
                        If you didn't request this, you can safely ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="text-align: center; color: #aaa; font-size: 10px;">Atlas System • Automated Message</p>
                </div>
            """
        })
        print(f"✅ Password reset email sent to {user.email}")
    except Exception as e:
        print(f"\n⚠️  RESEND EMAIL FAILED (likely onboarding@resend.dev limitation)")
        print(f"Error: {e}")
        print(f"\n--- FALLBACK: PASSWORD RESET TOKEN ---")
        print(f"To: {user.email}")
        print(f"Token: {reset_token}")
        print(f"Copy this token to the reset page.")
        print(f"---------------------------------------\n")
    
    return {"message": "If an account exists with that email, a reset link has been sent."}

@app.post("/auth/reset-password")
async def reset_password(
    request: schemas.ResetPasswordRequest,
    db: AsyncSession = Depends(database.get_db)
):
    try:
        payload = jwt.decode(request.token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        if payload.get("type") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
        
        user_id_str = payload.get("sub")
        import uuid
        user_id = uuid.UUID(user_id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = auth.get_password_hash(request.new_password)
    await db.commit()
    
    return {"message": "Password has been successfully reset."}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user = Depends(auth.get_current_user)):
    return current_user

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Atlas API is online"}

@app.get("/")
async def root():
    return {"message": "Welcome to Atlas API"}
