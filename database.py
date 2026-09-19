from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

url = "postgresql://postgres:password@localhost:5432/mychef"
engine = create_engine(url)
session = sessionmaker(autoflush=False, autocommit=False, bind=engine)
