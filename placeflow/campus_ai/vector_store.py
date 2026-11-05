"""Tenant-Isolated Vector Store and Retrieval for Institutional Knowledge.

Strictly enforces multi-tenant boundary: zero vector chunks can ever be
queried or leaked across different tenant institutions.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import math
import uuid
from typing import Any, Dict, List, Optional


@dataclass
class RetrievedChunk:
    """Retrieved knowledge chunk with source citation metadata."""

    chunk_id: str
    doc_id: str
    doc_title: str
    category: str
    version: str
    section_heading: str
    content: str
    similarity_score: float
    source_authority: str


def compute_deterministic_embedding(text: str, dim: int = 64) -> List[float]:
    """Generates a deterministic normalized unit vector for a text string.

    Uses sha256 feature hashing with trigram windows for predictable cosine
    similarity in unit tests and offline environments without external embedding API.
    """
    vector = [0.0] * dim
    clean_text = text.lower().strip()
    words = clean_text.split()

    for word in words:
        h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vector[idx] += 1.0

    # Character n-grams for typo resilience
    for i in range(len(clean_text) - 2):
        trigram = clean_text[i : i + 3]
        h = int(hashlib.md5(trigram.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vector[idx] += 0.5

    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [round(v / norm, 5) for v in vector]
    return vector


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculates cosine similarity between two float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class TenantIsolatedVectorStore:
    """Partitioned knowledge repository ensuring strict tenant isolation."""

    def __init__(self, db):
        self.db = db

    def index_document(
        self,
        tenant_id: str,
        title: str,
        category: str,
        source_authority: str,
        version: str,
        raw_sections: List[Dict[str, str]],
        institution_id: Optional[str] = None,
        approval_status: str = "APPROVED",
        valid_from: Optional[datetime] = None,
        valid_to: Optional[datetime] = None,
    ) -> str:
        """Indexes an institutional document and its semantic chunk vectors.

        Args:
            tenant_id: Mandatory tenant partition key.
            title: Title of institutional regulation or policy.
            category: Document classification enum.
            source_authority: Issuing entity (e.g. Academic Council, CDC).
            version: Version string (e.g. "2026.1").
            raw_sections: List of dicts with {"heading": ..., "content": ...}.

        Returns:
            doc_id string.
        """
        if not tenant_id:
            raise ValueError("tenant_id is strictly required for document indexing")

        doc_id = f"doc_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        effective_from = valid_from or now

        # 1. Insert Document Metadata
        doc_record = {
            "doc_id": doc_id,
            "tenant_id": tenant_id,
            "institution_id": institution_id,
            "title": title,
            "category": category,
            "source_authority": source_authority,
            "version": version,
            "approval_status": approval_status,
            "valid_from": effective_from,
            "valid_to": valid_to,
            "metadata": {"chunk_count": len(raw_sections)},
            "created_at": now,
            "updated_at": now,
        }
        self.db.ai_knowledge_documents.insert_one(doc_record)

        # 2. Insert Chunks with embeddings
        chunk_docs = []
        for idx, sec in enumerate(raw_sections):
            heading = sec.get("heading", f"Section {idx + 1}")
            content = sec.get("content", "").strip()
            if not content:
                continue

            emb = compute_deterministic_embedding(f"{heading} {content}")
            chunk_id = f"chk_{doc_id}_{idx}"
            chunk_docs.append(
                {
                    "chunk_id": chunk_id,
                    "doc_id": doc_id,
                    "tenant_id": tenant_id,
                    "institution_id": institution_id,
                    "content": content,
                    "section_heading": heading,
                    "page_number": idx + 1,
                    "embedding": emb,
                    "valid_from": effective_from,
                    "valid_to": valid_to,
                    "created_at": now,
                }
            )

        if chunk_docs:
            self.db.ai_knowledge_chunks.insert_many(chunk_docs)

        return doc_id

    def search(
        self,
        tenant_id: str,
        query: str,
        top_k: int = 4,
        institution_id: Optional[str] = None,
        category: Optional[str] = None,
        as_of: Optional[datetime] = None,
    ) -> List[RetrievedChunk]:
        """Tenant-partitioned semantic retrieval.

        Guarantees zero cross-tenant contamination.

        Args:
            tenant_id: Mandatory tenant partition key.
            query: Question or search phrase.
            top_k: Maximum chunks to retrieve.
            institution_id: Optional campus scope.
            category: Optional document category filter.
            as_of: Temporal snapshot (defaults to current UTC time).

        Returns:
            List of RetrievedChunk ordered by descending similarity.
        """
        if not tenant_id:
            raise ValueError("tenant_id is strictly required for vector search")

        now = as_of or datetime.now(timezone.utc)
        query_vec = compute_deterministic_embedding(query)

        # Build strict tenant filter
        filter_query: Dict[str, Any] = {
            "tenant_id": tenant_id,
            "valid_from": {"$lte": now},
            "$or": [{"valid_to": None}, {"valid_to": {"$gte": now}}],
        }
        if institution_id:
            filter_query["institution_id"] = institution_id

        # Fetch candidate chunks scoped to tenant
        candidates = list(self.db.ai_knowledge_chunks.find(filter_query))
        if not candidates:
            return []

        # Fetch active approved documents for this tenant to join metadata
        approved_doc_filter: Dict[str, Any] = {
            "tenant_id": tenant_id,
            "approval_status": "APPROVED",
        }
        if category:
            approved_doc_filter["category"] = category

        approved_docs = {
            d["doc_id"]: d
            for d in self.db.ai_knowledge_documents.find(approved_doc_filter)
        }

        scored_chunks: List[RetrievedChunk] = []
        for cand in candidates:
            doc_id = cand["doc_id"]
            doc = approved_docs.get(doc_id)
            if not doc:
                # Exclude if parent document is not APPROVED or category doesn't match
                continue

            sim = cosine_similarity(query_vec, cand.get("embedding", []))
            scored_chunks.append(
                RetrievedChunk(
                    chunk_id=cand["chunk_id"],
                    doc_id=doc_id,
                    doc_title=doc["title"],
                    category=doc["category"],
                    version=doc["version"],
                    section_heading=cand["section_heading"],
                    content=cand["content"],
                    similarity_score=round(sim, 4),
                    source_authority=doc["source_authority"],
                )
            )

        scored_chunks.sort(key=lambda x: x.similarity_score, reverse=True)
        return scored_chunks[:top_k]

