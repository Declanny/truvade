.PHONY: build up down test lint

build:
	docker compose up --build

up:
	docker compose up

down:
	docker compose down

test:
	uv run pytest -q

lint:
	uv run ruff format . && uv run ruff check .
