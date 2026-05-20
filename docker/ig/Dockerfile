FROM eclipse-temurin:17-jre-jammy

ENV IG_HOME=/opt/ig

WORKDIR /opt

COPY identity-gateway-2024.6.0 ${IG_HOME}

COPY config/ ${IG_HOME}/config/

RUN chmod +x ${IG_HOME}/bin/*.sh

EXPOSE 8080
EXPOSE 8085

CMD ["sh", "-c", "${IG_HOME}/bin/start.sh"]