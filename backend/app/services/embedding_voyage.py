import httpx
from typing import List
from app.config import settings

class VoyageEmbedding:
    """Service to get text embeddings using Voyage AI."""
    
    def __init__(self):
        self.api_key = settings.voyage_api_key
        self.model = settings.embedding_model
        self.url = "https://api.voyageai.com/v1/embeddings"
        
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for a list of texts."""
        if not self.api_key:
            raise ValueError("VOYAGE_API_KEY is not set in environment or config.")
            
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self.url,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"input": texts, "model": self.model},
                timeout=30.0
            )
            resp.raise_for_status()
            data = resp.json()
            # The Voyage API returns a list of embedding objects in the 'data' field.
            return [item["embedding"] for item in data["data"]]

def get_embedder() -> VoyageEmbedding:
    return VoyageEmbedding()
