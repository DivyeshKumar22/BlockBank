from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    user = "user"
    admin = "admin"


class TransactionStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"


class NotificationStatus(str, Enum):
    read = "read"
    unread = "unread"


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    name: str
    email: str
    role: UserRole = UserRole.user
    created_at: str


class WalletCreate(BaseModel):
    user_id: str


class Wallet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    wallet_id: str
    user_id: str
    wallet_address: str
    created_at: str


class TransactionCreate(BaseModel):
    sender_wallet: str
    receiver_wallet: str
    amount: float
    signature: str
    nonce: int = 0
    timestamp: str  # Add timestamp field
    
    @field_validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v


class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    tx_id: str
    sender_wallet: str
    receiver_wallet: str
    amount: float
    timestamp: str
    tx_hash: str
    signature: str
    status: TransactionStatus = TransactionStatus.pending
    nonce: int = 0


class BlockCreate(BaseModel):
    pending_tx_ids: List[str]
    validator: str = "admin"


class Block(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    block_id: str
    block_number: int
    previous_hash: str
    merkle_root: str
    timestamp: str
    nonce: int
    block_hash: str
    validator: str
    created_at: str


class BlockDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    block: Block
    transactions: List[Transaction]


class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    notification_id: str
    user_id: Optional[str] = None
    message: str
    timestamp: str
    status: NotificationStatus = NotificationStatus.unread


class NotificationCreate(BaseModel):
    user_id: Optional[str] = None
    message: str


class AuthResponse(BaseModel):
    token: str
    user: User


class BalanceResponse(BaseModel):
    wallet_address: str
    balance: float


class ValidationReport(BaseModel):
    valid: bool
    total_blocks: int
    issues: List[str] = []


class StatsResponse(BaseModel):
    total_users: int
    total_blocks: int
    total_transactions: int
    recent_transactions: List[Transaction]
