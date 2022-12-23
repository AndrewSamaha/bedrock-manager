FROM ubuntu

ARG CONTAINER_DNS_SERVER
ARG UI_PORT
ARG GAME_SERVER_PORT
ARG GAME_SERVER_PORTV6

RUN echo nameserver ${CONTAINER_DNS_SERVER} > /etc/resolv.conf && \
    echo "options edns0 trust-ad" >> /etc/resolv.conf && \
    apt-get update && \
    apt-get install -y -q curl git && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y -q nodejs

COPY . /bedrock-manager
WORKDIR /bedrock-manager
RUN echo nameserver ${CONTAINER_DNS_SERVER} > /etc/resolv.conf && \
    npm install

EXPOSE ${UI_PORT} ${GAME_SERVER_PORT} ${GAME_SERVER_PORTV6}

CMD ["npm", "run", "start"]