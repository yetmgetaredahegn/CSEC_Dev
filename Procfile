release: python backend/manage.py migrate
web: gunicorn core.asgi:application -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:$PORT
worker: celery -A core worker -l info
