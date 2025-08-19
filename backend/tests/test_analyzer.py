import json
import pytest
import os
from analyzer import analyze_chunk


@pytest.mark.integration
@pytest.mark.skipif(not os.getenv("GROQ_API_KEY"), reason="GROQ_API_KEY not set")
def test_analyzer_live_llm_call():
    """
    Tests the analyze_chunk function by making a REAL network call to the LLM.
    Will be skipped if the GROQ_API_KEY is not available.
    """

    sample_text = """
    JULIET
    O Romeo, Romeo! wherefore art thou Romeo?
    Deny thy father and refuse thy name.
    ROMEO
    Shall I hear more, or shall I speak at this?
    """

    result_string = analyze_chunk(sample_text)

    assert isinstance(result_string, str), "The output should be a string."

    try:
        parsed_result = json.loads(result_string)
    except json.JSONDecodeError:
        assert False, "The LLM output was not valid JSON."

    assert isinstance(parsed_result, dict), "The parsed JSON should be a dictionary."
    assert "characters" in parsed_result, (
        "The 'characters' key should be in the result."
    )
    assert "interactions" in parsed_result, (
        "The 'interactions' key should be in the result."
    )

    characters = parsed_result["characters"]
    assert isinstance(characters, list), "'characters' should be a list."

    assert any(char.lower() == "romeo" for char in characters)
    assert any(char.lower() == "juliet" for char in characters)
