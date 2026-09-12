from sqlalchemy import create_engine, inspect, text

from sqlalchemy.orm import sessionmaker, declarative_base


DATABASE_URL = "sqlite:///./reguai.db"


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def migrate_database():

    """
    Apply small SQLite schema updates that SQLAlchemy's
    create_all() does not perform automatically.

    Existing data is preserved.
    """

    inspector = inspect(engine)

    tables = inspector.get_table_names()

    if "compliance_evidence" not in tables:
        return

    columns = [
        column["name"]
        for column in inspector.get_columns(
            "compliance_evidence"
        )
    ]

    if "check_run_id" not in columns:

        with engine.begin() as connection:

            connection.execute(
                text(
                    """
                    ALTER TABLE compliance_evidence
                    ADD COLUMN check_run_id VARCHAR
                    """
                )
            )

        with engine.begin() as connection:

            connection.execute(
                text(
                    """
                    UPDATE compliance_evidence
                    SET check_run_id = 'legacy-' || id
                    WHERE check_run_id IS NULL
                    """
                )
            )


migrate_database()