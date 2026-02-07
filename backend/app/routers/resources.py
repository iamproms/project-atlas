import uuid
from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_
from sqlalchemy.orm import selectinload
from .. import models, schemas, database
from ..auth import get_current_user

router = APIRouter(prefix="/resources", tags=["resources"])

@router.get("/", response_model=List[schemas.Resource])
async def get_resources(
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None,
    status: str = None
):
    query = select(models.Resource).where(models.Resource.user_id == current_user.id)
    if status:
        query = query.where(models.Resource.status == status)
    
    query = query.order_by(desc(models.Resource.updated_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=schemas.Resource)
async def create_resource(
    resource_in: schemas.ResourceCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    db_resource = models.Resource(**resource_in.model_dump(), user_id=current_user.id)
    db.add(db_resource)
    await db.commit()
    await db.refresh(db_resource)
    return db_resource

@router.patch("/{resource_id}", response_model=schemas.Resource)
async def update_resource(
    resource_id: uuid.UUID,
    resource_in: schemas.ResourceUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Resource).where(and_(models.Resource.id == resource_id, models.Resource.user_id == current_user.id))
    )
    db_resource = result.scalar_one_or_none()
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    update_data = resource_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_resource, key, value)
    
    await db.commit()
    await db.refresh(db_resource)
    return db_resource

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: uuid.UUID,
    db: AsyncSession = Depends(database.get_db),
    current_user: Annotated[schemas.User, Depends(get_current_user)] = None
):
    result = await db.execute(
        select(models.Resource).where(and_(models.Resource.id == resource_id, models.Resource.user_id == current_user.id))
    )
    db_resource = result.scalar_one_or_none()
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    await db.delete(db_resource)
    await db.commit()
    return None
