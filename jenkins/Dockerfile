FROM jenkins/jenkins:lts

# Switch to root to install packages
USER root

# Install basic prerequisites and Docker CLI
RUN apt-get update && \
    apt-get install -y apt-transport-https ca-certificates curl gnupg2 wget lsb-release docker.io

# Install uv (Python package manager & Python installer)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Install Python 3.12 via uv
RUN uv python install 3.12
ENV UV_PYTHON="3.12"

# Install Trivy via install script
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Run Jenkins as root to ensure access to /var/run/docker.sock
USER root
