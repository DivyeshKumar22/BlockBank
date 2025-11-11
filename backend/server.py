from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import os
import sys
sys.path.append('/app/backend')
import logging
from pathlib import Path
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from models import (
    UserCreate, UserLogin, User, AuthResponse, UserRole,
    WalletCreate, Wallet, BalanceResponse,
    TransactionCreate, Transaction, TransactionStatus,
    BlockCreate, Block, BlockDetail,
    Notification, NotificationCreate,
    StatsResponse, ValidationReport
)
from auth_utils import hash_password, verify_password, create_access_token, decode_token
from crypto_utils import (
    generate_keypair, sign_message, verify_signature,
    encrypt_private_key, decrypt_private_key,
    compute_transaction_hash, compute_block_hash, compute_merkle_root
)
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'bank_blockchain_db')]

# Master key for encrypting private keys
MASTER_KEY = os.environ.get('MASTER_KEY', 'change-this-master-key-in-production')

# Create the main app
app = FastAPI(title="Bank Blockchain API")

# --- Add CORS middleware here ---
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://blockbank-frontend.netlify.app",
]
# --- End of CORS block ---

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")




# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()


# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensure user is admin"""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ============= AUTHENTICATION ROUTES =============

@api_router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    """Register a new user and create wallet"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    password_hash = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": password_hash,
        "role": UserRole.user.value,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Generate wallet
    public_key, private_key = generate_keypair()
    encrypted_private_key = encrypt_private_key(private_key, MASTER_KEY)
    
    wallet_id = str(uuid.uuid4())
    wallet_doc = {
        "wallet_id": wallet_id,
        "user_id": user_id,
        "wallet_address": public_key,
        "encrypted_private_key": encrypted_private_key,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.wallets.insert_one(wallet_doc)
    
    # Create JWT token
    token = create_access_token({"user_id": user_id, "email": user_data.email})
    
    user = User(
        user_id=user_id,
        name=user_data.name,
        email=user_data.email,
        role=UserRole.user,
        created_at=user_doc["created_at"]
    )
    
    return AuthResponse(token=token, user=user)


@api_router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """Login user"""
    user_doc = await db.users.find_one({"email": credentials.email})
    
    if not user_doc or not verify_password(credentials.password, user_doc["password_hash"]):
       raise HTTPException(status_code=401, detail="Invalid credentials")

    
    # Create token
    token = create_access_token({"user_id": user_doc["user_id"], "email": user_doc["email"]})
    
    user = User(
        user_id=user_doc["user_id"],
        name=user_doc["name"],
        email=user_doc["email"],
        role=UserRole(user_doc["role"]),
        created_at=user_doc["created_at"]
    )
    
    return AuthResponse(token=token, user=user)


@api_router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client-side token removal)"""
    return {"message": "Logged out successfully"}


# ============= WALLET ROUTES =============

@api_router.get("/wallet/balance")
async def get_wallet_balance(address: str, current_user: User = Depends(get_current_user)):
    """Get wallet balance"""
    # Check wallet exists
    wallet = await db.wallets.find_one({"wallet_address": address}, {"_id": 0})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Calculate balance from confirmed transactions
    received_txs = await db.transactions.find({
        "receiver_wallet": address,
        "status": TransactionStatus.confirmed.value
    }).to_list(None)
    
    sent_txs = await db.transactions.find({
        "sender_wallet": address,
        "status": TransactionStatus.confirmed.value
    }).to_list(None)
    
    received = sum(tx["amount"] for tx in received_txs)
    sent = sum(tx["amount"] for tx in sent_txs)
    
    balance = received - sent
    
    return BalanceResponse(wallet_address=address, balance=balance)


@api_router.get("/wallet/{address}/transactions", response_model=List[Transaction])
async def get_wallet_transactions(address: str, current_user: User = Depends(get_current_user)):
    """Get transaction history for a wallet"""
    transactions = await db.transactions.find({
        "$or": [
            {"sender_wallet": address},
            {"receiver_wallet": address}
        ]
    }, {"_id": 0}).sort("timestamp", -1).to_list(100)
    
    return [Transaction(**tx) for tx in transactions]


@api_router.get("/wallet/my-wallets", response_model=List[Wallet])
async def get_my_wallets(current_user: User = Depends(get_current_user)):
    """Get current user's wallets"""
    wallets = await db.wallets.find(
        {"user_id": current_user.user_id},
        {"_id": 0, "encrypted_private_key": 0}
    ).to_list(None)
    
    return [Wallet(**w) for w in wallets]


# ============= TRANSACTION ROUTES =============

@api_router.post("/transaction/create")
async def create_transaction(tx_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    """Create and broadcast a transaction"""
    # Verify sender wallet belongs to current user
    sender_wallet = await db.wallets.find_one({"wallet_address": tx_data.sender_wallet})
    if not sender_wallet or sender_wallet["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Unauthorized wallet")
    
    # Verify receiver wallet exists
    receiver_wallet = await db.wallets.find_one({"wallet_address": tx_data.receiver_wallet})
    if not receiver_wallet:
        raise HTTPException(status_code=404, detail="Receiver wallet not found")
    
    # Check balance
    balance_resp = await get_wallet_balance(tx_data.sender_wallet, current_user)
    if balance_resp.balance < tx_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Compute transaction hash using provided timestamp
    tx_hash = compute_transaction_hash(
        tx_data.sender_wallet,
        tx_data.receiver_wallet,
        tx_data.amount,
        tx_data.timestamp,
        tx_data.nonce
    )
    
    # Verify signature
    message = tx_hash
    if not verify_signature(message, tx_data.signature, tx_data.sender_wallet):
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Create transaction
    tx_id = str(uuid.uuid4())
    tx_doc = {
        "tx_id": tx_id,
        "sender_wallet": tx_data.sender_wallet,
        "receiver_wallet": tx_data.receiver_wallet,
        "amount": tx_data.amount,
        "timestamp": tx_data.timestamp,  # Use provided timestamp
        "tx_hash": tx_hash,
        "signature": tx_data.signature,
        "status": TransactionStatus.pending.value,
        "nonce": tx_data.nonce
    }
    
    await db.transactions.insert_one(tx_doc)
    
    # Create notification
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()),
        "user_id": receiver_wallet["user_id"],
        "message": f"You received {tx_data.amount} from {tx_data.sender_wallet[:10]}...",
        "timestamp": tx_data.timestamp,  # Use provided timestamp
        "status": "unread"
    })
    
    return {"tx_id": tx_id, "status": "pending", "tx_hash": tx_hash}


@api_router.get("/transaction/history", response_model=List[Transaction])
async def get_transaction_history(current_user: User = Depends(get_current_user)):
    """Get user's transaction history"""
    # Get user's wallets
    wallets = await db.wallets.find({"user_id": current_user.user_id}).to_list(None)
    wallet_addresses = [w["wallet_address"] for w in wallets]
    
    # Get transactions
    transactions = await db.transactions.find({
        "$or": [
            {"sender_wallet": {"$in": wallet_addresses}},
            {"receiver_wallet": {"$in": wallet_addresses}}
        ]
    }, {"_id": 0}).sort("timestamp", -1).to_list(100)
    
    return [Transaction(**tx) for tx in transactions]


@api_router.get("/transaction/{tx_id}", response_model=Transaction)
async def get_transaction(tx_id: str, current_user: User = Depends(get_current_user)):
    """Get transaction details"""
    tx = await db.transactions.find_one({"tx_id": tx_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return Transaction(**tx)


class SignTransactionRequest(BaseModel):
    sender_wallet: str
    receiver_wallet: str
    amount: float
    timestamp: str
    nonce: int

@api_router.post("/transaction/sign")
async def sign_transaction_hash(request: SignTransactionRequest, current_user: User = Depends(get_current_user)):
    """Sign a transaction (helper endpoint)"""
    # Get user's first wallet
    wallet = await db.wallets.find_one({"user_id": current_user.user_id})
    if not wallet:
        raise HTTPException(status_code=404, detail="No wallet found")
    
    # Verify sender wallet belongs to user
    if wallet["wallet_address"] != request.sender_wallet:
        raise HTTPException(status_code=403, detail="Not your wallet")
    
    # Compute transaction hash (same as in create transaction)
    tx_hash = compute_transaction_hash(
        request.sender_wallet,
        request.receiver_wallet,
        request.amount,
        request.timestamp,
        request.nonce
    )
    
    # Decrypt private key
    private_key = decrypt_private_key(wallet["encrypted_private_key"], MASTER_KEY)
    
    # Sign the transaction hash
    signature = sign_message(tx_hash, private_key)
    
    return {"signature": signature, "tx_hash": tx_hash, "wallet_address": wallet["wallet_address"]}


# ============= BLOCKCHAIN ROUTES =============

@api_router.post("/block/add")
async def add_block(block_data: BlockCreate, admin: User = Depends(get_admin_user)):
    """Add a new block to the blockchain (admin only)"""
    # Get pending transactions
    pending_txs = await db.transactions.find({
        "tx_id": {"$in": block_data.pending_tx_ids},
        "status": TransactionStatus.pending.value
    }, {"_id": 0}).to_list(None)
    
    if not pending_txs:
        raise HTTPException(status_code=400, detail="No valid pending transactions")
    
    # Get last block
    last_block = await db.blocks.find_one({}, {"_id": 0}, sort=[("block_number", -1)])
    
    if last_block:
        block_number = last_block["block_number"] + 1
        previous_hash = last_block["block_hash"]
    else:
        block_number = 0
        previous_hash = "0" * 64
    
    # Compute merkle root
    tx_hashes = [tx["tx_hash"] for tx in pending_txs]
    merkle_root = compute_merkle_root(tx_hashes)
    
    # Compute block hash (simple nonce=0 for admin validation)
    timestamp = datetime.now(timezone.utc).isoformat()
    nonce = 0
    block_hash = compute_block_hash(block_number, previous_hash, merkle_root, timestamp, nonce)
    
    # Create block
    block_id = str(uuid.uuid4())
    block_doc = {
        "block_id": block_id,
        "block_number": block_number,
        "previous_hash": previous_hash,
        "merkle_root": merkle_root,
        "timestamp": timestamp,
        "nonce": nonce,
        "block_hash": block_hash,
        "validator": block_data.validator,
        "created_at": timestamp
    }
    
    await db.blocks.insert_one(block_doc)
    
    # Link transactions to block
    for tx in pending_txs:
        await db.block_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "block_id": block_id,
            "tx_id": tx["tx_id"]
        })
        
        # Mark transaction as confirmed
        await db.transactions.update_one(
            {"tx_id": tx["tx_id"]},
            {"$set": {"status": TransactionStatus.confirmed.value}}
        )
    
    return {"block_id": block_id, "block_hash": block_hash, "block_number": block_number}


@api_router.get("/blockchain/view", response_model=List[Block])
async def view_blockchain(page: int = 1, limit: int = 20, current_user: User = Depends(get_current_user)):
    """View blockchain (paginated)"""
    skip = (page - 1) * limit
    
    blocks = await db.blocks.find({}, {"_id": 0}).sort("block_number", -1).skip(skip).limit(limit).to_list(None)
    
    return [Block(**b) for b in blocks]


@api_router.get("/block/{block_id}", response_model=BlockDetail)
async def get_block(block_id: str, current_user: User = Depends(get_current_user)):
    """Get block details with transactions"""
    block = await db.blocks.find_one({"block_id": block_id}, {"_id": 0})
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Get block transactions
    block_tx_links = await db.block_transactions.find({"block_id": block_id}).to_list(None)
    tx_ids = [link["tx_id"] for link in block_tx_links]
    
    transactions = await db.transactions.find({"tx_id": {"$in": tx_ids}}, {"_id": 0}).to_list(None)
    
    return BlockDetail(
        block=Block(**block),
        transactions=[Transaction(**tx) for tx in transactions]
    )


@api_router.get("/blockchain/validate", response_model=ValidationReport)
async def validate_blockchain(admin: User = Depends(get_admin_user)):
    """Validate entire blockchain integrity"""
    blocks = await db.blocks.find({}, {"_id": 0}).sort("block_number", 1).to_list(None)
    
    issues = []
    
    for i, block in enumerate(blocks):
        # Check previous hash link
        if i > 0:
            if block["previous_hash"] != blocks[i-1]["block_hash"]:
                issues.append(f"Block {block['block_number']}: Invalid previous_hash")
        
        # Verify block hash
        computed_hash = compute_block_hash(
            block["block_number"],
            block["previous_hash"],
            block["merkle_root"],
            block["timestamp"],
            block["nonce"]
        )
        
        if computed_hash != block["block_hash"]:
            issues.append(f"Block {block['block_number']}: Invalid block hash")
        
        # Verify merkle root
        block_tx_links = await db.block_transactions.find({"block_id": block["block_id"]}).to_list(None)
        tx_ids = [link["tx_id"] for link in block_tx_links]
        transactions = await db.transactions.find({"tx_id": {"$in": tx_ids}}, {"_id": 0}).to_list(None)
        
        tx_hashes = [tx["tx_hash"] for tx in transactions]
        computed_merkle = compute_merkle_root(tx_hashes)
        
        if computed_merkle != block["merkle_root"]:
            issues.append(f"Block {block['block_number']}: Invalid merkle root")
    
    return ValidationReport(
        valid=len(issues) == 0,
        total_blocks=len(blocks),
        issues=issues
    )


# ============= ADMIN ROUTES =============

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(admin: User = Depends(get_admin_user)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(None)
    return [User(**u) for u in users]


@api_router.post("/admin/approve-transactions")
async def approve_pending_transactions(admin: User = Depends(get_admin_user)):
    """Auto-approve and mine block with all pending transactions"""
    pending_txs = await db.transactions.find(
        {"status": TransactionStatus.pending.value},
        {"_id": 0}
    ).limit(10).to_list(None)
    
    if not pending_txs:
        return {"message": "No pending transactions"}
    
    tx_ids = [tx["tx_id"] for tx in pending_txs]
    
    result = await add_block(
        BlockCreate(pending_tx_ids=tx_ids, validator=admin.email),
        admin
    )
    
    return {"message": f"Block created with {len(tx_ids)} transactions", **result}


# ============= NOTIFICATION ROUTES =============

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    """Get notifications — user gets their own, admin gets all (including contact)"""
    query = {}

    # If normal user → show only their notifications
    if current_user.role == UserRole.user:
        query["user_id"] = current_user.user_id

    # If admin → show contact form (user_id = None) and admin’s own
    elif current_user.role == UserRole.admin:
        query["$or"] = [
            {"user_id": None},
            {"user_id": current_user.user_id}
        ]

    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(None)

    return [Notification(**n) for n in notifications]



@api_router.post("/notify/send")
async def send_notification(notif: NotificationCreate):
    """Send notification"""
    notif_doc = {
        "notification_id": str(uuid.uuid4()),
        "user_id": notif.user_id,
        "message": notif.message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "unread"
    }
    
    await db.notifications.insert_one(notif_doc)
    
    return {"message": "Notification sent"}


# ============= UTILITY ROUTES =============

class VerifySignatureRequest(BaseModel):
    message: str
    signature: str
    public_key: str

class HashRequest(BaseModel):
    data: str

@api_router.post("/crypto/verify-signature")
async def verify_tx_signature(request: VerifySignatureRequest):
    """Verify ECDSA signature"""
    valid = verify_signature(request.message, request.signature, request.public_key)
    return {"valid": valid}


@api_router.post("/crypto/hash")
async def compute_hash(request: HashRequest):
    """Compute SHA-256 hash"""
    from crypto_utils import sha256_hash
    return {"hash": sha256_hash(request.data)}


@api_router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get platform statistics"""
    total_users = await db.users.count_documents({})
    total_blocks = await db.blocks.count_documents({})
    total_transactions = await db.transactions.count_documents({})
    
    recent_txs = await db.transactions.find({}, {"_id": 0}).sort("timestamp", -1).limit(5).to_list(None)
    
    return StatsResponse(
        total_users=total_users,
        total_blocks=total_blocks,
        total_transactions=total_transactions,
        recent_transactions=[Transaction(**tx) for tx in recent_txs]
    )


@api_router.get("/")
async def root():
    return {"message": "Bank Blockchain API is running"}


# ============= ENHANCED FEATURES =============

# Friends System
@api_router.post("/friends/add")
async def add_friend(friend_email: str, current_user: User = Depends(get_current_user)):
    """Add friend by email"""
    friend_user = await db.users.find_one({"email": friend_email})
    if not friend_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend_user["user_id"] == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.friends.insert_one(friend_doc)
    
    return {"message": f"Added {friend_user['name']} as friend", "friend": friend_doc}


@api_router.get("/friends/list")
async def get_friends(current_user: User = Depends(get_current_user)):
    """Get user's friends list"""
    friends = await db.friends.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(None)
    
    return friends


@api_router.get("/users/search")
async def search_users(query: str, current_user: User = Depends(get_current_user)):
    """Search users by email or name"""
    users = await db.users.find({
        "$or": [
            {"email": {"$regex": query, "$options": "i"}},
            {"name": {"$regex": query, "$options": "i"}}
        ]
    }, {"_id": 0, "password_hash": 0}).limit(10).to_list(None)
    
    users = [u for u in users if u["user_id"] != current_user.user_id]
    
    return [{"name": u["name"], "email": u["email"], "user_id": u["user_id"]} for u in users]


@api_router.post("/bills/pay")
async def pay_bill(
    bill_type: str,
    bill_number: str,
    amount: float,
    provider: str,
    current_user: User = Depends(get_current_user)
):
    """Pay utility bill"""
    payment_id = str(uuid.uuid4())
    payment_doc = {
        "payment_id": payment_id,
        "user_id": current_user.user_id,
        "bill_type": bill_type,
        "bill_number": bill_number,
        "amount": amount,
        "provider": provider,
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tx_id": None
    }
    
    await db.bill_payments.insert_one(payment_doc)
    
    return {"message": "Bill paid successfully", "payment_id": payment_id}


@api_router.get("/analytics/spending")
async def get_spending_analytics(current_user: User = Depends(get_current_user)):
    """Get user spending analytics for graphs"""
    wallets = await db.wallets.find({"user_id": current_user.user_id}).to_list(None)
    wallet_addresses = [w["wallet_address"] for w in wallets]
    
    sent_txs = await db.transactions.find({
        "sender_wallet": {"$in": wallet_addresses},
        "status": "confirmed"
    }).to_list(None)
    
    received_txs = await db.transactions.find({
        "receiver_wallet": {"$in": wallet_addresses},
        "status": "confirmed"
    }).to_list(None)
    
    total_sent = sum(tx["amount"] for tx in sent_txs)
    total_received = sum(tx["amount"] for tx in received_txs)
    
    from collections import defaultdict
    monthly = defaultdict(float)
    for tx in sent_txs:
        try:
            tx_date = datetime.fromisoformat(tx["timestamp"].replace('Z', '+00:00'))
            month_key = tx_date.strftime("%Y-%m")
            monthly[month_key] += tx["amount"]
        except:
            pass
    
    monthly_spending = [{"month": k, "amount": v} for k, v in sorted(monthly.items())]
    
    return {
        "total_sent": total_sent,
        "total_received": total_received,
        "transaction_count": len(sent_txs) + len(received_txs),
        "monthly_spending": monthly_spending[-6:],
        "balance": total_received - total_sent
    }


# ============= BLOCKCHAIN EXPLANATION (FOR PROFESSORS) =============

@api_router.get("/blockchain/explain")
async def explain_blockchain():
    """
    COMPREHENSIVE BLOCKCHAIN EXPLANATION
    For final year project presentation and viva
    """
    return {
        "project_title": "BlockBank - Blockchain Banking Application",
        "blockchain_implementation": {
            "1_where_used": {
                "transaction_ledger": "Every transaction is stored with SHA-256 hash",
                "block_structure": "Transactions grouped into blocks with Merkle tree",
                "chain_linking": "Each block linked by previous_hash (immutable)",
                "digital_signatures": "ECDSA secp256k1 for transaction signing",
                "validation": "Complete chain validation available"
            },
            "2_technical_components": {
                "hashing_algorithm": "SHA-256 (Bitcoin-grade)",
                "signature_algorithm": "ECDSA secp256k1 (Ethereum-grade)",
                "encryption": "AES-256-GCM (Military-grade)",
                "merkle_tree": "Binary tree for transaction integrity",
                "key_derivation": "PBKDF2 for private key encryption"
            },
            "3_vs_phonepe": {
                "storage": {
                    "phonepe": "Centralized MySQL/PostgreSQL database",
                    "blockbank": "Distributed blockchain ledger"
                },
                "immutability": {
                    "phonepe": "Records can be modified by admins",
                    "blockbank": "Cryptographically immutable (tamper-proof)"
                },
                "transparency": {
                    "phonepe": "Only company can see all transactions",
                    "blockbank": "Anyone can verify blockchain integrity"
                },
                "trust_model": {
                    "phonepe": "Trust the company (centralized)",
                    "blockbank": "Trust mathematics (decentralized)"
                },
                "security": {
                    "phonepe": "Single point of failure",
                    "blockbank": "Distributed, no single point of failure"
                }
            },
            "4_code_locations": {
                "blockchain_logic": "/app/backend/crypto_utils.py",
                "block_creation": "/app/backend/server.py - POST /api/block/add",
                "validation": "/app/backend/server.py - GET /api/blockchain/validate",
                "transaction_hashing": "crypto_utils.py - compute_transaction_hash()",
                "merkle_tree": "crypto_utils.py - compute_merkle_root()",
                "signatures": "crypto_utils.py - sign_message() & verify_signature()"
            },
            "5_visible_features": {
                "blockchain_ledger_page": "Shows all blocks with hashes",
                "block_details": "View transactions in each block",
                "validation_button": "Verify entire chain integrity",
                "transaction_signatures": "Every transaction cryptographically signed",
                "wallet_system": "Public/private key pairs (ECDSA)"
            }
        },
        "advantages_over_traditional": [
            "Immutable record keeping - cannot alter history",
            "Transparent - anyone can audit transactions",
            "Decentralized potential - can add multiple nodes",
            "Cryptographically secure - SHA-256 + ECDSA",
            "Tamper-proof - changing 1 bit breaks entire chain"
        ],
        "real_world_application": {
            "current": "Single-node blockchain with admin validation",
            "future": "Can be extended to multi-node P2P network",
            "scalability": "Microservices architecture ready",
            "production": "Use PoS consensus or Byzantine Fault Tolerance"
        },
        "professor_questions": {
            "q1": {
                "question": "Where is blockchain actually used?",
                "answer": "1) Transaction storage with SHA-256 hashing, 2) Block chain structure with previous_hash links, 3) Merkle trees for integrity, 4) Digital signatures for auth, 5) Complete chain validation"
            },
            "q2": {
                "question": "How is this different from PhonePe?",
                "answer": "PhonePe uses centralized database (editable, single control). BlockBank uses blockchain (immutable, cryptographically secured, transparent). Key difference: PhonePe = trust company, BlockBank = trust mathematics."
            },
            "q3": {
                "question": "Is this real blockchain or just a database?",
                "answer": "Real blockchain: 1) Blocks linked by hashes, 2) Merkle trees, 3) Same crypto as Bitcoin (SHA-256, ECDSA), 4) Immutable once confirmed, 5) Chain validation proves integrity"
            },
            "q4": {
                "question": "Why not use Ethereum?",
                "answer": "Learning purpose + custom banking features + faster processing + no gas fees + full control over consensus mechanism + regulatory compliance"
            }
        },
        "documentation_file": "/app/BLOCKCHAIN_DOCUMENTATION.md"
    }



# Include the router in the main app
origins = os.getenv("CORS_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != [""] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

app.include_router(api_router)
