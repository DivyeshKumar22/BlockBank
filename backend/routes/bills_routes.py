"""
Bill Payment Routes
10 types of bill payments
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import List
import uuid
import os

router = APIRouter(prefix="/bills", tags=["bills"])

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'bank_blockchain_db')]

BILL_TYPES = [
    {"id": "electricity", "name": "Electricity Bill", "icon": "⚡", "color": "#FDB813"},
    {"id": "water", "name": "Water Bill", "icon": "💧", "color": "#3B82F6"},
    {"id": "gas", "name": "Gas Bill", "icon": "🔥", "color": "#EF4444"},
    {"id": "mobile", "name": "Mobile Recharge", "icon": "📱", "color": "#10B981"},
    {"id": "internet", "name": "Internet Bill", "icon": "🌐", "color": "#8B5CF6"},
    {"id": "fiber", "name": "Fiber/Broadband", "icon": "📡", "color": "#F59E0B"},
    {"id": "cable_tv", "name": "Cable TV", "icon": "📺", "color": "#EC4899"},
    {"id": "insurance", "name": "Insurance", "icon": "🛡️", "color": "#14B8A6"},
    {"id": "credit_card", "name": "Credit Card", "icon": "💳", "color": "#6366F1"},
    {"id": "donation", "name": "Donation", "icon": "❤️", "color": "#F43F5E"}
]


@router.get("/types")
async def get_bill_types():
    """Get all available bill types with icons"""
    return {"bill_types": BILL_TYPES}


@router.post("/pay")
async def pay_bill(bill_type: str, bill_number: str, amount: float, 
                  provider: str, current_user=None):
    """Pay utility bill"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payment_id = str(uuid.uuid4())
    payment_doc = {
        "payment_id": payment_id,
        "user_id": current_user.user_id,
        "bill_type": bill_type,
        "bill_number": bill_number,
        "amount": amount,
        "provider": provider,
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bill_payments.insert_one(payment_doc)
    
    # Get bill type info
    bill_info = next((b for b in BILL_TYPES if b["id"] == bill_type), None)
    
    return {
        "message": f"✓ {bill_info['name'] if bill_info else 'Bill'} paid successfully",
        "payment_id": payment_id,
        "amount": amount,
        "icon": bill_info["icon"] if bill_info else "💰"
    }


@router.get("/history")
async def get_bill_history(current_user=None):
    """Get bill payment history"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    bills = await db.bill_payments.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(50)
    
    # Add icons
    for bill in bills:
        bill_info = next((b for b in BILL_TYPES if b["id"] == bill["bill_type"]), None)
        if bill_info:
            bill["icon"] = bill_info["icon"]
            bill["color"] = bill_info["color"]
    
    return {"bills": bills, "count": len(bills)}
