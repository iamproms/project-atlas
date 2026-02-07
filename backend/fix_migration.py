import asyncio
import os
import subprocess
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.database import DATABASE_URL

async def fix_migration_state():
    print("🔍 Checking database migration state...")
    
    # Ensure DATABASE_URL is set
    if not DATABASE_URL:
        print("❌ DATABASE_URL is not set.")
        exit(1)

    try:
        engine = create_async_engine(DATABASE_URL)
        async with engine.connect() as conn:
            # 1. Check if 'users' table exists (proxy for "is the DB initialized?")
            res_users = await conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"))
            users_exists = res_users.scalar()
            
            # 2. Check if 'alembic_version' table exists
            res_version_table = await conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'alembic_version')"))
            version_table_exists = res_version_table.scalar()
            
            # 3. Check actual version if table exists
            current_version = None
            if version_table_exists:
                try:
                    res_ver = await conn.execute(text("SELECT version_num FROM alembic_version"))
                    current_version = res_ver.scalar_one_or_none()
                except Exception:
                    pass
            
            print(f"   - Users table exists: {users_exists}")
            print(f"   - Alembic version table exists: {version_table_exists}")
            print(f"   - Current Alembic version: {current_version}")

            # LOGIC
            if users_exists and (not version_table_exists or current_version is None):
                print("⚠️  Detected initialized database (via create_all) with missing migration history.")
                print("⚡ Stamping database to 'phase_17_finance' to sync history...")
                subprocess.run(["alembic", "stamp", "phase_17_finance"], check=True)
            elif not users_exists:
                 print("✅ Fresh database detected. Standard upgrade will follow.")
            else:
                 print(f"✅ Database has history (Version: {current_version}). Proceeding with upgrade.")

    except Exception as e:
        print(f"⚠️  Error checking database state: {e}")
        print("   Proceeding with 'alembic upgrade head' tentatively...")

    print("🚀 Running 'alembic upgrade head'...")
    subprocess.run(["alembic", "upgrade", "head"], check=True)
    print("✅ Migration process complete.")

if __name__ == "__main__":
    asyncio.run(fix_migration_state())
