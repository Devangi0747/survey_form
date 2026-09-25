from fastapi.testclient import TestClient

from app.main import app


def test_job_to_application_flow():
    client = TestClient(app)
    email = "flow-test@example.com"
    register = client.post("/api/auth/register", json={"email": email, "password": "password123"})
    assert register.status_code in {201, 409}

    job = client.post("/api/jobs/analyze", json={
        "title": "Python Data Analyst",
        "company": "Example Co",
        "location": "London, UK",
        "description": "Analyze data with Python and SQL.",
        "required_skills": ["Python", "SQL"],
        "preferred_skills": ["Spark"],
    })
    assert job.status_code == 201

    application = client.post("/api/applications/prepare", json={
        "job_id": job.json()["id"],
        "cover_letter": "Draft for review.",
        "answers": {"Why this role?": "Because the role matches my experience."},
    })
    assert application.status_code == 201
    assert application.json()["status"] == "Ready for Review"
