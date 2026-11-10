"""PlaceFlow / Meridian — Machine Learning Model Registry & Lifecycle Management (Phase 1).

Handles model serialization, metadata manifests, risk tier tracking, and hot reloading.
Reference: docs/redesign4.txt Section 11, Section 14, and Section 19.
"""

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import joblib

DEFAULT_MODEL_DIR = Path(__file__).resolve().parent / "models"


@dataclass
class ModelMetadata:
    """Standardized metadata manifest describing an ML model artifact."""

    model_id: str
    version: str = "1.0.0"
    algorithm: str = "GradientBoosting"
    risk_tier: str = "TIER_B"  # TIER_A (Low), TIER_B (Moderate), TIER_C (High)
    feature_names: List[str] = field(default_factory=list)
    metrics: Dict[str, float] = field(default_factory=dict)
    trained_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "PRODUCTION"  # PRODUCTION, STAGING, ARCHIVED
    description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ModelMetadata":
        return cls(
            model_id=data.get("model_id", "unknown_model"),
            version=data.get("version", "1.0.0"),
            algorithm=data.get("algorithm", "GradientBoosting"),
            risk_tier=data.get("risk_tier", "TIER_B"),
            feature_names=data.get("feature_names", []),
            metrics=data.get("metrics", {}),
            trained_at=data.get("trained_at", datetime.now(timezone.utc).isoformat()),
            status=data.get("status", "PRODUCTION"),
            description=data.get("description", ""),
        )


class ModelRegistry:
    """Manages model artifacts on disk with in-memory caching and version manifests."""

    def __init__(self, model_dir: Optional[Path] = None):
        self.model_dir = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self._cache: Dict[str, Tuple[Any, ModelMetadata]] = {}

    def get_manifest_path(self, model_id: str) -> Path:
        return self.model_dir / f"{model_id}.manifest.json"

    def get_artifact_path(self, model_id: str) -> Path:
        return self.model_dir / f"{model_id}.pkl"

    def save_model(
        self,
        model_id: str,
        artifact: Any,
        metadata: ModelMetadata,
    ) -> Path:
        """Saves a model artifact (.pkl) and its associated manifest (.json)."""
        artifact_path = self.get_artifact_path(model_id)
        manifest_path = self.get_manifest_path(model_id)

        joblib.dump(artifact, artifact_path)

        manifest_data = metadata.to_dict()
        manifest_path.write_text(json.dumps(manifest_data, indent=2), encoding="utf-8")

        # Update cache
        self._cache[model_id] = (artifact, metadata)
        return artifact_path

    def load_model(
        self,
        model_id: str,
        force_reload: bool = False,
    ) -> Tuple[Optional[Any], Optional[ModelMetadata]]:
        """Loads a model artifact and its metadata manifest, caching in memory."""
        if not force_reload and model_id in self._cache:
            return self._cache[model_id]

        artifact_path = self.get_artifact_path(model_id)
        if not artifact_path.exists():
            return None, None

        artifact = joblib.load(artifact_path)

        manifest_path = self.get_manifest_path(model_id)
        if manifest_path.exists():
            try:
                data = json.loads(manifest_path.read_text(encoding="utf-8"))
                metadata = ModelMetadata.from_dict(data)
            except Exception:
                metadata = self._build_default_metadata(model_id)
        else:
            metadata = self._build_default_metadata(model_id)

        self._cache[model_id] = (artifact, metadata)
        return artifact, metadata

    def list_models(self) -> List[ModelMetadata]:
        """Scans the model directory for all available registered models."""
        manifests: List[ModelMetadata] = []
        for pkl_file in self.model_dir.glob("*.pkl"):
            model_id = pkl_file.stem
            _, meta = self.load_model(model_id)
            if meta:
                manifests.append(meta)
        return manifests

    def _build_default_metadata(self, model_id: str) -> ModelMetadata:
        """Infers default metadata for existing legacy unmanifested artifacts."""
        risk = "TIER_B"
        desc = "PlaceFlow baseline predictive model"
        if "renege" in model_id.lower():
            risk = "TIER_C"
            desc = "Post-offer candidate flight risk radar"
        elif "fairness" in model_id.lower():
            risk = "TIER_B"
            desc = "Demographic parity and bias assessment auditor"
        elif "skill" in model_id.lower() or "whatif" in model_id.lower():
            risk = "TIER_A"
            desc = "Candidate exploration and career guidance recommender"

        return ModelMetadata(
            model_id=model_id,
            version="1.0.0",
            algorithm="LegacySklearnPickle",
            risk_tier=risk,
            description=desc,
            status="PRODUCTION",
        )


# Global default registry singleton
registry = ModelRegistry()

