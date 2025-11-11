"""
Enhanced Features for BlockBank
- Friends system
- Bill payments
- Rewards/Coupons
"""

from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class BillType(str, Enum):
    electricity = "electricity"
    water = "water"
    gas = "gas"
    mobile = "mobile"
    internet = "internet"
    fiber = "fiber"
    broadband = "broadband"
    cable_tv = "cable_tv"
    insurance = "insurance"
    credit_card = "credit_card"


class FriendRequest(BaseModel):
    friend_email: str


class Friend(BaseModel):
    model_config = {"extra": "ignore"}
    
    friend_id: str
    user_id: str
    friend_user_id: str
    friend_name: str
    friend_email: str
    created_at: str


class BillPaymentCreate(BaseModel):
    bill_type: BillType
    bill_number: str
    amount: float
    provider: str


class BillPayment(BaseModel):
    model_config = {"extra": "ignore"}
    
    payment_id: str
    user_id: str
    bill_type: BillType
    bill_number: str
    amount: float
    provider: str
    status: str
    timestamp: str
    tx_id: Optional[str] = None


class RewardCreate(BaseModel):
    code: str
    reward_type: str  # "cashback", "discount", "points"
    value: float


class Reward(BaseModel):
    model_config = {"extra": "ignore"}
    
    reward_id: str
    user_id: str
    code: str
    reward_type: str
    value: float
    status: str  # "active", "used", "expired"
    created_at: str
    expires_at: Optional[str] = None


class TransferWithAnimationRequest(BaseModel):
    receiver_email: str  # Can search by email now
    amount: float
    message: Optional[str] = None


class SpendingStats(BaseModel):
    total_sent: float
    total_received: float
    transaction_count: int
    by_category: dict
    monthly_spending: List[dict]
