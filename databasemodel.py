from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Integer, String, Column

base = declarative_base()


class user(base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
