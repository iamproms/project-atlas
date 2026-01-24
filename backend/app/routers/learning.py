from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Annotated
from datetime import date
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/learning", tags=["learning"])

@router.get("/{session_date}", response_model=List[schemas.LearningSession])
async def get_learning_sessions(
    session_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.LearningSession).where(
            and_(
                models.LearningSession.user_id == current_user.id,
                models.LearningSession.date == session_date
            )
        )
    )
    return result.scalars().all()

@router.get("/range", response_model=List[schemas.LearningSession])
async def get_learning_sessions_range(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.LearningSession).where(
            and_(
                models.LearningSession.user_id == current_user.id,
                models.LearningSession.date >= start_date,
                models.LearningSession.date <= end_date
            )
        )
    )
    return result.scalars().all()

@router.post("/", response_model=schemas.LearningSession)
async def create_learning_session(
    session_in: schemas.LearningSessionCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    db_session = models.LearningSession(
        **session_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_learning_session(
    session_id: str,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    import uuid
    uid = uuid.UUID(session_id)
    
    result = await db.execute(
        select(models.LearningSession).where(
            and_(models.LearningSession.id == uid, models.LearningSession.user_id == current_user.id)
        )
    )
    db_session = result.scalar_one_or_none()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(db_session)
    await db.commit()
    return None
