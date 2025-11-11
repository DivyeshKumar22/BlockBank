from pymongo import MongoClient
from datetime import datetime
import uuid
import bcrypt
import os

# Load environment variables if needed
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://blockuser:block1234@cluster0.dcjzsdb.mongodb.net/?appName=Cluster0")
DB_NAME = os.getenv("DB_NAME", "bank_blockchain_db")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Admin credentials
admin_name = "Admin"
admin_email = "admin@blockbank.com"
admin_password = "admin123"

# Hash password
hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Check if admin already exists
existing_admin = db.users.find_one({"email": admin_email})

if existing_admin:
    print("✅ Admin already exists.")
else:
    admin_data = {
        "user_id": str(uuid.uuid4()),
        "name": admin_name,
        "email": admin_email,
        "password": hashed_password,
        "role": "admin",
        "created_at": datetime.now().isoformat()
    }
    db.users.insert_one(admin_data)
    print("✅ Admin created successfully!")
    print(f"📧 Email: {admin_email}")
    print(f"🔑 Password: {admin_password}")
