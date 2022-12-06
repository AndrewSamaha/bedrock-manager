# Bedrock Manager
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
An interface and wrapper for Minecraft Bedrock with locally-managed mod and configuration versioning using GIT.

Based on [minecraft-bedrock-server](https://github.com/debkbanerji/minecraft-bedrock-server) by [Deb Banerji](https://github.com/debkbanerji).

### Connecting to the UI
You can access the web UI on the port you've defined in the UI section, so if your UI port is `3000`, you'll be able to access the UI on the machine you're running the server on at `localhost:3000` in your browser. If you want other people to be able to access this admin UI, you can forward this port using the information in the next section, but be careful when doing this - while the UI has some protection against stuff like replay attacks, and every change request needs to be authenticated, the server does not (yet) have a UI killswitch or other mechanism to protect against repeated password guesses. Also avoid sharing the UI if you don't want other people to see stuff like the terminal ouput for the server, or a list of backups, since these requests do not require an admin code.

The UI allows you to monitor stuff such as recent server output and performance. You can also view connected players, manually create backups, restore backups, stop the server, etc.
