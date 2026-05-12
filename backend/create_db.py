import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def create_initial_db():
    uri = os.getenv("MONGODB_ATLAS_URI")
    db_name = os.getenv("MONGODB_DB_NAME", "omnidesk")
    coll_name = os.getenv("MONGODB_COLLECTION_NAME", "documents")

    print(f"Connecting to MongoDB...")
    client = MongoClient(uri, tls=True, tlsCAFile=certifi.where())
    
    db = client[db_name]
    collection = db[coll_name]
    
    # Insert a dummy document to force creation of the DB and Collection
    print(f"Creating database '{db_name}' and collection '{coll_name}'...")
    collection.insert_one({"initialization": "OmniDesk setup"})
    
    # Delete the dummy document to keep it clean
    collection.delete_one({"initialization": "OmniDesk setup"})
    
    print("DONE: Successfully created database and collection!")
    client.close()

if __name__ == "__main__":
    create_initial_db()
