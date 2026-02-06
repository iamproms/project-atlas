from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from uuid import UUID
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    username: Optional[str] = None

class UserCreate(UserBase):
    password: str
    full_name: str # Overriding UserBase to make full_name required for creation

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    ai_personality: Optional[str] = None

class User(UserBase):
    id: UUID
    full_name: Optional[str] = None # Explicitly defined as per instruction
    ai_personality: Optional[str] = None # Default from DB is SERIOUS
    created_at: datetime

    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

# Habit Schemas
class HabitBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    difficulty: str = "medium"

class HabitCreate(HabitBase):
    pass

class Habit(HabitBase):
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Habit Log Schemas
class HabitLogBase(BaseModel):
    habit_id: UUID
    date: date
    completed: bool

class HabitLogCreate(HabitLogBase):
    pass

class HabitLog(HabitLogBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    status: str = "idea"
    priority: str = "medium"
    deadline: Optional[date] = None
    tags: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    todos: List["Todo"] = [] # For progress calculation

    class Config:
        from_attributes = True

# Project Focus Schemas
class ProjectFocusBase(BaseModel):
    date: date
    project_id: UUID

class ProjectFocusCreate(ProjectFocusBase):
    pass

class ProjectFocus(ProjectFocusBase):
    user_id: UUID

    class Config:
        from_attributes = True

# Daily Note Schemas
class DailyNoteBase(BaseModel):
    date: date
    content: str
    mood: Optional[str] = None
    highlight: Optional[str] = None
    lowlight: Optional[str] = None
    tags: Optional[str] = None

class DailyNoteCreate(DailyNoteBase):
    pass

class DailyNoteUpdate(BaseModel):
    content: str
    mood: Optional[str] = None
    highlight: Optional[str] = None
    lowlight: Optional[str] = None
    tags: Optional[str] = None

class DailyNote(DailyNoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Expense Schemas
class ExpenseBase(BaseModel):
    date: date
    amount: float
    category: str
    description: str

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None

class Expense(ExpenseBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Account Schemas
class AccountBase(BaseModel):
    name: str = Field(..., max_length=100)
    type: str = "BANK" # BANK, CASH, CARD, SAVINGS, WALLET
    balance: float = 0.0
    currency: str = "NGN"
    is_default: bool = False

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionBase(BaseModel):
    date: date
    amount: float
    type: str = "EXPENSE" # INCOME, EXPENSE, TRANSFER
    category: str
    description: str
    account_id: UUID
    to_account_id: Optional[UUID] = None
    currency: str = "NGN"

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Recurring Transaction Schemas
class RecurringTransactionBase(BaseModel):
    amount: float
    type: str
    category: str
    description: str
    account_id: UUID
    frequency: str
    next_date: date
    is_active: bool = True

class RecurringTransactionCreate(RecurringTransactionBase):
    pass

class RecurringTransaction(RecurringTransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Budget Schemas
class BudgetBase(BaseModel):
    category: str = Field(..., max_length=50)
    amount: float
    period: str = "MONTHLY"

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Todo Schemas
class TodoBase(BaseModel):
    content: str
    date: date
    priority: str = "medium"
    is_completed: bool = False
    project_id: Optional[UUID] = None

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    content: Optional[str] = None
    priority: Optional[str] = None
    is_completed: Optional[bool] = None
    is_carried_over: Optional[bool] = None
    date: Optional[date] = None
    project_id: Optional[UUID] = None

class Todo(TodoBase):
    id: UUID
    user_id: UUID
    is_carried_over: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Learning Schemas
class LearningSessionBase(BaseModel):
    date: date
    subject: str
    resource_type: Optional[str] = None
    resource_name: Optional[str] = None
    takeaways: Optional[str] = None
    duration_minutes: int
    resources: Optional[str] = None
    notes: Optional[str] = None

class LearningSessionCreate(LearningSessionBase):
    pass

class LearningSession(LearningSessionBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Workout Schemas
class ExerciseSetBase(BaseModel):
    exercise_name: str
    weight: float
    reps: int
    order: int

class ExerciseSetCreate(ExerciseSetBase):
    pass

class ExerciseSet(ExerciseSetBase):
    id: UUID
    workout_id: UUID

    class Config:
        from_attributes = True

class WorkoutBase(BaseModel):
    date: date
    type: str # Leg Day, etc.
    notes: Optional[str] = None

class WorkoutCreate(WorkoutBase):
    sets: List[ExerciseSetCreate]

class Workout(WorkoutBase):
    id: UUID
    user_id: UUID
    sets: List[ExerciseSet]
    created_at: datetime

    class Config:
        from_attributes = True
# Auth/Reset Schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
