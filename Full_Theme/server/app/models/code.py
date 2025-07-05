from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship, Session
from sqlalchemy.event import listen
import datetime
from app.db.session import Base
from app.models.codebook import Codebook


class Code(Base):
    __tablename__ = "codes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    definition = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    color = Column(String, nullable=True)  # Hex color for UI

    is_active = Column(Boolean, default=True)
    is_auto_generated = Column(Boolean, default=False)
    properties = Column(JSON, nullable=True)
    codebook_id = Column(Integer, ForeignKey("codebooks.id"), nullable=False)
    group_name = Column(String, nullable=True)
    theme_id = Column(Integer, ForeignKey("themes.id"), nullable=True)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.now(
        datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.now(
        datetime.timezone.utc), onupdate=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="codes")
    created_by = relationship("User", back_populates="created_codes")

    code_assignments = relationship(
        "CodeAssignment", back_populates="code", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="code")
    codebook = relationship("Codebook", back_populates="codes")
    theme = relationship("Theme", back_populates="codes")

    def __repr__(self):
        return f"<Code(id={self.id}, name='{self.name}', project_id={self.project_id})>"

    @staticmethod
    def get_default_codebook(user_id: int, project_id: int, db: Session):
        """Fetch or create the default codebook for a user in a project."""
        default_codebook = db.query(Codebook).filter_by(
            user_id=user_id, project_id=project_id, is_ai_generated=False
        ).first()
        if not default_codebook:
            default_codebook = Codebook(
                name="Default Codebook",
                user_id=user_id,
                project_id=project_id,
                is_ai_generated=False,
                description="Default codebook for user.",
            )
            db.add(default_codebook)
            db.commit()
            db.refresh(default_codebook)
        return default_codebook

    @staticmethod
    def set_default_codebook_id(mapper, connection, target):
        """Set the default codebook_id before inserting a new Code."""
        if not target.codebook_id:
            db = Session(bind=connection)
            default_codebook = Code.get_default_codebook(
                user_id=target.created_by_id, project_id=target.project_id, db=db
            )
            target.codebook_id = default_codebook.id


listen(Code, 'before_insert', Code.set_default_codebook_id)
