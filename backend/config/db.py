import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()
uri = os.getenv("MONGODB_URI")
client = MongoClient(uri, server_api=ServerApi("1"))

try:
    client.admin.command("ping")
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
    
db = client.profileDB
collection_name = db[]
