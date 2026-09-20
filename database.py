from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DB_URL")

url = DB_URL
engine = create_engine(url)
session = sessionmaker(autoflush=False, autocommit=False, bind=engine)
