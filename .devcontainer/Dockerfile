FROM debian:bookworm as builder

RUN apt-get update && \
    apt-get install -y git curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

CMD ["tail", "-f", "/dev/null"]

