import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

uri = os.getenv("MONGODB_URI")
print(f"Connecting to MongoDB at {uri}")
conn = MongoClient(uri)

try:
    conn.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
    
db = conn['myapp']

#collections
userCollection = db['user']
apiAnalyticsCollection = db['apiAnalytics']