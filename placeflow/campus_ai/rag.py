"""Institutional RAG Engine with Grounded Source Citations.

Answers campus inquiries strictly grounded in verified institutional documents,
regulations, and guidelines with zero cross-tenant leakage.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from campus_ai.gateway import CampusAIGateway
from campus_ai.router import TaskType
from campus_ai.vector_store import TenantIsolatedVectorStore, RetrievedChunk


@dataclass
class GroundedCitation:
    """Document citation verifying answer groundedness."""

    doc_title: str
    version: str
    section_heading: str
    source_authority: str


@dataclass
class GroundedRAGResponse:
    """RAG outcome with authoritative citations and audit trace ID."""

    answer: str
    citations: List[GroundedCitation]
    retrieved_chunks: List[RetrievedChunk]
    trace_id: str
    groundedness_score: float
    total_tokens: int


class InstitutionalRAGEngine:
    """Retrieval-Augmented Generation engine for campus policies and guidelines."""

    def __init__(self, db, gateway: Optional[CampusAIGateway] = None):
        self.db = db
        self.gateway = gateway or CampusAIGateway(db)
        self.vector_store = TenantIsolatedVectorStore(db)

    def answer_query(
        self,
        tenant_id: str,
        actor_account_id: str,
        query: str,
        category: Optional[str] = None,
        institution_id: Optional[str] = None,
        top_k: int = 3,
    ) -> GroundedRAGResponse:
        """Answers an institutional question grounded in approved regulations.

        Args:
            tenant_id: Mandatory tenant partition key.
            actor_account_id: Caller account identity.
            query: Question from student, faculty, or recruiter.
            category: Document classification filter.
            institution_id: Campus ID.
            top_k: Number of chunks to retrieve.

        Returns:
            GroundedRAGResponse with citations and audit trace.
        """
        # Step 1: Tenant-partitioned semantic retrieval
        chunks = self.vector_store.search(
            tenant_id=tenant_id,
            query=query,
            top_k=top_k,
            institution_id=institution_id,
            category=category,
        )

        # Step 2: Handle zero-knowledge fallback without hallucinating
        if not chunks:
            return GroundedRAGResponse(
                answer=(
                    "No approved institutional policy or regulation document was found "
                    "matching your inquiry in this tenant's official registry."
                ),
                citations=[],
                retrieved_chunks=[],
                trace_id="none",
                groundedness_score=0.0,
                total_tokens=0,
            )

        # Step 3: Format grounded context block with provenance
        context_parts = []
        citations: List[GroundedCitation] = []
        seen_citations = set()

        for c in chunks:
            citation_key = (c.doc_title, c.version, c.section_heading)
            if citation_key not in seen_citations:
                seen_citations.add(citation_key)
                citations.append(
                    GroundedCitation(
                        doc_title=c.doc_title,
                        version=c.version,
                        section_heading=c.section_heading,
                        source_authority=c.source_authority,
                    )
                )
            context_parts.append(
                f"[Document: {c.doc_title} (v{c.version}) | Section: {c.section_heading} | Authority: {c.source_authority}]\n{c.content}"
            )

        context_str = "\n\n".join(context_parts)
        grounded_prompt = (
            f"Question: {query}\n\n"
            f"Authoritative Institutional Excerpts:\n{context_str}\n\n"
            f"Provide a clear, authoritative response based strictly on these excerpts. "
            f"Reference the issuing authority and document title."
        )

        system_instruction = (
            "You are PlaceFlow Campus Intelligence. You answer questions strictly based on "
            "the provided institutional policy excerpts. Never invent rules or extrapolate beyond the text."
        )

        # Step 4: Execute through Gateway (PIP + PII Masking + Quota + Trace)
        exec_res = self.gateway.execute(
            tenant_id=tenant_id,
            actor_account_id=actor_account_id,
            prompt=grounded_prompt,
            task_type=TaskType.POLICY_QA,
            institution_id=institution_id,
            system_instruction=system_instruction,
        )

        # Step 5: Score groundedness based on similarity of top chunk
        top_sim = chunks[0].similarity_score if chunks else 0.0
        groundedness = min(1.0, max(0.0, top_sim * 1.2))

        return GroundedRAGResponse(
            answer=exec_res.output_text,
            citations=citations,
            retrieved_chunks=chunks,
            trace_id=exec_res.trace_id,
            groundedness_score=round(groundedness, 2),
            total_tokens=exec_res.total_tokens,
        )

