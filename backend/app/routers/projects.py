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
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(models.Project)
        .where(models.Project.user_id == current_user.id)
        .options(selectinload(models.Project.todos))
    )
    # Note: The Pydantic schema for Project needs to arguably include `todos` if we want to serialize them, 
    # OR we compute a `progress` field. 
    # Let's adjust schemas.py first to include `todos` list if we do this.
    # For now, let's just return the project and let the frontend query details.
    # actually, let's allow the frontend to calculate progress from the full list if it's small, 
    # but strictly speaking `models.Project` in response_model=List[schemas.Project] 
    # will try to validate. If `schemas.Project` doesn't have `todos`, it ignores it.
    # I'll stick to the original plan: minimal changes first. 
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
    # Explicitly set empty list to avoid async lazy load error in Pydantic
    db_project.todos = []
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

@router.get("/{project_id}/todos", response_model=List[schemas.Todo])
async def get_project_todos(
    project_id: str,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    import uuid
    uid = uuid.UUID(project_id)
    result = await db.execute(
        select(models.Todo).where(
            and_(
                models.Todo.project_id == uid,
                models.Todo.user_id == current_user.id
            )
        ).order_by(models.Todo.priority.desc(), models.Todo.date)
    )
    return result.scalars().all()

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
@router.put("/{project_id}", response_model=schemas.Project)
async def update_project(
    project_id: str,
    project_update: schemas.ProjectCreate, # Reusing Create schema for simplicity
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    import uuid
    uid = uuid.UUID(project_id)
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(models.Project)
        .where(
            and_(models.Project.id == uid, models.Project.user_id == current_user.id)
        )
        .options(selectinload(models.Project.todos))
    )
    db_project = result.scalar_one_or_none()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_project.name = project_update.name
    db_project.description = project_update.description
    db_project.status = project_update.status
    db_project.priority = project_update.priority
    db_project.deadline = project_update.deadline
    db_project.tags = project_update.tags
    
    await db.commit()
    await db.refresh(db_project)
    return db_project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    import uuid
    uid = uuid.UUID(project_id)
    result = await db.execute(
        select(models.Project).where(
            and_(models.Project.id == uid, models.Project.user_id == current_user.id)
        )
    )
    db_project = result.scalar_one_or_none()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.delete(db_project)
    await db.commit()
    return None
