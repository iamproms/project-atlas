from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from .. import models, schemas, database
from ..auth import get_current_user
import re
import random
from datetime import date, timedelta
from sqlalchemy import or_

router = APIRouter(prefix="/ai", tags=["ai"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    action: Optional[str] = None # e.g., "NAVIGATE_TASKS", "CREATE_TODO"
    data: Optional[dict] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    msg = request.message.lower().strip()
    
    # Personality Injection
    PERSONALITY = "SARCASTIC"
    
    def respond(text, action=None, data=None):
        final_text = text
        if PERSONALITY == "SARCASTIC":
            prefixes = [
                "Ugh, fine.",
                "If I absolutely must.",
                "Running your little command...",
                "Beep boop. Done.",
                "Execute.",
                "Sigh. Here:",
                "Your wish is my command... unfortunately.",
                "Processing... 99%... Done.",
            ]
            # Don't sarcastic-ize long search results or basic errors, only short confirmations
            if len(text) < 100: 
                final_text = f"{random.choice(prefixes)} {text}"
        return ChatResponse(response=final_text, action=action, data=data)

    # 1. Navigation intents
    if any(k in msg for k in ["go to", "open", "view", "show", "navigate"]):
        if "dashboard" in msg or "home" in msg:
            return respond("Navigating to Dashboard...", action="NAVIGATE", data={"path": "/"})
        if "task" in msg or "todo" in msg:
            return respond("Opening your tasks.", action="NAVIGATE", data={"path": "/tasks"})
        if "journal" in msg or "note" in msg:
            return respond("Opening your journal.", action="NAVIGATE", data={"path": "/journal"})
        if "expense" in msg or "budget" in msg:
            return respond("Opening expenses.", action="NAVIGATE", data={"path": "/expenses"})
        if "profile" in msg or "setting" in msg:
            return respond("Opening profile settings.", action="NAVIGATE", data={"path": "/profile"})
        if "vision" in msg or "board" in msg:
            return respond("Opening Vision Board.", action="NAVIGATE", data={"path": "/vision"})
        if "habit" in msg:
            return respond("Opening Habits.", action="NAVIGATE", data={"path": "/habits"})
        if "fitness" in msg or "workout" in msg or "gym" in msg:
            return respond("Opening Fitness Gym.", action="NAVIGATE", data={"path": "/fitness"})
        if "learn" in msg or "study" in msg:
            return respond("Opening Study Room.", action="NAVIGATE", data={"path": "/learning"})
        if "project" in msg:
            return respond("Opening Projects.", action="NAVIGATE", data={"path": "/projects"})
            
    # 2. Action intents - Create Todo
    todo_match = re.search(r'(add|create|new) todo (.*)', msg) or re.search(r'remind me to (.*)', msg)
    if todo_match:
        content = todo_match.group(2).strip()
        new_todo = models.Todo(
            user_id=current_user.id,
            content=content,
            date=date.today(),
            priority="medium"
        )
        db.add(new_todo)
        await db.commit()
        return respond(f"I've added '{content}' to your task list.", action="REFRESH_TASKS")

    # 3. Action intents - Log Expense
    expense_match = re.search(r'spent (\d+) on (.*)', msg)
    if expense_match:
        amount = float(expense_match.group(1))
        desc = expense_match.group(2).strip()
        category = "Misc"
        lower_desc = desc.lower()
        if "food" in lower_desc or "eat" in lower_desc: category = "Food"
        elif "transport" in lower_desc or "uber" in lower_desc: category = "Transport"
        elif "bill" in lower_desc: category = "Bills"
        
        new_expense = models.Expense(
            user_id=current_user.id,
            amount=amount,
            description=desc,
            category=category,
            date=date.today()
        )
        db.add(new_expense)
        await db.commit()
        return respond(f"Logged expense: ₦{amount} for {desc} ({category}).", action="REFRESH_EXPENSES")

    # 4. Timer Intent
    timer_match = re.search(r'set timer for (\d+)', msg)
    if timer_match:
        mins = int(timer_match.group(1))
        return respond(f"Starting timer for {mins} minutes.", action="START_TIMER", data={"minutes": mins})

    # 5. Search Intent
    date_query = None
    days_ago_match = re.search(r'(\d+) days? ago', msg)
    if days_ago_match:
        days = int(days_ago_match.group(1))
        date_query = date.today() - timedelta(days=days)
    elif "yesterday" in msg:
        date_query = date.today() - timedelta(days=1)
    elif "today" in msg:
        date_query = date.today()

    search_match = re.search(r'(search|find|show me) (.*)', msg)
    
    if search_match or date_query:
        query_text = ""
        if search_match:
             raw_query = search_match.group(2).strip()
             query_text = raw_query

        # Build queries
        note_q = select(models.DailyNote).where(models.DailyNote.user_id == current_user.id)
        if date_query:
            note_q = note_q.where(models.DailyNote.date == date_query)
        elif query_text and "journal" in msg:
             note_q = note_q.where(models.DailyNote.content.ilike(f"%{query_text}%"))
        elif query_text:
             note_q = note_q.where(models.DailyNote.content.ilike(f"%{query_text}%"))
        
        exp_q = select(models.Expense).where(models.Expense.user_id == current_user.id)
        if date_query:
            exp_q = exp_q.where(models.Expense.date == date_query)
        elif query_text and "expense" in msg:
             exp_q = exp_q.where(models.Expense.description.ilike(f"%{query_text}%"))
        elif query_text:
             exp_q = exp_q.where(models.Expense.description.ilike(f"%{query_text}%"))

        # Execute
        notes = []
        expenses = []
        
        run_notes = "expense" not in msg and "budget" not in msg
        run_expenses = "journal" not in msg and "note" not in msg
        
        if run_notes:
            notes = (await db.execute(note_q)).scalars().all()
        if run_expenses:
            expenses = (await db.execute(exp_q)).scalars().all()

        if not notes and not expenses:
            return respond(f"I searched high and low, but found nothing matching that criteria.")

        response_text = "Here's what I found:\n"
        if notes:
            response_text += "\n📝 **Journal**:\n"
            for n in notes[:3]:
                response_text += f"- {n.date}: {n.content[:100]}...\n"
        if expenses:
            response_text += "\n💸 **Expenses**:\n"
            for e in expenses[:3]:
                response_text += f"- {e.date}: {e.description} (₦{e.amount})\n"

        return respond(response_text)

    # Default fallback
    return respond("I'm still learning. Try 'Add todo buy milk', 'Spent 5000 on food', or 'Go to tasks'.")
