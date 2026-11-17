FROM python:3.11-slim

# Install system dependencies (ffmpeg and OpenCV requirements)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast python package management
RUN pip install uv

WORKDIR /app

# Copy dependency specifications
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
RUN uv sync --frozen --no-dev

# Copy application source code
COPY . .

# Ensure data directories exist
RUN mkdir -p /app/data/sqlite /app/data/chroma /app/data/personas /app/data/knowledge_base

EXPOSE 8000

# Run FastAPI server via uv
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
