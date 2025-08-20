from typing import Annotated, List
from pydantic import BaseModel, Field, model_validator, ValidationError
import dspy
import os
from dotenv import load_dotenv

load_dotenv()


class Interaction(BaseModel):
    source: str
    target: str
    sentiment_score: Annotated[float, Field(ge=-1.0, le=1.0)] = 0.0

    @model_validator(mode="after")
    def _no_self_loop(self):
        if self.source == self.target:
            raise ValueError("self loop")
        return self


class ChunkAnalysis(BaseModel):
    characters: List[str] = Field(default_factory=list)
    interactions: List[Interaction] = Field(default_factory=list)


class ExtractInteractions(dspy.Signature):
    """
    Given a chunk of text from a book, identify the characters present and
    list pairs of characters who interact with each other in this chunk. An
    interaction is a direct conversation or significant action between two
    characters.
    """

    text_chunk: str = dspy.InputField()
    analysis: ChunkAnalysis = dspy.OutputField()


llm = dspy.LM("groq/llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))
dspy.settings.configure(lm=llm)

extractor = dspy.Predict(ExtractInteractions)


def analyze_chunk(chunk: str) -> ChunkAnalysis:
    """LLM -> validated ChunkAnalysis. No JSON strings."""
    pred = extractor(text_chunk=chunk)
    raw = pred.analysis
    try:
        if isinstance(raw, ChunkAnalysis):
            return raw
        if isinstance(raw, dict):
            return ChunkAnalysis.model_validate(raw)
        if isinstance(raw, str):
            return ChunkAnalysis.model_validate_json(raw)
    except ValidationError:
        pass
    return ChunkAnalysis()
