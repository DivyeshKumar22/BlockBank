from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from database import db  # your MongoDB connection
from models.user import User
from core.auth import get_current_user  # if login is required

router = APIRouter()

# 📬 Define what the contact form sends
class ContactForm(BaseModel):
    name: str
    email: str
    message: str

@router.post("/contact")
async def contact_us(data: ContactForm):
    """Handle Contact Us messages and notify admin."""
    # Optionally save the message to a collection
    await db.contact_messages.insert_one({
        "name": data.name,
        "email": data.email,
        "message": data.message,
        "timestamp": datetime.utcnow().isoformat()
    })

    # 🔔 Create an admin notification
    notification_data = {
        "notification_id": str(ObjectId()),
        "user_id": None,  # very important! shows to admin only
        "message": f"New contact message from {data.name}: {data.message[:60]}...",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "unread"
    }

    await db.notifications.insert_one(notification_data)

    return {"message": "Your message has been sent successfully!"}
