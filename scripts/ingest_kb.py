import sys
import os
from pathlib import Path
import asyncio
import argparse

# Add backend dir to sys.path so we can import from app
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root / "backend"))

from app.config import settings
from app.core.rag import get_rag
from langchain_text_splitters import RecursiveCharacterTextSplitter

async def ingest():
    rag = get_rag()
    kb_path = settings.kb_full_path
    
    if not kb_path.exists():
        print(f"Directory {kb_path} not found.")
        return
        
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.rag_chunk_size,
        chunk_overlap=settings.rag_chunk_overlap
    )
    
    docs = []
    ids = []
    
    print(f"Scanning {kb_path} for .txt and .md files...")
    for root, _, files in os.walk(kb_path):
        for file in files:
            if file.endswith((".txt", ".md")):
                file_path = Path(root) / file
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        text = f.read()
                        chunks = text_splitter.split_text(text)
                        for i, chunk in enumerate(chunks):
                            docs.append(chunk)
                            ids.append(f"{file}_{i}")
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
                        
    if not docs:
        print("No .txt or .md files found to ingest.")
        return
        
    print(f"Found {len(docs)} chunks. Fetching embeddings from Voyage AI...")
    
    embeddings = []
    batch_size = 100 # Voyage limit is 128
    try:
        for i in range(0, len(docs), batch_size):
            batch_docs = docs[i:i+batch_size]
            batch_emb = await rag.embedder.get_embeddings(batch_docs)
            embeddings.extend(batch_emb)
            print(f"  Processed {min(i + batch_size, len(docs))}/{len(docs)} chunks...")
    except Exception as e:
        print(f"Failed to get embeddings: {e}")
        return
        
    print(f"Upserting {len(docs)} documents to ChromaDB...")
    rag.collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=docs
    )
    
    print("Ingestion complete!")

if __name__ == "__main__":
    asyncio.run(ingest())
