from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/vision",
    tags=["vision"],
)

@router.post("/", response_model=schemas.VisionItem)
def create_vision_item(
    item: schemas.VisionItemCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_item = models.VisionItem(**item.model_dump(), user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=List[schemas.VisionItem])
def read_vision_items(
    section: str = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.VisionItem).filter(models.VisionItem.user_id == current_user.id)
    if section:
        query = query.filter(models.VisionItem.section == section)
    return query.order_by(models.VisionItem.section, models.VisionItem.order).all()

@router.patch("/{item_id}", response_model=schemas.VisionItem)
def update_vision_item(
    item_id: UUID,
    item_update: schemas.VisionItemUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(models.VisionItem).filter(
        models.VisionItem.id == item_id,
        models.VisionItem.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Vision item not found")
    
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_vision_item(
    item_id: UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(models.VisionItem).filter(
        models.VisionItem.id == item_id,
        models.VisionItem.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Vision item not found")
    
    db.delete(db_item)
    db.commit()
    return {"ok": True}
