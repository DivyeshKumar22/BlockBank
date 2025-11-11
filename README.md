# BlockBank - Blockchain Banking Platform

A production-ready blockchain-powered banking application with secure transactions, wallet management, and admin controls.

## Features

### Core Functionality
- User Registration & Authentication (JWT + bcrypt)
- Automatic ECDSA Wallet Generation
- Cryptographically Signed Transactions
- Blockchain Ledger with Merkle Trees
- Admin Dashboard & Controls
- Real-time Platform Statistics

### Security
- Bcrypt password hashing
- AES-256 private key encryption
- ECDSA digital signatures (secp256k1)
- SHA-256 hashing for blocks/transactions
- JWT authentication (24-hour expiration)

## Tech Stack

**Backend:** FastAPI, MongoDB, Motor, ECDSA, Pycryptodome
**Frontend:** React 19, Shadcn UI, Tailwind CSS, Axios

## Quick Start

### Backend
```bash
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd /app/frontend
yarn install
yarn start
```

## Test Credentials

**User:** john@example.com / password123 (Balance: 1000.0)
**Admin:** admin@blockbank.com / admin123 (Balance: 10000.0)

## API Endpoints

### Authentication
- POST /api/register - Register user
- POST /api/login - Login user
- POST /api/logout - Logout

### Wallet
- GET /api/wallet/balance - Get balance
- GET /api/wallet/my-wallets - Get user wallets
- GET /api/wallet/{address}/transactions - Transaction history

### Transactions
- POST /api/transaction/create - Create transaction
- GET /api/transaction/{tx_id} - Get transaction
- GET /api/transaction/history - User history
- POST /api/transaction/sign - Sign transaction

### Blockchain
- POST /api/block/add - Add block (admin)
- GET /api/blockchain/view - View blockchain
- GET /api/block/{block_id} - Block details
- GET /api/blockchain/validate - Validate chain

### Admin
- GET /api/admin/users - List users
- POST /api/admin/approve-transactions - Approve pending

### Stats
- GET /api/stats - Platform statistics

## Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI app
│   ├── models.py          # Pydantic models
│   ├── auth_utils.py      # Auth helpers
│   ├── crypto_utils.py    # Crypto functions
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── pages/
    │   └── components/
    └── package.json
```

## License

MIT License
