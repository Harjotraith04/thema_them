from sqlalchemy.orm import Session, selectinload
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
import datetime

from app.models.code import Code
from app.models.document import Document
from app.models.code_assignments import CodeAssignment as CodeAssignmentModel
from app.models.user import User
from app.core.permissions import PermissionChecker
from app.schemas.code_assignment import CodeAssignment, CodeAssignmentInDB


class CodeAssignmentService:
    """Service for handling code assignments to document text ranges"""

    @staticmethod
    def find_or_create_code(
        db: Session,
        project_id: int,
        code_name: str,
        user_id: int,
        description: Optional[str] = None,
        color: Optional[str] = "#3B82F6",
        is_auto_generated: bool = False,
        codebook_id: Optional[int] = None
    ) -> Code:
        """Find existing code by name or create new one"""

        # Look for existing code with same name in the project
        existing_code = db.query(Code).filter(
            Code.project_id == project_id,
            Code.name == code_name
        ).first()

        if existing_code:
            return existing_code

        from app.services.code_service import CodeService

        new_code = CodeService.create_code(
            db=db,
            name=code_name,
            project_id=project_id,
            created_by_id=user_id,
            description=description or f"Auto-created code: {code_name}",
            color=color,
            is_auto_generated=is_auto_generated,
            codebook_id=codebook_id
        )
        print(f"DEBUG: New code created with ID {new_code.id}")
        return new_code

    @staticmethod
    def create_code_assignment(
            db: Session,
            document_id: int,
            code_id: int,
            start_char: int,
            end_char: int,
            text_snapshot: str,
            user_id: int,
            note: Optional[str] = None,
            confidence: Optional[int] = None) -> CodeAssignmentModel:
        """Create a new code assignment or return existing one if duplicate"""

        existing_assignment = db.query(CodeAssignmentModel).filter(
            CodeAssignmentModel.document_id == document_id,
            CodeAssignmentModel.code_id == code_id,
            CodeAssignmentModel.start_char == start_char,
            CodeAssignmentModel.end_char == end_char,
            CodeAssignmentModel.created_by_id == user_id
        ).first()

        if existing_assignment:
            return existing_assignment

        code_assignment = CodeAssignmentModel(
            document_id=document_id,
            code_id=code_id,
            start_char=start_char,
            end_char=end_char,
            text_snapshot=text_snapshot,
            note=note,
            confidence=confidence,
            created_by_id=user_id
        )

        db.add(code_assignment)
        db.commit()
        db.refresh(code_assignment)
        return code_assignment

    @staticmethod
    def assign_code(
        db: Session,
        request: CodeAssignment,
        user_id: int,
        is_auto_generated: bool = False,
        codebook_id: Optional[int] = None
    ) -> Dict[str, Any]:
        # Get document to determine project_id and validate access
        document = db.query(Document).filter(
            Document.id == request.document_id).first()
        if not document:
            raise ValueError("Document not found")

        # Check user access
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check document access and convert HTTPException to ValueError
        try:
            PermissionChecker.check_document_access(
                db, request.document_id, user)
        except HTTPException as e:
            if e.status_code == 404:
                raise ValueError("Document not found")
            elif e.status_code == 403:
                raise ValueError(
                    "Access denied: You don't have permission to access this document")
            else:
                # Find or create code
                raise ValueError(f"Permission error: {e.detail}")
        code = CodeAssignmentService.find_or_create_code(
            db=db,
            project_id=document.project_id,  # type: ignore
            code_name=request.code_name,
            user_id=user_id,
            description=request.code_description,
            color=request.code_color,
            is_auto_generated=is_auto_generated,
            codebook_id=codebook_id
        )

        # Create code assignment
        code_assignment = CodeAssignmentService.create_code_assignment(
            db=db,
            document_id=request.document_id,
            code_id=code.id,  # type: ignore
            start_char=request.start_char,
            end_char=request.end_char,
            text_snapshot=request.text,
            user_id=user_id,
            confidence=request.confidence
        )

        return {
            "code_assignment": {
                "id": code_assignment.id,
                "text": code_assignment.text_snapshot,
                "start_char": code_assignment.start_char,
                "end_char": code_assignment.end_char,
                "document_id": code_assignment.document_id,
                "confidence": code_assignment.confidence,
                "created_at": code_assignment.created_at
            },
            "code": {
                "id": code.id,
                "name": code.name,
                "description": code.description,
                "color": code.color,
                "project_id": code.project_id,
                "created_at": code.created_at,
                "is_auto_generated": is_auto_generated
            },
            "assignment_status": "success",
            "message": f"Successfully assigned code '{code.name}' to text selection"
        }

    @staticmethod
    def bulk_code_assignment(
        db: Session,
        requests: List[CodeAssignment],
        user_id: int,
        is_auto_generated: bool = False,
        codebook_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Bulk create code assignments using efficient batch operations"""
        print(f"Bulk code assignment called with {len(requests)} requests")

        if not requests:
            return {
                "results": [],
                "summary": {
                    "total_requests": 0,
                    "successful_assignments": 0,
                    "codes_created": 0,
                    "errors": []
                }
            }

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")

            # Validate access to all documents upfront
            document_ids = list(set(req.document_id for req in requests))
            documents = db.query(Document).filter(
                Document.id.in_(document_ids)).all()
            document_map = {doc.id: doc for doc in documents}  # type: ignore

            for doc_id in document_ids:
                if doc_id not in document_map:
                    raise ValueError(f"Document {doc_id} not found")
                try:
                    PermissionChecker.check_document_access(db, doc_id, user)
                except HTTPException as e:
                    if e.status_code == 404:
                        raise ValueError(f"Document {doc_id} not found")
                    elif e.status_code == 403:
                        raise ValueError(
                            f"Access denied: You don't have permission to access document {doc_id}")
                    else:
                        raise ValueError(
                            f"Permission error for document {doc_id}: {e.detail}")

        except Exception as e:
            # Handle database connection errors and other exceptions
            error_msg = str(e)
            print(f"⚠️ Database error in bulk_code_assignment: {error_msg}")

            # Check if this is a database connection error
            if any(keyword in error_msg.lower() for keyword in ['ssl', 'connection', 'eof', 'operationalerror', 'timeout']):
                print("⚠️ Database connection issue detected")
                return {
                    "results": [],
                    "summary": {
                        "total_requests": len(requests),
                        "successful_assignments": 0,
                        "codes_created": 0,
                        "errors": [f"Database connection error: {error_msg}"],
                        "total_errors": 1,
                        "connection_error": True
                    }
                }
            else:
                # Re-raise other types of errors
                raise e

        # Get all unique project IDs and code names
        project_ids = list(set(doc.project_id for doc in documents))
        code_names = list(set(req.code_name for req in requests))
        print(
            f"DEBUG: Processing {len(code_names)} unique codes across {len(project_ids)} projects")

        # Fetch all existing codes in a single query
        existing_codes = db.query(Code).filter(
            Code.project_id.in_(project_ids),
            Code.name.in_(code_names)
        ).all()

        # Build lookup for existing codes
        codes_lookup = {}
        for code in existing_codes:
            key = (code.project_id, code.name)
            codes_lookup[key] = code

        # Identify codes that need to be created
        codes_to_create = []
        codes_created_count = 0

        for req in requests:
            document = document_map[req.document_id]  # type: ignore
            project_id = document.project_id  # type: ignore
            code_key = (project_id, req.code_name)

            if code_key not in codes_lookup:
                # Check if we haven't already added this code to the creation list
                if not any(c['name'] == req.code_name and c['project_id'] == project_id for c in codes_to_create):
                    codes_to_create.append({
                        'name': req.code_name,
                        'project_id': project_id,
                        'description': req.code_description or f"Auto-created code: {req.code_name}",
                        'color': req.code_color or "#3B82F6",
                        'created_by_id': user_id,
                        'is_auto_generated': is_auto_generated,
                        'codebook_id': codebook_id
                    })

        # Bulk create new codes if needed
        if codes_to_create:
            print(f"Creating {len(codes_to_create)} new codes in bulk")

            # Add timestamps for bulk insert
            current_time = datetime.datetime.now(datetime.timezone.utc)
            for code_data in codes_to_create:
                code_data['created_at'] = current_time
                code_data['updated_at'] = current_time

            # Use bulk_insert_mappings for efficient insertion
            db.bulk_insert_mappings(Code.__mapper__, codes_to_create)
            db.commit()
            codes_created_count = len(codes_to_create)

            # Refresh codes_lookup with newly created codes
            new_codes = db.query(Code).filter(
                Code.project_id.in_(project_ids),
                Code.name.in_([c['name'] for c in codes_to_create])
            ).all()

            for code in new_codes:
                key = (code.project_id, code.name)
                if key not in codes_lookup:  # Only add if not already present
                    codes_lookup[key] = code

        # Check for duplicate assignments before creating
        existing_assignments = db.query(CodeAssignmentModel).filter(
            CodeAssignmentModel.document_id.in_(document_ids),
            CodeAssignmentModel.created_by_id == user_id
        ).all()

        existing_assignment_keys = set()
        for assignment in existing_assignments:
            key = (assignment.document_id, assignment.code_id,
                   assignment.start_char, assignment.end_char)
            existing_assignment_keys.add(key)

        # Prepare assignments for bulk creation
        assignments_to_create = []
        results = []
        errors = []

        for i, req in enumerate(requests):
            try:
                document = document_map[req.document_id]  # type: ignore
                project_id = document.project_id  # type: ignore
                code_key = (project_id, req.code_name)

                code = codes_lookup.get(code_key)
                if not code:
                    errors.append({
                        'index': i,
                        'assignment': req.model_dump(),
                        'error': f"Code '{req.code_name}' not found for project {project_id}"
                    })
                    continue

                # Check for duplicate assignment
                assignment_key = (req.document_id, code.id,
                                  req.start_char, req.end_char)
                if assignment_key in existing_assignment_keys:
                    # Skip duplicate but still return it in results
                    existing_assignment = next(
                        (a for a in existing_assignments if (a.document_id,
                         a.code_id, a.start_char, a.end_char) == assignment_key),
                        None
                    )
                    if existing_assignment:
                        results.append({
                            "code_assignment": {
                                "id": existing_assignment.id,
                                "text": existing_assignment.text_snapshot,
                                "start_char": existing_assignment.start_char,
                                "end_char": existing_assignment.end_char,
                                "document_id": existing_assignment.document_id,
                                "confidence": existing_assignment.confidence if existing_assignment.confidence is not None else 80,
                                "created_at": existing_assignment.created_at
                            },
                            "code": {
                                "id": code.id,
                                "name": code.name,
                                "description": code.description,
                                "color": code.color,
                                "project_id": code.project_id,
                                "created_at": code.created_at,
                                "is_auto_generated": is_auto_generated,
                                "was_created": False
                            },
                            "assignment_status": "success",
                            "message": f"Code '{code.name}' already assigned to this text selection"
                        })
                    continue

                current_time = datetime.datetime.now(datetime.timezone.utc)
                # Add to bulk creation list
                assignment_data = {
                    'document_id': req.document_id,
                    'code_id': code.id,
                    'start_char': req.start_char,
                    'end_char': req.end_char,
                    'text_snapshot': req.text,
                    'confidence': req.confidence if req.confidence is not None else 80,
                    'created_by_id': user_id,
                    'created_at': current_time,
                    'updated_at': current_time
                }
                assignments_to_create.append(assignment_data)

                # Prepare result entry (we'll get the ID after bulk insert)
                results.append({
                    "code_assignment": {
                        "id": None,  # Will be filled after bulk insert
                        "text": req.text,
                        "start_char": req.start_char,
                        "end_char": req.end_char,
                        "document_id": req.document_id,
                        "confidence": req.confidence if req.confidence is not None else 80,
                        "created_at": assignment_data['created_at']
                    },
                    "code": {
                        "id": code.id,
                        "name": code.name,
                        "description": code.description,
                        "color": code.color,
                        "project_id": code.project_id,
                        "created_at": code.created_at,
                        "is_auto_generated": is_auto_generated,
                        "was_created": any(c['name'] == req.code_name and c['project_id'] == project_id for c in codes_to_create)
                    },
                    "assignment_status": "success",
                    "message": f"Successfully assigned code '{code.name}' to text selection"
                })

            except Exception as e:
                errors.append({
                    'index': i,
                    'assignment': req.model_dump(),
                    'error': str(e)
                })

        # Bulk create assignments
        if assignments_to_create:
            print(f"Creating {len(assignments_to_create)} assignments in bulk")
            db.bulk_insert_mappings(
                CodeAssignmentModel.__mapper__, assignments_to_create)
            db.commit()

            # Get the created assignments to fill in the IDs
            created_assignments = db.query(CodeAssignmentModel).filter(
                CodeAssignmentModel.document_id.in_(document_ids),
                CodeAssignmentModel.created_by_id == user_id
            ).order_by(CodeAssignmentModel.created_at.desc()).limit(len(assignments_to_create)).all()

            # Update results with actual IDs (this is a simplification - in production you might want more robust ID matching)
            assignment_idx = 0
            for result in results:
                if result["code_assignment"]["id"] is None and assignment_idx < len(created_assignments):
                    result["code_assignment"]["id"] = created_assignments[assignment_idx].id
                    assignment_idx += 1

        successful_assignments = len(
            [r for r in results if r["assignment_status"] == "success"])

        print(
            f"Bulk assignment completed - {successful_assignments} successful, {codes_created_count} codes created, {len(errors)} errors")
        return {
            "results": results,
            "summary": {
                "total_requests": len(requests),
                "successful_assignments": successful_assignments,
                "codes_created": codes_created_count,
                "errors": errors,
                "total_errors": len(errors)
            }
        }

    @staticmethod
    def get_code_assignments_for_document(
        db: Session,
        document_id: int,
        user_id: int
    ) -> List[CodeAssignmentInDB]:
        """Get all code assignments for a document"""

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check document access and convert HTTPException to ValueError
        try:
            PermissionChecker.check_document_access(db, document_id, user)
        except HTTPException as e:
            if e.status_code == 404:
                raise ValueError("Document not found")
            elif e.status_code == 403:
                raise ValueError(
                    "Access denied: You don't have permission to access this document")
            else:
                raise ValueError(f"Permission error: {e.detail}")
        assignments = db.query(CodeAssignmentModel).filter(
            CodeAssignmentModel.document_id == document_id
        ).options(
            selectinload(CodeAssignmentModel.code)
        ).all()

        # Convert to schema objects
        return assignments  # type: ignore

    @staticmethod
    def delete_code_assignment(
        db: Session,
        assignment_id: int,
        user_id: int
    ) -> bool:
        """Delete a code assignment"""

        assignment = db.query(CodeAssignmentModel).filter(
            CodeAssignmentModel.id == assignment_id
        ).first()

        if not assignment:
            return False

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check document access and convert HTTPException to ValueError
        try:
            PermissionChecker.check_document_access(
                db, assignment.document_id, user)  # type: ignore
        except HTTPException as e:
            if e.status_code == 404:
                raise ValueError("Document not found")
            elif e.status_code == 403:
                raise ValueError(
                    "Access denied: You don't have permission to access this document")
            else:
                raise ValueError(f"Permission error: {e.detail}")

        db.delete(assignment)
        db.commit()
        return True
