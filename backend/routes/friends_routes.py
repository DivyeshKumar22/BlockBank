"""
Friends System Routes
Add friends by email, send money easily
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os

router = APIRouter(prefix="/friends", tags=["friends"])

# Database connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'bank_blockchain_db')]


@router.post("/add")
async def add_friend(friend_email: str, current_user=None):
    """Add friend by email - no wallet address needed!"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    friend_user = await db.users.find_one({"email": friend_email})
    if not friend_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend_user["user_id"] == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")
    
    existing = await db.friends.find_one({
        "user_id": current_user.user_id,
        "friend_user_id": friend_user["user_id"]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already friends")
    
    friend_doc = {
        "friend_id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "friend_user_id": friend_user["user_id"],
        "friend_name": friend_user["name"],
        "friend_email": friend_user["email"],
        "friend_avatar": friend_user.get("avatar", "👤"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.friends.insert_one(friend_doc)
    
    return {
        "message": f"✓ Added {friend_user['name']} as friend",
        "friend": {
            "name": friend_user["name"],
            "email": friend_user["email"],
            "avatar": friend_user.get("avatar", "👤")
        }
    }


@router.get("/list")
async def get_friends(current_user=None):
    """Get user's friends list with avatars"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    friends = await db.friends.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(None)
    
    return {"friends": friends, "count": len(friends)}


@router.delete("/remove/{friend_email}")
async def remove_friend(friend_email: str, current_user=None):
    """Remove friend"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.friends.delete_one({
        "user_id": current_user.user_id,
        "friend_email": friend_email
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friend not found")
    
    return {"message": "Friend removed"}
