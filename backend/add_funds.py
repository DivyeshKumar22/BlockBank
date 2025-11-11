#!/usr/bin/env python3
"""
BlockBank - Add Funds Script
Usage: python3 add_funds.py <email> <amount>
Example: python3 add_funds.py john@example.com 1000
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import uuid
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, '/app/backend')
from crypto_utils import compute_transaction_hash


async def add_funds(email: str, amount: float):
    """Add funds to a user account via genesis transaction"""
    client = AsyncIOMotorClient("mongodb+srv://blockuser:block1234@cluster0.dcjzsdb.mongodb.net/?appName=Cluster0")
    db = client["bank_blockchain_db"]
    
    try:
        # Get user and wallet
        user = await db.users.find_one({"email": email})
        if not user:
            print(f"❌ Error: User '{email}' not found")
            print("\n💡 Tip: User must be registered first")
            return False
        
        wallet = await db.wallets.find_one({"user_id": user["user_id"]})
        if not wallet:
            print(f"❌ Error: Wallet not found for '{email}'")
            return False
        
        # Create funding transaction from genesis wallet
        genesis_wallet = "0" * 128
        timestamp = datetime.now(timezone.utc).isoformat()
        nonce = int(datetime.now(timezone.utc).timestamp() * 1000)
        
        tx_hash = compute_transaction_hash(
            genesis_wallet, 
            wallet["wallet_address"], 
            amount, 
            timestamp, 
            nonce
        )
        
        tx_doc = {
            "tx_id": str(uuid.uuid4()),
            "sender_wallet": genesis_wallet,
            "receiver_wallet": wallet["wallet_address"],
            "amount": float(amount),
            "timestamp": timestamp,
            "tx_hash": tx_hash,
            "signature": "genesis_funding",
            "status": "confirmed",
            "nonce": nonce
        }
        
        await db.transactions.insert_one(tx_doc)
        
        # Calculate new balance
        received = await db.transactions.find({
            "receiver_wallet": wallet["wallet_address"],
            "status": "confirmed"
        }).to_list(None)
        
        sent = await db.transactions.find({
            "sender_wallet": wallet["wallet_address"],
            "status": "confirmed"
        }).to_list(None)
        
        new_balance = sum(tx["amount"] for tx in received) - sum(tx["amount"] for tx in sent)
        
        print("\n✅ Funds Added Successfully!")
        print("=" * 60)
        print(f"📧 Email:          {email}")
        print(f"👤 Name:           {user['name']}")
        print(f"💰 Amount Added:   ${amount:,.2f}")
        print(f"💳 New Balance:    ${new_balance:,.2f}")
        print(f"🆔 Transaction:    {tx_doc['tx_id']}")
        print(f"📝 Status:         confirmed")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        client.close()


async def list_users():
    """List all users and their current balances"""
    client = AsyncIOMotorClient("mongodb+srv://blockuser:block1234@cluster0.dcjzsdb.mongodb.net/?appName=Cluster0")
    db = client["bank_blockchain_db"]
    
    try:
        users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(None)
        
        print("\n" + "=" * 90)
        print(f"{'Name':<20} {'Email':<40} {'Balance':>15}")
        print("=" * 90)
        
        for user in users:
            wallet = await db.wallets.find_one({"user_id": user["user_id"]})
            if not wallet:
                continue
            
            received = await db.transactions.find({
                "receiver_wallet": wallet["wallet_address"],
                "status": "confirmed"
            }).to_list(None)
            
            sent = await db.transactions.find({
                "sender_wallet": wallet["wallet_address"],
                "status": "confirmed"
            }).to_list(None)
            
            balance = sum(tx["amount"] for tx in received) - sum(tx["amount"] for tx in sent)
            
            print(f"{user['name']:<20} {user['email']:<40} ${balance:>14,.2f}")
        
        print("=" * 90)
        
    finally:
        client.close()


def print_usage():
    """Print usage instructions"""
    print("\n🏦 BlockBank - Add Funds Tool")
    print("=" * 60)
    print("\nUsage:")
    print("  python3 add_funds.py <email> <amount>")
    print("  python3 add_funds.py --list               (show all users)")
    print("\nExamples:")
    print("  python3 add_funds.py john@example.com 1000")
    print("  python3 add_funds.py admin@blockbank.com 5000")
    print("  python3 add_funds.py --list")
    print()


def main():
    """Main entry point"""
    if len(sys.argv) == 1:
        print_usage()
        return
    
    if sys.argv[1] == "--list" or sys.argv[1] == "-l":
        asyncio.run(list_users())
        return
    
    if len(sys.argv) != 3:
        print("❌ Error: Invalid number of arguments")
        print_usage()
        return
    
    email = sys.argv[1]
    
    try:
        amount = float(sys.argv[2])
        if amount <= 0:
            print("❌ Error: Amount must be positive")
            return
    except ValueError:
        print("❌ Error: Amount must be a valid number")
        return
    
    asyncio.run(add_funds(email, amount))


if __name__ == "__main__":
    main()
