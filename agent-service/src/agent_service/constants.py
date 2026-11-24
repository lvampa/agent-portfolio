"""Model, retrieval, and prompt values that must match the n8n workflow they replace."""

CHAT_MODEL = "models/gemini-3.5-flash-lite"
CHAT_TEMPERATURE = 0.6
CHAT_MAX_OUTPUT_TOKENS = 1024
# langchain-google-genai treats max_retries as attempts: 1 means one try and no retry, and 0 means
# the SDK default of 5 retries. 2 gives the one retry the spec asks for.
CHAT_MAX_ATTEMPTS = 2
CHAT_TIMEOUT_S = 8
EMBED_TIMEOUT_S = 5

# A whole turn can make 2 chat calls and 2 embedding calls. This stays under n8n's 25 s HTTP
# timeout, so the service answers 502 before n8n gives up on it.
TURN_BUDGET_S = 22
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
