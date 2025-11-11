import hashlib
import ecdsa
import secrets
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Random import get_random_bytes
import base64
from typing import Tuple
import json


def generate_keypair() -> Tuple[str, str]:
    """Generate ECDSA keypair (secp256k1)"""
    signing_key = ecdsa.SigningKey.generate(curve=ecdsa.SECP256k1)
    verifying_key = signing_key.get_verifying_key()
    
    private_key = signing_key.to_string().hex()
    public_key = verifying_key.to_string().hex()
    
    return public_key, private_key


def sign_message(message: str, private_key_hex: str) -> str:
    """Sign a message with ECDSA private key"""
    private_key_bytes = bytes.fromhex(private_key_hex)
    signing_key = ecdsa.SigningKey.from_string(private_key_bytes, curve=ecdsa.SECP256k1)
    
    signature = signing_key.sign(message.encode())
    return signature.hex()


def verify_signature(message: str, signature_hex: str, public_key_hex: str) -> bool:
    """Verify ECDSA signature"""
    try:
        public_key_bytes = bytes.fromhex(public_key_hex)
        verifying_key = ecdsa.VerifyingKey.from_string(public_key_bytes, curve=ecdsa.SECP256k1)
        
        signature_bytes = bytes.fromhex(signature_hex)
        verifying_key.verify(signature_bytes, message.encode())
        return True
    except:
        return False


def encrypt_private_key(private_key: str, master_key: str) -> str:
    """Encrypt private key with master key using AES-256"""
    # Derive 32-byte key from master key
    salt = get_random_bytes(16)
    key = PBKDF2(master_key, salt, dkLen=32)
    
    # Encrypt
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(private_key.encode())
    
    # Combine salt, nonce, tag, and ciphertext
    result = base64.b64encode(
        salt + cipher.nonce + tag + ciphertext
    ).decode('utf-8')
    
    return result


def decrypt_private_key(encrypted_key: str, master_key: str) -> str:
    """Decrypt private key"""
    data = base64.b64decode(encrypted_key)
    
    # Extract components
    salt = data[:16]
    nonce = data[16:32]
    tag = data[32:48]
    ciphertext = data[48:]
    
    # Derive key
    key = PBKDF2(master_key, salt, dkLen=32)
    
    # Decrypt
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    private_key = cipher.decrypt_and_verify(ciphertext, tag)
    
    return private_key.decode('utf-8')


def sha256_hash(data: str) -> str:
    """Compute SHA-256 hash"""
    return hashlib.sha256(data.encode()).hexdigest()


def compute_merkle_root(tx_hashes: list) -> str:
    """Compute merkle root from transaction hashes"""
    if not tx_hashes:
        return sha256_hash("")
    
    if len(tx_hashes) == 1:
        return tx_hashes[0]
    
    # Make sure we have even number of hashes
    if len(tx_hashes) % 2 != 0:
        tx_hashes.append(tx_hashes[-1])
    
    # Build merkle tree
    while len(tx_hashes) > 1:
        new_level = []
        for i in range(0, len(tx_hashes), 2):
            combined = tx_hashes[i] + tx_hashes[i + 1]
            new_level.append(sha256_hash(combined))
        tx_hashes = new_level
    
    return tx_hashes[0]


def compute_transaction_hash(sender: str, receiver: str, amount: float, timestamp: str, nonce: int) -> str:
    """Compute transaction hash"""
    tx_data = f"{sender}{receiver}{amount}{timestamp}{nonce}"
    return sha256_hash(tx_data)


def compute_block_hash(index: int, previous_hash: str, merkle_root: str, timestamp: str, nonce: int) -> str:
    """Compute block hash"""
    block_data = f"{index}{previous_hash}{merkle_root}{timestamp}{nonce}"
    return sha256_hash(block_data)
