import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

uri = os.getenv("MONGODB_URI")
print(f"Connecting to MongoDB at {uri}")
conn = AsyncIOMotorClient(uri)

try:
    # Ping the database to verify connection
    conn.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
    
db = conn['myapp']

#collections
userCollection = db['user']
apiAnalyticsCollection = db['apiAnalytics']