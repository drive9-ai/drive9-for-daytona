# Custom sandbox image with drive9 + fuse3 + git pre-installed.
# Build:  docker build -t ghcr.io/drive9-ai/sandbox-drive9 .
# Push:   docker push ghcr.io/drive9-ai/sandbox-drive9

FROM ubuntu:22.04

RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
      fuse3 git curl ca-certificates nodejs npm && \
    rm -rf /var/lib/apt/lists/* && \
    printf "user_allow_other\n" > /etc/fuse.conf

# Install drive9 binary from GitHub releases
RUN curl -fsSL https://raw.githubusercontent.com/mem9-ai/drive9-fe/main/site/releases/drive9-linux-amd64 \
      -o /usr/local/bin/drive9 && \
    chmod +x /usr/local/bin/drive9

# Verify
RUN drive9 --version && fusermount3 --version && git --version && node --version
