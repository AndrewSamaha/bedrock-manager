# Host Setup 
# 1. Adjust IPTABLES:
#    sudo iptables-legacy -I DOCKER -d 192.168.0.0/24 -j ACCEPT
# 2. Turn on ipforward in /etc/sysctl.conf:
#      net.ipv4.ip_forward = 1
#    and Apply the new setting
#      # sysctl -p /etc/sysctl.conf
#

FROM ubuntu

RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "options edns0 trust-ad" >> /etc/resolv.conf && \
    apt-get update && \
    apt-get install -y -q curl gnupg2 && \
    curl http://nginx.org/keys/nginx_signing.key | apt-key add - && \
    apt-get install -y -q inetutils-ping && \
    apt-get install -y -q nginx

RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "options edns0 trust-ad" >> /etc/resolv.conf && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y -q nodejs git


COPY . /bedrock-manager
WORKDIR /bedrock-manager
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "options edns0 trust-ad" >> /etc/resolv.conf && \
    npm install

EXPOSE 80 19132 19133 19232 19233

CMD ["npm", "run", "start"]