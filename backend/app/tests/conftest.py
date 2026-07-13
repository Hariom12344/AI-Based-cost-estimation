import pytest
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_db
from app.core.database import Base
from app.services.auth_service import auth_service

# SQLite in-memory database for testing purposes
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db() -> Generator:
    """Create a clean database session for each test function."""
    Base.metadata.create_all(bind=engine)
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db) -> Generator[TestClient, None, None]:
    """Test client with database dependency override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def normal_user(db) -> dict:
    """Fixture to insert a normal engineer user in the database."""
    username = "engineer_bob"
    email = "bob@intellicam.ai"
    password = "BobPassword123!"
    user = auth_service.register_user(
        db, username=username, email=email, password=password, role="engineer"
    )
    return {"user": user, "username": username, "email": email, "password": password}

@pytest.fixture(scope="function")
def admin_user(db) -> dict:
    """Fixture to insert an admin user in the database."""
    username = "admin_alice"
    email = "alice@intellicam.ai"
    password = "AlicePassword123!"
    user = auth_service.register_user(
        db, username=username, email=email, password=password, role="admin"
    )
    return {"user": user, "username": username, "email": email, "password": password}
