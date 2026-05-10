FROM eclipse-temurin:17-jre-jammy

ENV IG_HOME=/opt/ig

WORKDIR /opt

# Copy full extracted folder
COPY identity-gateway-2024.6.0 ${IG_HOME}

# Make scripts executable
RUN chmod +x ${IG_HOME}/bin/*.sh

EXPOSE 8080

CMD ["sh", "-c", "${IG_HOME}/bin/start.sh"]