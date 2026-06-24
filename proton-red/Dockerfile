FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Atomic Red Team YAML catalog (required for technique execution)
RUN git clone --depth 1 --filter=blob:none --sparse https://github.com/redcanaryco/atomic-red-team.git _art \
    && cd _art \
    && git sparse-checkout set atomics \
    && mv atomics /app/atomics \
    && cd .. \
    && rm -rf _art

ENV ART_ATOMICS_PATH=/app/atomics
ENV RESULTS_DIR=/app/results
RUN mkdir -p /app/results

EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
