FROM eclipse-temurin:17-jre-jammy

# Install procps (required for DS status checks)
RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*

WORKDIR /opt
COPY ./opendj /opt/opendj
ENV PATH="/opt/opendj/bin:${PATH}"

COPY entrypoint.sh /opt/entrypoint.sh
RUN sed -i 's/\r//' /opt/entrypoint.sh && chmod +x /opt/entrypoint.sh

# Change this line to call bash explicitly
ENTRYPOINT ["/bin/bash", "/opt/entrypoint.sh"]