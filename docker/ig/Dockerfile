FROM eclipse-temurin:17-jre-jammy

ENV IG_HOME=/opt/ig

WORKDIR /opt

COPY identity-gateway-2024.6.0 ${IG_HOME}
COPY config/ ${IG_HOME}/config/
COPY scripts/ ${IG_HOME}/scripts/

RUN chmod +x ${IG_HOME}/bin/*.sh

EXPOSE 8080

CMD ["sh", "-c", "rm -f ${IG_HOME}/tmp/ig.pid && ${IG_HOME}/bin/start.sh ${IG_HOME}"]