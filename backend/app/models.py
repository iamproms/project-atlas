import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import String, ForeignKey, DateTime, Date, Boolean, UniqueConstraint, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    habits: Mapped[List["Habit"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    projects: Mapped[List["Project"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    daily_notes: Mapped[List["DailyNote"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    habit_logs: Mapped[List["HabitLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    project_focuses: Mapped[List["ProjectFocus"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    expenses: Mapped[List["Expense"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    budgets: Mapped[List["Budget"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    todos: Mapped[List["Todo"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    learning_sessions: Mapped[List["LearningSession"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    workouts: Mapped[List["Workout"]] = relationship(back_populates="owner", cascade="all, delete-orphan")

class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(50), default="medium")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="habits")
    logs: Mapped[List["HabitLog"]] = relationship(back_populates="habit", cascade="all, delete-orphan")

class HabitLog(Base):
    __tablename__ = "habit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    habit_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("habits.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)

    habit: Mapped["Habit"] = relationship(back_populates="logs")
    user: Mapped["User"] = relationship(back_populates="habit_logs")

    __table_args__ = (
        UniqueConstraint("user_id", "habit_id", "date", name="uq_user_habit_date"),
    )

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="projects")
    focus_history: Mapped[List["ProjectFocus"]] = relationship(back_populates="project", cascade="all, delete-orphan")

class ProjectFocus(Base):
    __tablename__ = "project_focus"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    date: Mapped[date] = mapped_column(Date, primary_key=True, index=True)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"))

    user: Mapped["User"] = relationship(back_populates="project_focuses")
    project: Mapped["Project"] = relationship(back_populates="focus_history")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_focus_date"),
    )

class DailyNote(Base):
    __tablename__ = "daily_notes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    content: Mapped[str] = mapped_column(Text)
    mood: Mapped[Optional[str]] = mapped_column(String(50))
    highlight: Mapped[Optional[str]] = mapped_column(String(255))
    lowlight: Mapped[Optional[str]] = mapped_column(String(255))
    tags: Mapped[Optional[str]] = mapped_column(Text) # JSON or comma-separated
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="daily_notes")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_note_date"),
    )

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[float] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(50), index=True)
    description: Mapped[str] = mapped_column(String(255))
    currency: Mapped[str] = mapped_column(String(3), default="NGN")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="expenses")

class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    category: Mapped[str] = mapped_column(String(50), index=True)
    amount: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="budgets")

    __table_args__ = (
        UniqueConstraint("user_id", "category", name="uq_user_category_budget"),
    )

class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    content: Mapped[str] = mapped_column(String(255))
    priority: Mapped[str] = mapped_column(String(10), default="medium") # low, medium, high
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_carried_over: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="todos")

class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    subject: Mapped[str] = mapped_column(String(100), index=True)
    resource_type: Mapped[Optional[str]] = mapped_column(String(50)) # Book, Course, Podcast, etc.
    resource_name: Mapped[Optional[str]] = mapped_column(String(255))
    takeaways: Mapped[Optional[str]] = mapped_column(Text)
    duration_minutes: Mapped[int] = mapped_column()
    resources: Mapped[Optional[str]] = mapped_column(Text) # JSON or Comma-separated links
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="learning_sessions")

class Workout(Base):
    __tablename__ = "workouts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    type: Mapped[str] = mapped_column(String(100)) # e.g., "Leg Day", "Push"
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="workouts")
    sets: Mapped[List["ExerciseSet"]] = relationship(back_populates="workout", cascade="all, delete-orphan")

class ExerciseSet(Base):
    __tablename__ = "exercise_sets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workout_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workouts.id"), index=True)
    exercise_name: Mapped[str] = mapped_column(String(100), index=True)
    weight: Mapped[float] = mapped_column(Float)
    reps: Mapped[int] = mapped_column()
    order: Mapped[int] = mapped_column() # Order in the workout
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    workout: Mapped["Workout"] = relationship(back_populates="sets")
