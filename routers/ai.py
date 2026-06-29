from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from openai import OpenAI

import database_models
from database import get_db
from config import OPENAI_API_KEY

router = APIRouter(prefix="/ai", tags=["AI"])

openai_client = OpenAI(api_key=OPENAI_API_KEY)


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
def ai_chat(req: ChatRequest, db: Session = Depends(get_db)):
    products = db.query(database_models.Product).all()
    inventory_summary = "\n".join(
        [f"- {p.name} (ID:{p.id}): ${p.price}, {p.quantity} in stock" for p in products]
    )

    total_value = sum(p.price * p.quantity for p in products)
    total_items = len(products)
    total_stock = sum(p.quantity for p in products)

    system_prompt = f"""You are an AI inventory assistant for Aarion Inventory Management System.
You help users understand their inventory data, answer questions about products, and provide insights.

Current Inventory ({total_items} products, {total_stock} total units, ${total_value:.2f} total value):
{inventory_summary}

Rules:
- Be concise and helpful
- Answer based on the actual inventory data above
- If asked to perform actions (add/delete/update), explain that you can only provide information, not modify data
- Provide insights like low stock alerts, most expensive items, etc. when relevant
"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.question},
            ],
            max_tokens=500,
            temperature=0.7,
        )
        answer = response.choices[0].message.content or "I couldn't generate a response."
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
