FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY pentest-agent ./pentest-agent

# Fail the image build if the agent was not in the git checkout / build context.
RUN test -f pentest-agent/backend/web_pentest/routes.py \
    && test -d pentest-agent/core/skills/web \
    || (echo "BUILD ERROR: pentest-agent/ is missing. Commit pentest-agent/ to the repo and rebuild." && exit 1)

ENV PHANTOMX_DB_PATH=/app/data/phantomx.db
ENV PENTEST_AGENT_ROOT=/app/pentest-agent
RUN mkdir -p /app/data

# Fail the image build if the app cannot import (catches missing source files on deploy).
RUN python -c "from app.main import app; print('app import ok')"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
