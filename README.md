# Bedrock Manager
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Bedrock Manager is a dockerized application interface and wrapper that allows you to run and manage one or more dedicated Minecraft Bedrock Servers on the same host while being accessible on game clients on your LAN. Bedrock Manager also exposes REST endpoints for managing the game server for automation purposes.

Based on [minecraft-bedrock-server](https://github.com/debkbanerji/minecraft-bedrock-server) by [Deb Banerji](https://github.com/debkbanerji).

### Suggested Host File Structure
- ./Minecraft
    - ./bedrock-manager
    - ./game-server (your bedrock installation)
    - ./world-backups

### Host Preparation (Ubuntu)
In order for the game server to be accessible and visible to other clients on the lan, the host needs to be configured to allow packets to flow through correctly:

1. Adjust IPTABLES:
    `sudo iptables-legacy -I DOCKER -d 192.168.0.0/24 -j ACCEPT`
2. Turn on ipforward in /etc/sysctl.conf:
      `net.ipv4.ip_forward = 1`
3. Apply the new setting
      `# sysctl -p /etc/sysctl.conf`

### Configuration
Configuration settings are controlled by environmental variables defined in `bedrock-manager/.env`. An example can be found in `.env.example`. Here are some important variables:
- ENVIRONMENT - An arbitrary label that gets appended to the GAME_SERVER_NAME
- UI_ADMIN_HASH - A hex'd sha256 hash of the admin password
- UI_PORT - The port bedrock-manager's for ui and rest endpoints 
- CONFIG_FILE_PATH - Location of a json file used to store game configuration settings
- MOD_IMPORT_PATH - Path for the location of external mods
- SCHEDULE_BACKUPS=false
- RESTORE_BACKUP_ON_STARTUP=false
- GAME_SERVER_PATH="/home/andrew/Minecraft/production/server"
- GAME_SERVER_PORT=19132        # default is 19132
- GAME_SERVER_PORTV6=19133      # default is 19133
- CONTAINER_DNS_SERVER=8.8.8.8  # This google's free dns
- CONTAINER_IP="192.168.0.10"   # A free address on your lan to allocate to the container
- CONTAINER_NAME="bedrock-manager-1"

### Start the Container
1. Sometimes it's necessary/helpful to prune docker resources: `docker system prune`
2. From within your /bedrock-manager folder, run: `docker-compose up --build`. After the image builds and starts, the UI should be accessible on the ip address and port you indicated in .env.

### Connecting to the UI
The UI allows you to monitor stuff such as recent server output and performance. You can also view connected players, manually create backups, restore backups, stop the server, etc.
