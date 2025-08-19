import dspy
import os
from dotenv import load_dotenv

load_dotenv()


class ExtractInteractions(dspy.Signature):
    """
    Given a chunk of text from a book, identify the characters present and
    list pairs of characters who interact with each other in this chunk. An
    interaction is a direct conversation or significant action between two
    characters.
    """

    text_chunk = dspy.InputField(desc="A small section of a book's text.")
    json_interactions = dspy.OutputField(
        desc="A JSON object containing two keys: 'characters' (a list of names) and 'interactions' (a list of [character1, character2] pairs)."
    )


llm = dspy.LM("groq/llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))
dspy.settings.configure(lm=llm)

extractor = dspy.Predict(ExtractInteractions)


def analyze_chunk(chunk):
    """Analyzes a single chunk of text using the DSPy module."""
    result = extractor(text_chunk=chunk)
    return result.json_interactions
