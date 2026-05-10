FROM tomcat:9.0-jdk17-temurin

# Copy AM WAR
COPY AM-7.5.0.war /usr/local/tomcat/webapps/openam.war

EXPOSE 8080

CMD ["catalina.sh", "run"]