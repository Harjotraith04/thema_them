#!/usr/bin/env python3
"""
Integrated workflow test for the thematic analysis tool
Tests the complete flow from project creation to manual coding/annotation
"""
import pytest
import io


def test_complete_workflow(client, auth_headers):
    """Test the complete workflow of the thematic analysis tool"""
    # 1. Create a project
    project_data = {
        "title": "Complete Workflow Test Project",
        "description": "A project for testing the complete workflow"
    }

    project_response = client.post(
        "/api/v1/projects/", json=project_data, headers=auth_headers)
    assert project_response.status_code == 201
    project = project_response.json()
    project_id = project["id"]

    # 2. Create documents using file upload
    document1_content = """
        Interviewer: Can you tell me about your experience with remote work?
        Participant: Well, I've been working remotely for about two years now.
        It has its ups and downs. I love the flexibility and not having to commute.
        But I sometimes miss the social interaction with colleagues.
        Interviewer: How do you stay productive when working from home?
        Participant: I have a dedicated workspace and stick to a routine.
        I also use time-blocking techniques to manage my day.
        """

    document2_content = """
        Interviewer: What's your experience with remote work been like?
        Participant: I started working remotely during the pandemic and continued since then.
        The biggest advantage for me is work-life balance.
        The challenge is separating work time from personal time when everything happens in the same space.
        Interviewer: How do you collaborate with your team remotely?
        Participant: We use a lot of tools like Slack, Zoom, and collaborative documents.
        Regular check-ins help, but it's not the same as in-person collaboration.
        """

    # Create first document with file upload
    file1_data = io.BytesIO(document1_content.encode())
    files1 = {"file": ("interview_transcript_1.txt", file1_data, "text/plain")}
    data1 = {"project_id": project_id, "name": "Interview Transcript 1"}

    doc1_response = client.post(
        "/api/v1/documents/", files=files1, data=data1, headers=auth_headers)
    assert doc1_response.status_code == 201
    document1 = doc1_response.json()
    document1_id = document1["id"]

    # Create second document with file upload
    file2_data = io.BytesIO(document2_content.encode())
    files2 = {"file": ("interview_transcript_2.txt", file2_data, "text/plain")}
    data2 = {"project_id": project_id, "name": "Interview Transcript 2"}

    doc2_response = client.post(
        "/api/v1/documents/", files=files2, data=data2, headers=auth_headers)
    assert doc2_response.status_code == 201
    document2 = doc2_response.json()
    document2_id = document2["id"]

    # 3. Create manual codes for testing (skipping AI services)
    codes = []

    # Create manual codes
    code_data_list = [
        {
            "name": "Remote Work Benefits",
            "description": "Positive aspects of remote work",
            "color": "#28a745",
            "project_id": project_id
        },
        {
            "name": "Remote Work Challenges",
            "description": "Difficulties with remote work",
            "color": "#dc3545",
            "project_id": project_id
        },
        {
            "name": "Productivity Strategies",
            "description": "Methods to stay productive while remote",
            "color": "#007bff",
            "project_id": project_id
        },
        {
            "name": "Work-Life Balance",
            "description": "References to balancing work and personal life",
            "color": "#ffc107",
            "project_id": project_id
        }
    ]

    # Create all the codes
    for code_data in code_data_list:
        code_response = client.post(
            "/api/v1/codes/", json=code_data, headers=auth_headers)
        assert code_response.status_code == 201
        codes.append(code_response.json())

    # 4. Create manual annotations instead of auto-coding (skipping AI services)
    # Create some manual annotations on document1
    annotation1_data = {
        "content": "Positive aspect of remote work mentioned",
        "annotation_type": "COMMENT",
        "document_id": document1_id,
        "code_id": codes[0]["id"],  # Remote Work Benefits
        "start_char": document1_content.find("flexibility"),
        "end_char": document1_content.find("flexibility") + len("flexibility"),
        "text_snapshot": "flexibility"
    }

    annotation1_response = client.post(
        "/api/v1/annotations/", json=annotation1_data, headers=auth_headers)
    assert annotation1_response.status_code == 201

    annotation2_data = {
        "content": "Challenge with remote work",
        "annotation_type": "COMMENT",
        "document_id": document1_id,
        "code_id": codes[1]["id"],  # Remote Work Challenges
        "start_char": document1_content.find("miss the social interaction"),
        "end_char": document1_content.find("miss the social interaction") + len("miss the social interaction"),
        "text_snapshot": "miss the social interaction"
    }

    annotation2_response = client.post(
        "/api/v1/annotations/", json=annotation2_data, headers=auth_headers)
    assert annotation2_response.status_code == 201

    # 5. Test code assignments
    assignment_data = {
        "document_id": document2_id,
        "text": "work-life balance",
        "start_char": document2_content.find("work-life balance"),
        "end_char": document2_content.find("work-life balance") + len("work-life balance"),
        "code_name": "Work-Life Balance Assignment",
        "code_description": "Assigned from workflow test",
        "code_color": "#FF5733"
    }
    assignment_response = client.post(
        "/api/v1/code-assignments/assign", json=assignment_data, headers=auth_headers)
    assert assignment_response.status_code == 200

    # 6. Verify we can retrieve all project data
    project_view_response = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert project_view_response.status_code == 200
    project_data = project_view_response.json()

    # Verify the project structure
    assert project_data["id"] == project_id
    assert "documents" in project_data
    assert len(project_data["documents"]) == 2
    assert "codes" in project_data
    assert len(project_data["codes"]) >= 4

    # 7. Verify annotations and code assignments exist
    annotations_response = client.get(
        f"/api/v1/annotations/?document_id={document1_id}", headers=auth_headers)
    assert annotations_response.status_code == 200
    annotations_data = annotations_response.json()
    assert len(annotations_data) >= 2  # We created 2 annotations

    code_assignments_response = client.get(
        f"/api/v1/code-assignments/document/{document2_id}", headers=auth_headers)
    assert code_assignments_response.status_code == 200
    assignments_data = code_assignments_response.json()
    assert len(assignments_data) >= 1  # We created 1 code assignment    
    # 8. Clean up - delete project (this should cascade delete all related entities)
    delete_response = client.delete(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert delete_response.status_code == 200

    # Verify project is gone
    verify_response = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert verify_response.status_code == 404
