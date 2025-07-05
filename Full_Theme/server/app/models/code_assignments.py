from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
import datetime
from app.db.session import Base


class CodeAssignment(Base):
    __tablename__ = "code_assignments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    code_id = Column(Integer, ForeignKey("codes.id"), nullable=False)

    start_char = Column(Integer, nullable=False)
    end_char = Column(Integer, nullable=False)

    text_snapshot = Column(Text, nullable=True)
    note = Column(Text, nullable=True)
    confidence = Column(Integer, nullable=True)
    # pending, accepted, rejected
    status = Column(String(20), nullable=False, default="pending")
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.now(
        datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc),
                        onupdate=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    document = relationship("Document", back_populates="code_assignments")
    code = relationship("Code", back_populates="code_assignments")
    created_by = relationship("User")
