release: python backend/manage.py migrate
web: cd backend && gunicorn core.asgi:application -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:$PORT
worker: cd backend && celery -A core worker -l info
