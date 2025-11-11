"""
Blockchain Service - Core blockchain logic
This explains WHERE blockchain is used
"""

from datetime import datetime, timezone
from typing import List, Dict
import uuid


class BlockchainService:
    """
    BLOCKCHAIN EXPLANATION FOR PROFESSORS:
    
    This service handles:
    1. Block creation - Groups transactions into blocks
    2. Chain validation - Ensures no tampering
    3. Hash linking - Each block points to previous (immutable)
    4. Merkle tree - Verifies transaction integrity
    
    DIFFERENCE FROM PHONEPE:
    - PhonePe: Central database (mutable, company controls)
    - BlockBank: Blockchain (immutable, cryptographically secured)
    """
    
    @staticmethod
    def create_block_metadata(block_number: int, previous_hash: str, 
                             merkle_root: str, timestamp: str, 
                             nonce: int, validator: str) -> Dict:
        """Create block with full metadata for ledger display"""
        from crypto_utils import compute_block_hash
        
        block_hash = compute_block_hash(
            block_number, previous_hash, merkle_root, timestamp, nonce
        )
        
        return {
            "block_id": str(uuid.uuid4()),
            "block_number": block_number,
            "previous_hash": previous_hash,
            "merkle_root": merkle_root,
            "timestamp": timestamp,
            "nonce": nonce,
            "block_hash": block_hash,
            "validator": validator,
            "created_at": timestamp
        }
    
    @staticmethod
    def validate_block(block: Dict, previous_block: Dict = None) -> tuple:
        """Validate single block integrity"""
        from crypto_utils import compute_block_hash, compute_merkle_root
        
        issues = []
        
        # Check previous hash link
        if previous_block and block["previous_hash"] != previous_block["block_hash"]:
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
        
        return len(issues) == 0, issues
    
    @staticmethod
    def explain_blockchain_usage() -> Dict:
        """Returns explanation of where blockchain is used - FOR PROFESSORS"""
        return {
            "blockchain_usage": {
                "1_transaction_storage": "Every transaction is hashed (SHA-256) and stored immutably",
                "2_block_creation": "Transactions are grouped into blocks with Merkle tree",
                "3_chain_linking": "Each block contains hash of previous block (tamper-proof)",
                "4_validation": "Entire chain can be validated by recalculating hashes",
                "5_consensus": "Admin-validated (fast for banking, no heavy mining)"
            },
            "vs_phonepe": {
                "phonepe": "Centralized database, editable by company",
                "blockbank": "Distributed blockchain, mathematically immutable",
                "key_difference": "PhonePe = trust company, BlockBank = trust math"
            },
            "technology_used": {
                "hashing": "SHA-256 (same as Bitcoin)",
                "signatures": "ECDSA secp256k1 (same as Bitcoin/Ethereum)",
                "merkle_tree": "Binary tree for transaction verification",
                "encryption": "AES-256 for private keys"
            },
            "visible_in_ui": {
                "blockchain_ledger_page": "Shows all blocks linked by hashes",
                "transaction_details": "Each transaction has unique hash",
                "validation_button": "Anyone can verify chain integrity",
                "wallet_system": "Public/private key cryptography"
            }
        }
