from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_embedding(text: str) -> list[float]:
    """
    Convert text to vector for semantic search.
    Always embed English text for consistency across languages.
    """
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text[:8000],  # safety limit
    )
    return response.data[0].embedding