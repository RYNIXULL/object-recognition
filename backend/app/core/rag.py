import chromadb
from typing import List
from app.config import settings
from app.services.embedding_voyage import get_embedder

class RAGService:
    """Service to handle vector database interactions (RAG) using ChromaDB."""
    
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path=str(settings.chroma_full_path))
        self.collection_name = "knowledge_base"
        self.collection = self.chroma_client.get_or_create_collection(name=self.collection_name)
        self.embedder = get_embedder()

    async def query(self, text: str, top_k: int = None) -> List[str]:
        """Query the knowledge base for relevant documents."""
        top_k = top_k or settings.rag_top_k
        
        # If DB is empty, return early
        if self.collection.count() == 0:
            return []
            
        embeddings = await self.embedder.get_embeddings([text])
        
        results = self.collection.query(
            query_embeddings=embeddings,
            n_results=top_k
        )
        
        documents = []
        if results and results.get("documents"):
            for doc_list in results["documents"]:
                documents.extend(doc_list)
                
        return documents

def get_rag() -> RAGService:
    return RAGService()
