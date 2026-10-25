FROM python:3.12-slim
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
ENV PATH="/app/.venv/bin:$PATH"
COPY my-chef.py chef.py database.py databasemodel.py usermodel.py ./
EXPOSE 8000
CMD ["uvicorn", "my-chef:app", "--host", "0.0.0.0", "--port", "8000"]