from typing import Optional, Dict, Any
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

class Codebook(Base):
    __tablename__ = "codebooks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    # Owner of the codebook
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    is_ai_generated = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    finalized = Column(Boolean, default=False, server_default='false', nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="codebooks")
    project = relationship("Project", back_populates="codebooks")
    codes = relationship("Code", back_populates="codebook", cascade="all, delete-orphan")