import asyncio
from sqlalchemy import select
from app import models, database

async def main():
    async with database.get_db() as db:
        result = await db.execute(select(models.User).where(models.User.email == "user1@test.com"))
        user = result.scalar_one_or_none()
        if user:
            user.email = "promsfriday@gmail.com"
            await db.commit()
            print("✅ Email updated to promsfriday@gmail.com")
        else:
            print("⚠️ User with email user1@test.com not found")

if __name__ == "__main__":
    asyncio.run(main())
