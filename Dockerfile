FROM python:3.12-slim

WORKDIR /app

# Install uv (the package manager this project already uses — see uv.lock)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy only the dependency files first so Docker can cache this layer —
# it only re-installs packages when pyproject.toml/uv.lock actually change,
# not on every code edit.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Now copy the actual backend code
COPY my-chef.py chef.py database.py databasemodel.py usermodel.py ./

EXPOSE 8000

CMD ["uv", "run", "--no-project", "uvicorn", "my-chef:app", "--host", "0.0.0.0", "--port", "8000"]
