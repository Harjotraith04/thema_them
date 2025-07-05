from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from app.db.session import Base


class Theme(Base):
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.now(
        datetime.timezone.utc), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="themes")
    user = relationship("User", back_populates="themes")
    codes = relationship("Code", back_populates="theme")
