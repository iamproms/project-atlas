from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Annotated
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
async def search(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    # Search Daily Notes
    notes_stmt = select(models.DailyNote).where(
        models.DailyNote.user_id == current_user.id,
        models.DailyNote.content.ilike(f"%{q}%")
    )
    notes_result = await db.execute(notes_stmt)
    notes = notes_result.scalars().all()

    # Search Ledger Entries
    ledger_stmt = select(models.LedgerEntry).where(
        models.LedgerEntry.user_id == current_user.id,
        models.LedgerEntry.description.ilike(f"%{q}%")
    )
    ledger_result = await db.execute(ledger_stmt)
    ledger_entries = ledger_result.scalars().all()

    # Search Projects
    projects_stmt = select(models.Project).where(
        models.Project.user_id == current_user.id,
        or_(
            models.Project.name.ilike(f"%{q}%"),
            models.Project.description.ilike(f"%{q}%")
        )
    )
    projects_result = await db.execute(projects_stmt)
    projects = projects_result.scalars().all()

    return {
        "notes": notes,
        "ledger": ledger_entries,
        "projects": projects
    }
