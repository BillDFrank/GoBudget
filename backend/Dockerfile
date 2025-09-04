FROM python:3.11-slim
WORKDIR /code
COPY requirements.txt .
RUN pip install -r requirements.txt
# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY ./app ./app
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]