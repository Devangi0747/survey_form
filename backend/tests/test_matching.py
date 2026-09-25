from app.services.matching import score_match


def test_matching_is_transparent_and_preferred_skills_are_separate():
    result = score_match("Python SQL product designer", "Product Designer", "London", ["Python", "SQL"], ["Spark"], "London")
    assert result["overall"] > 70
    assert "python" in result["matched_skills"]
    assert result["missing_required"] == []
    assert result["missing_preferred"] == ["spark"]
