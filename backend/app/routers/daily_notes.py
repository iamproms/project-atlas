from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date
from typing import Optional, Annotated, List
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/daily-notes", tags=["daily-notes"])

@router.get("/", response_model=List[schemas.DailyNote])
async def get_recent_notes(
    limit: int = 10,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.DailyNote)
        .where(models.DailyNote.user_id == current_user.id)
        .order_by(models.DailyNote.date.desc())
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/{note_date}", response_model=Optional[schemas.DailyNote])
async def get_daily_note(
    note_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.DailyNote).where(
            and_(
                models.DailyNote.user_id == current_user.id,
                models.DailyNote.date == note_date
            )
        )
    )
    return result.scalar_one_or_none()

@router.put("/{note_date}", response_model=schemas.DailyNote)
async def save_daily_note(
    note_date: date,
    note_in: schemas.DailyNoteUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    stmt = select(models.DailyNote).where(
        and_(
            models.DailyNote.user_id == current_user.id,
            models.DailyNote.date == note_date
        )
    )
    result = await db.execute(stmt)
    db_note = result.scalar_one_or_none()

    if db_note:
        db_note.content = note_in.content
        db_note.mood = note_in.mood
        db_note.highlight = note_in.highlight
        db_note.lowlight = note_in.lowlight
        db_note.tags = note_in.tags
    else:
        db_note = models.DailyNote(
            date=note_date,
            content=note_in.content,
            mood=note_in.mood,
            highlight=note_in.highlight,
            lowlight=note_in.lowlight,
            tags=note_in.tags,
            user_id=current_user.id
        )
        db.add(db_note)
    
    await db.commit()
    await db.refresh(db_note)
    return db_note
