.PHONY: up down logs rebuild clean

up:
	docker compose -f infra/compose.yaml up --build -d

down:
	docker compose -f infra/compose.yaml down

logs:
	docker compose -f infra/compose.yaml logs -f

rebuild:
	docker compose -f infra/compose.yaml build --no-cache

clean:
	docker compose -f infra/compose.yaml down -v --remove-orphans