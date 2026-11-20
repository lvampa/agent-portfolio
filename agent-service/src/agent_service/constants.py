"""Model, retrieval, and prompt values that must match the n8n workflow they replace."""

CHAT_MODEL = "models/gemini-3.5-flash-lite"
CHAT_TEMPERATURE = 0.6
CHAT_MAX_OUTPUT_TOKENS = 1024
CHAT_MAX_RETRIES = 1
EMBEDDING_MODEL = "models/gemini-embedding-2"

PINECONE_INDEX = "portfolio-rag"
PINECONE_NAMESPACE = "portfolio"
TOP_K = 4

TURN_WINDOW = 5
MAX_TOOL_ROUNDS = 1

CONTEXT_SEPARATOR = "\n\n---\n\n"

TOOL_NAME = "search_connor_knowledge"
TOOL_DESCRIPTION = (
    "Search Connor's resume and interview stories. "
    "Use when the provided context doesn't answer a question about his roles, projects, "
    "skills, or results."
)
