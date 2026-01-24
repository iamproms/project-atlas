from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Annotated
from datetime import date
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/", response_model=List[schemas.Project])
async def get_projects(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Project).where(models.Project.user_id == current_user.id)
    )
    return result.scalars().all()

@router.post("/", response_model=schemas.Project)
async def create_project(
    project_in: schemas.ProjectCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    db_project = models.Project(
        **project_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return db_project

@router.get("/focus/{focus_date}", response_model=Optional[schemas.ProjectFocus])
async def get_project_focus(
    focus_date: date,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.ProjectFocus).where(
            and_(
                models.ProjectFocus.user_id == current_user.id,
                models.ProjectFocus.date == focus_date
            )
        )
    )
    return result.scalar_one_or_none()

@router.post("/focus", response_model=schemas.ProjectFocus)
async def set_project_focus(
    focus_in: schemas.ProjectFocusCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    # Verify the project belongs to the user
    project_result = await db.execute(
        select(models.Project).where(
            and_(models.Project.id == focus_in.project_id, models.Project.user_id == current_user.id)
        )
    )
    if not project_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    # Upsert logic for the ledger
    stmt = select(models.ProjectFocus).where(
        and_(
            models.ProjectFocus.user_id == current_user.id,
            models.ProjectFocus.date == focus_in.date
        )
    )
    result = await db.execute(stmt)
    db_focus = result.scalar_one_or_none()

    if db_focus:
        db_focus.project_id = focus_in.project_id
    else:
        db_focus = models.ProjectFocus(
            **focus_in.model_dump(),
            user_id=current_user.id
        )
        db.add(db_focus)
    
    await db.commit()
    await db.refresh(db_focus)
    return db_focus
