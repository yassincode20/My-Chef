from fastapi import FastAPI, Depends
import databasemodel
from database import engine, session
from usermodel import User
import bcrypt
from sqlalchemy.exc import IntegrityError

app = FastAPI()
databasemodel.base.metadata.create_all(bind=engine)


def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()


@app.get("/register")
def server_status():
    return {"succes"}


@app.post("/register")
def creat_user(user: User, db=Depends(get_db)):
    try:
        hashed_password = bcrypt.hashpw(
            user.password.encode("utf-8"), bcrypt.gensalt(12)
        )
        new_user = databasemodel.user(
            username=user.user_name,
            name=user.name,
            email=user.email,
            password_hash=hashed_password.decode("utf-8"),
        )
        db.add(new_user)
        db.commit()
        return f"user info: {new_user.id} {new_user.name}"
    except IntegrityError:
        db.rollback()
        return {"error": "Username or email already exists"}
