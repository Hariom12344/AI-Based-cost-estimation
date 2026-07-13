import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

TEST_DB = "sqlite:///./test_intellicam.db"


@pytest.fixture(scope="session", autouse=True)
def clean_db_file() -> Generator[None, None, None]:
    if os.path.exists("test_intellicam.db"):
        os.remove("test_intellicam.db")
    yield
    if os.path.exists("test_intellicam.db"):
        os.remove("test_intellicam.db")


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(TEST_DB, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
