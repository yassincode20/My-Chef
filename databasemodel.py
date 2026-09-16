from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Integer, String, Column, ForeignKey

base = declarative_base()


class user(base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)


class User_Prefrences(base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    diet_type = Column(String, nullable=False)
    allergies = Column(String, nullable=False)


class recipe_info(base):
    __tablename__ = "recipe_info"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    recipe = Column(String, nullable=False)
