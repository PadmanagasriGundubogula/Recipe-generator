# db.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime


load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")

client = MongoClient(MONGO_URI)
db = client["recipe_db"]




# plus any others you already use:
# default_items, custom_ingredients, etc.

# Collections
selections_collection = db["selections"]
usrs_collection = db["usrs"]          # recipe usrs
collection = db["options"]
sentences_collection = db["sentences"]
recipes_collection      = db["recipes"]
graphs_collection       = db["graphs"]
instructions_collection = db["instructions"]
recipe_options = db["recipe_opt"]
custom_ingredients = db["custom_ingredients"]
custom_actions = db["custom_actions"]
custom_descriptors = db["custom_descriptors"]
custom_others = db["custom_others"]
users = db["users"]
default_items = db["default_items"]
