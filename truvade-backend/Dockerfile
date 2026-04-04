FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --frozen

COPY . .

RUN uv run python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["sh", "-c", "uv run python manage.py migrate --noinput && uv run python manage.py runserver 0.0.0.0:8000"]
