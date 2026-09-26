import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.services.generator_service import seed_database


def main():
    print("Recreating database schema with updated indexes and constraints...")
    import app.models  # noqa
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding synthetic bank digital twin data...")
        stats = seed_database(db, n_customers=5000)
        print(f"Success! Generated: {stats}")
    finally:
        db.close()


if __name__ == "__main__":
    main()