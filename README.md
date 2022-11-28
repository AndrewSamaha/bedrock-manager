# Bedrock Manager
An interface and wrapper for Minecraft Bedrock with locally-managed mod and configuration versioning using GIT.

Based on [minecraft-bedrock-server](https://github.com/debkbanerji/minecraft-bedrock-server) by [Deb Banerji](https://github.com/debkbanerji).


### Starting the server
Since this is a [Node.js](https://nodejs.org/) application, after you download the code, you need to run the following command from the terminal within the directory you installed it to:
`npm install`

After that, you can start the server with the following command:
`npm start`

You don't need to rerun `npm install` every time you run the server, just `npm start`

### Stopping the server
**DO NOT use Ctrl+C/termination/kill commands to stop the server**

The server has built in protections to restore the state of your world if it is killed in a non graceful manner or something else bad happens (that's what the backups are for), but you may lose all progress since your last save.

In order to properly stop the server, type in the following command:
`stop`

### Connecting to the server

#### Connecting to the UI
If you've enabled backups in the UI section of the config file, you can access the web UI on the port you've defined in the UI section, so if your UI port is `3000`, you'll be able to access the UI on the machine you're running the server on at `localhost:3000` in your browser. If you want other people to be able to access this admin UI, you can forward this port using the information in the next section, but be careful when doing this - while the UI has some protection against stuff like replay attacks, and every change request needs to be authenticated, the server does not (yet) have a UI killswitch or other mechanism to protect against repeated password guesses. Also avoid sharing the UI if you don't want other people to see stuff like the terminal ouput for the server, or a list of backups, since these requests do not require an admin code.

The UI allows you to monitor stuff such as recent server output and performance. You can also view connected players, manually create backups, restore backups, stop the server, etc.

#### Port forwarding/IP stuff
Take a note of the `server-port` field that you set under `server-properties` in `config.json`. This is the port that the server will listen on once you set up port forwarding, and you'll need to give this to anyone who wants to connect to it. The default value for this is `19132`.

First, you need to figure out what your machine's IP address within your local network is. I found mine using the `ifconfig` command in the terminal, but if that doesn't work, a little bit of Googling should help you find it. It's usually something like `192.168.(something).(something)`

Once you have your port, and the internal IP address of your machine, you need to set up port forwarding on your router. This can vary from router to router, but shouldn't be too tricky - I recommend Googling how to do this. You want to associate the port that your server will listen on to your machine's local ip address.

Also take a note of your external IP address - Googling 'what is my ip' will give this to you. (Google gives it to you within the search results page). If you don't link a domain, you'll have to give this to your friends so they can connect to your server, so be extremely careful who you share this with (also be very careful about who you share the domain with).

## The Backup System
![Redstone](readme-assets/redstone.png)

The `backup` field in the `config.json` file defines how the server behaves with regard to creating backups.

All backups are stored in the `backups` folder as zip files with the timestamp of the backup followed by the type of the backup. If `use-aws-s3-backup` is set to true, backups will also be synced to an Amazon S3 bucket.

### Types of backups

There are 4 types of backups that can be created by the server:

| Backup Type | Description |
| ----------- | ----------- |
| `SCHEDULED` | These types of backups are periodically created by the server at regular intervals, according to the value defined in `backup-frequency-minutes`. Be careful not to make this too small if your world size grows or as the time it takes to create backups increases, scheduled backups may overlap. If you keep the default value, this is unlikely to happen unless your world is very large and/or your internet is very slow. |
| `MANUAL` | Typing in the `backup` command causes one of these backups to be created. |
|`ON_STOP`| One of these backups is created every time the server is gracefully stopped using the `stop` command |
|`ON_FORCED_STOP`| If the server is killed ungracefully, it will try to create one of these types of backups. This is more like a 'last resort' that may also help with debugging. These backups are very sketchy and due to the nature of forced stops they could be incomplete, corrupted, or not uploaded to Amazon S3 properly. |

### Remote Backups

Whenever a backup is created, if `use-aws-s3-backup` is set to true, the software uploads (or in the case of `ON_FORCED_STOP` backups, attempts to upload) the backup to an Amazon S3 bucket for the account you set up.

### Restoring backups

Whenever the server starts, if `use-aws-s3-backup` is set to true, the latest backups according to creation time will be retrieved from Amazon S3 and added to the directory of local backups. After that, the latest backup that is not of the type `ON_FORCED_STOP` will be used to replace the state of the world on the server before starting the server. (so non backed up data will be lost) If the server is always shut down correctly, then this backup will always of the type `ON_STOP`.

**Warning: It's a good idea to make sure your computer's time is synced and consistent so the correct backups are always retrieved and restored**

If you want to restore a specific backup to the server when it is running, you can use the `force-restore <BACKUP_FILE_NAME>` command, which will create a separate backup of the current server state, gracefully stop the server, restore the backup you specified, and restart the server. You can also do this from the UI pretty easily.

This is also useful if you want to import your existing world into the server. Just make sure your level name matches the one in your config and create a zip file with your level (a folder matching the level name) at the root. Then name your zip file something you'll recognize, drop it into the `backups` folder and restore it either from the UI or the terminal. If you're unsure about the format, you can look at some of the backups the server creates on its own.

### Automatic purging of old backups

For both local, and remote backups, the software only keeps a limited number of backups, deleting the oldest ones once new ones are created. How many backups to keep is determined on a per type basis based on the values in `num-backups-to-keep-for-type`. Setting one of these values to `-1` means old backups of that type will never be deleted.

## Known issues
### Still in alpha

Mojang's server software, which this software uses, is still in alpha, so it could be buggy. One of my motivations for writing this software was so that the automatic backups could protect me from losing information due to bugs in the alpha server software. It's worked great for me and my friends so far, but as always, please be somewhat careful.

### ~~Windows incompatibilities~~ (Seemingly fixed)
~~The software currently only supports Ubuntu 18.04+ as of now, though a Windows 10 version of Mojang's server software does exist. This is because there is [an issue with the last version I checked that prevents backups from being effectively created](https://bugs.mojang.com/browse/BDS-2733). This is kind of annoying since it means you can't run the server and connect to it from the same computer, barring virtual machines (Minecraft Bedrock Edition is available on Windows 10 but not Ubuntu). If the backup issue is fixed, and I get the time, lmk and I will add Windows 10 support so you don't need the extra machine and OS.~~
This issue seems to have been fixed somewhere around Mojang's server version `1.16.201.02`, and my testing seems fine so I've enabled Windows support in this repo. Lmk if you run into any issues.

### Scaling issues?
I wouldn't recommend using this server to host dozens upon dozens of clients. It might work well given the correct configuration values, hardware, and network bandwidth, but I haven't done any large scale tests, so attempt this at your own peril.

## Disclaimer
Please read the license for this repository. I am not responsible for any hardware/software/financial?/legal? problems, lost worlds, or any other issues that may arise when using this software. If you do lose information, however, I could help you if you open a GitHub issue, though once again I am not responsible for anything that may go wrong when attempting recovery.

If you do find a bug, opening an issue on GitHub would be great - as I've mentioned earlier, I play with my friends on a server running this software very often, so making the experience better for me, them, and anyone else who uses it is always a win.
