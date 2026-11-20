FROM ghcr.io/astral-sh/uv:0.10.12 AS uv

FROM python:3.14.10-slim

COPY --from=uv /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Dependencies first, so source changes do not reinstall them.
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev

# A named volume copies this ownership on first use, so uid 1000 can write checkpoints.
RUN mkdir /data && chown 1000:1000 /data

USER 1000

EXPOSE 8000

# No curl in the slim image. The same one-liner can serve as the ECS health check.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"]

CMD ["uvicorn", "agent_service.app:app", "--host", "0.0.0.0", "--port", "8000"]
