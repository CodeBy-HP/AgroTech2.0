from sqlalchemy import create_engine
from models import Base

# Connect to the database
print("Connecting to database...")
engine = create_engine('sqlite:///test.db', echo=True)

# Drop all tables
print("Dropping all tables...")
Base.metadata.drop_all(engine)

# Create all tables
print("Creating all tables...")
Base.metadata.create_all(engine)

print("Database schema updated successfully.") 