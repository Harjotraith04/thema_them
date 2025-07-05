from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Dict, Any
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectSummary, ResearchDetailsUpdate
from app.services.project_comprehensive import ProjectComprehensiveService


class ProjectService:
    """Service for project operations"""

    @staticmethod
    def create_project(db: Session, project: ProjectCreate, user_id: int) -> Project:
        """Create a new project"""
        try:
            db_project = Project(
                title=project.title,
                description=project.description,
                research_details=project.research_details,
                owner_id=user_id
            )

            db.add(db_project)
            db.commit()
            db.refresh(db_project)
            return db_project
        except Exception as e:
            db.rollback()
            raise ValueError(f"Failed to create project: {str(e)}")

    @staticmethod
    def get_project(db: Session, project_id: int, user_id: int) -> Optional[Project]:
        """Get a project by ID that the user has access to"""
        return db.query(Project).filter(
            Project.id == project_id,
            or_(
                Project.owner_id == user_id,
                Project.collaborators.any(User.id == user_id)
            )
        ).first()

    @staticmethod
    def get_user_projects(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        """Get all projects accessible to a user"""
        return db.query(Project).filter(
            or_(
                Project.owner_id == user_id,
                Project.collaborators.any(User.id == user_id)
            )
        ).offset(skip).limit(limit).all()

    @staticmethod
    def update_project(
        db: Session,
        project_id: int,
        project_update: ProjectUpdate,
        user_id: int
    ) -> Project:
        """Update a project (only by owner)"""
        db_project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == user_id
        ).first()

        if not db_project:
            raise ValueError("Project not found or you're not the owner")

        try:
            update_data = project_update.model_dump(exclude_unset=True)
            collaborator_emails = update_data.pop('collaborator_emails', None)

            for field, value in update_data.items():
                setattr(db_project, field, value)

            if collaborator_emails is not None:
                if collaborator_emails:
                    collaborators = db.query(User).filter(
                        User.email.in_(collaborator_emails)
                    ).all()

                    found_emails = {user.email for user in collaborators}
                    missing_emails = set(collaborator_emails) - found_emails
                    if missing_emails:
                        raise ValueError(
                            f"Users not found: {', '.join(missing_emails)}")

                    db_project.collaborators = collaborators
                else:
                    db_project.collaborators = []

            db.commit()
            db.refresh(db_project)
            return db_project
        except Exception as e:
            db.rollback()
            raise ValueError(f"Failed to update project: {str(e)}")

    @staticmethod
    def update_research_details(
        db: Session,
        project_id: int,
        research_details_update: ResearchDetailsUpdate,
        user_id: int
    ) -> Project:
        """Update research details for a project (only by owner or collaborator)"""
        db_project = db.query(Project).filter(
            Project.id == project_id,
            or_(
                Project.owner_id == user_id,
                Project.collaborators.any(User.id == user_id)
            )
        ).first()

        if not db_project:
            raise ValueError("Project not found or you don't have access")

        try:
            db_project.research_details = research_details_update.research_details  # type: ignore
            db.commit()
            db.refresh(db_project)
            return db_project
        except Exception as e:
            db.rollback()
            raise ValueError(f"Failed to update research details: {str(e)}")

    @staticmethod
    def delete_project(db: Session, project_id: int, user_id: int) -> bool:
        """Delete a project (only by owner)"""
        db_project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == user_id
        ).first()

        if not db_project:
            raise ValueError("Project not found or you're not the owner")

        try:
            db.delete(db_project)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise ValueError(f"Failed to delete project: {str(e)}")

    @staticmethod
    def add_collaborator(db: Session, project_id: int, collaborator_email: str, user_id: int) -> bool:
        """Add a collaborator to a project (only by owner)"""
        db_project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == user_id
        ).first()

        if not db_project:
            raise ValueError("Project not found or you're not the owner")

        collaborator = db.query(User).filter(
            User.email == collaborator_email
        ).first()

        if not collaborator:
            raise ValueError(f"User with email {collaborator_email} not found")

        if collaborator not in db_project.collaborators:
            try:
                db_project.collaborators.append(collaborator)
                db.commit()
            except Exception as e:
                db.rollback()
                raise ValueError(f"Failed to add collaborator: {str(e)}")

        return True

    @staticmethod
    def remove_collaborator(db: Session, project_id: int, collaborator_email: str, user_id: int) -> bool:
        """Remove a collaborator from a project (only by owner)"""
        db_project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == user_id
        ).first()

        if not db_project:
            raise ValueError("Project not found or you're not the owner")

        collaborator = db.query(User).filter(
            User.email == collaborator_email
        ).first()

        if collaborator and collaborator in db_project.collaborators:
            try:
                db_project.collaborators.remove(collaborator)
                db.commit()
            except Exception as e:
                db.rollback()
                raise ValueError(f"Failed to remove collaborator: {str(e)}")

        return True

    @staticmethod
    def get_project_summary_list(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[ProjectSummary]:
        """Get a list of project summaries for a user"""
        projects = ProjectService.get_user_projects(db, user_id, skip, limit)

        summaries = []
        for project in projects:
            summary = ProjectSummary(
                id=project.id,  # type: ignore
                title=project.title,  # type: ignore
                description=project.description,  # type: ignore
                owner_id=project.owner_id,  # type: ignore
                document_count=len(project.documents),  # type: ignore
                collaborator_count=len(project.collaborators),  # type: ignore
                created_at=project.created_at,  # type: ignore
                updated_at=project.updated_at  # type: ignore
            )
            summaries.append(summary)

        return summaries

    @staticmethod
    def get_project_comprehensive(db: Session, project_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Get a project with all related data loaded efficiently"""
        # Check access first
        if not ProjectService.get_project(db, project_id, user_id):
            return None

        return ProjectComprehensiveService.get_comprehensive_data(db, project_id, user_id)
