# PBX MPP Config Manager

Small web app to connect to FreePBX over SFTP, list Cisco MPP `.xml` config files, view and
edit fields, and upload saved or new configs. Runs as a container on a management server.

## Features
**Accounts**
- Sign-in with per-user accounts, optional TOTP two-factor and single-use recovery codes
- Administrator and user roles; every write is attributed to the user who made it
- Can run behind an authentication reverse proxy instead (Authelia, Authentik, oauth2-proxy)

**Editing**
- Save multiple PBX server profiles (host/port/user/remote dir) and connect using only a password
- File list led by `Station_Display_Name`, since config file names are MAC addresses
- Open and edit XML as tag/value/attribute rows, with a sticky header for large configs
- Soft-delete rows with one-click Undo, duplicate rows, reset to the last loaded state
- Show only important fields, or hide empty ones; search across tag, value and attributes
- `Ctrl`/`Cmd`+`S` to save; Save buttons at the top and bottom of the editor
- Create new config files from a template and upload them

**Bulk changes and history**
- Bulk edit one tag across many config files at once, preview-first, with live progress
- Per-server change log of every write, showing field-level before and after, kept between
  connections and exportable to CSV

## Bulk Edit
Change a single setting across all (or selected) phone configs without opening each file.

1. Tick the files in the **XML Files** list. `Select Shown` ticks everything matching the
   current search box, so you can filter first (e.g. by station name) and then select.
2. In the **Bulk Edit** panel enter the **Tag** (e.g. `Proxy_1_`) and pick a **Mode**:
   - **Set** - update the tag, or add it if the file does not have it yet.
   - **Update only where tag exists** - never creates the tag; files without it are skipped.
   - **Delete tag** - removes the tag entirely.
3. Leave **Attributes** blank to keep each file's existing attributes (e.g. `ua="na"`).
   Supply JSON such as `{"ua":"rw"}` only if you want to overwrite them.
4. Click **Preview Changes**. Nothing is written yet - you get a per-file table showing the
   current value and what it would become.
5. Click **Apply to PBX** to write. You will be asked to confirm first.

While a preview or apply is running, a progress bar shows `Applying to 3 of 47: spa003.xml`
so you can see it working file by file. The buttons stay disabled until the run finishes.
Only one bulk run can be in flight at a time, because the app holds a single SFTP connection.

Safety behaviour:
- Nothing is written until you preview and then explicitly confirm.
- Editing the tag/value/mode or changing the file selection clears the preview, so
  **Apply** can never run against a stale preview.
- Files already holding the target value are reported as "No change needed" and are
  **not** rewritten, so untouched files keep their existing formatting.
- One unreadable or unwritable file does not abort the batch; it is reported as an error
  and the remaining files still process.

## Quick Start
For a server deployment see [Running in Docker](#running-in-docker). To run it directly:

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Start the app:
   ```powershell
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000).
4. Create the first administrator when prompted, and enrol two-factor if you want it. See
   [Accounts and two-factor authentication](#accounts-and-two-factor-authentication).
5. Add a PBX server profile, enter its password, and connect.

## Change Log
Every write the app makes to a phone config is recorded: bulk edits, single-file saves, and
new file creation. Previews are **not** logged, because they change nothing.

Editor saves are diffed against the file's previous contents, so the log names the exact
fields that moved rather than just "the file was saved":

| User | Action | Phone | File | Tag | Before | After |
|---|---|---|---|---|---|---|
| alice | Changed field | Front Desk - 7001 | `spa001.xml` | `Voice_Mail_Number` | `*97` | `*555` |
| alice | Added field | Front Desk - 7001 | `spa001.xml` | `Time_Zone` | (not set) | `GMT+10:00` |
| bob | Removed field | Kitchen - 7002 | `spa002.xml` | `Admin_Passwd` | `secret` | (removed) |

The **User** column is the signed-in account that made the change. Entries written before
authentication was added show `-`.

The **Phone** column is the file's `Station_Display_Name`, since config file names are MAC
addresses. It records the name as it was *before* the change, so a row that renames a phone
still identifies it by the name you knew it as. The same column appears in the bulk-edit
preview, so you can see which phones you are about to touch before writing. Files that have
no station name, or that could not be read, show `-` rather than a guess.

A save that changes nothing records a single "No field changes" row. Saves touching more
than 25 fields (loading a template, for example) list the first 25 and then a
`+N more fields changed` row, so one save cannot flood the history. Creating a file is
recorded as a summary, since there is no previous version to compare against.

- History is kept **per PBX server** and survives disconnects and app restarts.
- Servers connected via a saved profile are tracked by profile, so the history follows the
  server even if its host address changes. Direct connections are tracked by host + directory.
- Use the **PBX Server** dropdown to view the history of any server you have written to,
  including ones you are not currently connected to.
- **Filter** searches file name, tag, and values. **Export CSV** exports the current filter.
- **Clear Log** permanently deletes that server's history after a confirmation.
- Each server keeps its most recent 2000 entries; older ones roll off.
- Stored in `data/change-log.json`.

## Running in Docker

```bash
docker compose up -d --build
```

Then browse to <http://localhost:3000> **on the management server itself**.

### Read this before exposing it
The app requires a sign-in with optional two-factor (see
[Accounts and two-factor authentication](#accounts-and-two-factor-authentication)), but it
still speaks plain HTTP. Over anything other than loopback that means passwords and session
cookies cross the network in the clear, so put TLS in front before exposing it.

`docker-compose.yml` therefore publishes to **loopback only** (`127.0.0.1:3000:3000`).
To reach it from another machine, pick one:

- **Reverse proxy with authentication** (recommended) - put Caddy/nginx/Traefik in front and
  require a login there. Keep the container on loopback or an internal Docker network.
- **SSH tunnel** - leave it on loopback and run
  `ssh -L 3000:127.0.0.1:3000 you@management-server` from your workstation.
- **Trusted LAN only** - change the mapping to `<lan-ip>:3000:3000` and restrict with a
  firewall rule. Least safe; do this knowingly.

Run **one instance only**. The SFTP connection and in-flight bulk jobs are held in memory,
so a second replica would not share them.

### Persistent data
Saved servers, templates and the change log live on the `pbx-data` volume, mounted at
`/data`. They survive `docker compose down` and image rebuilds. To back them up:

```bash
docker run --rm -v pbx-data:/data -v "$PWD:/backup" alpine tar czf /backup/pbx-data.tgz -C /data .
```

### The default template
The built-in "Default Template" is read from the first of these that exists:

1. `DEFAULT_TEMPLATE_PATH` environment variable
2. `default-template.xml` inside the data directory (i.e. `/data/default-template.xml`)
3. `examples/default-template.xml`, the placeholder shipped with the app

So a fresh install always has a working template, but it is a **placeholder** - see
[Example template](#example-template) below. Supply your own with:

```bash
docker cp your-template.xml pbx-manager:/data/default-template.xml
docker compose restart
```

The container logs which template it resolved at startup, so check `docker compose logs` if
"Default Template" looks wrong.

### Environment variables
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the app listens on |
| `DATA_DIR` | `./data` (`/data` in the image) | Where the JSON stores are written |
| `DEFAULT_TEMPLATE_PATH` | unset | Explicit path to the default template XML |
| `TZ` | `UTC` | Affects timestamps shown in the change log |
| `COOKIE_SECURE` | `false` | Set `true` when serving over HTTPS so the session cookie is marked Secure |
| `TRUST_PROXY_AUTH` | `false` | Accept a reverse proxy's authentication header (see above) |
| `PROXY_USER_HEADER` | `remote-user` | Which header carries the username in that mode |

### Updating
```bash
docker compose up -d --build
```
The volume is untouched by a rebuild, so your servers and change log carry over.

## Accounts and two-factor authentication
The app has its own sign-in. On first run it asks you to create an administrator, then
offers to enrol two-factor straight away.

- **Passwords** are hashed with scrypt (salted, per-user). They are never stored or logged
  in plain text and never leave the server.
- **Two-factor** is standard TOTP (RFC 6238), so any authenticator works - Google
  Authenticator, Aegis, 1Password, Bitwarden. Enrol by scanning the QR code, or type the
  secret in by hand.
- **Recovery codes**: ten single-use codes are issued at enrolment and shown once. Save
  them - they are stored hashed and cannot be recovered, only regenerated.
- **A used TOTP code cannot be replayed**, including the one used to enrol. If you enrol
  and immediately sign out, wait for the next code.
- **Lockout**: five failed attempts locks an account for 15 minutes.
- **Sessions** last 7 days, or 8 hours idle, and survive a restart. Sign out ends them
  immediately.

### Roles
| Role | Can do |
|---|---|
| Administrator | Everything, plus add/remove users and reset another user's two-factor |
| User | Connect to a PBX, edit and bulk edit configs, read the change log |

Every write records **which user made it** in the Change Log. Entries written before
authentication existed show `-`.

### If someone loses their authenticator
An administrator opens **Users** and clicks **Reset MFA**. That user can then sign in with
their password alone and enrol again. If the *only* administrator is locked out, stop the
container, edit `users.json` in the data directory, set `"mfaEnrolled": false` and
`"totpSecret": null` on that account, and start it again.

### Behind Nginx Proxy Manager
Use NPM purely for TLS and hostname routing and let the app's own sign-in handle
authentication. **Leave `TRUST_PROXY_AUTH` off** - that setting is only for proxies that
authenticate *for* the app (see [Behind an authentication proxy](#behind-an-authentication-proxy)).

The tidiest arrangement puts both containers on one Docker network so nothing is published
on the host at all:

1. Find the network NPM runs on (often `npm_default`):
   ```bash
   docker inspect <npm-container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'
   ```
2. In `docker-compose.yml`, **delete the `ports:` block** and join that network:
   ```yaml
   services:
     pbx-manager:
       # ports:                      <- removed; only the proxy needs to reach it
       networks:
         - proxy
   networks:
     proxy:
       name: npm_default             # whatever step 1 printed
       external: true
   ```
3. Set `COOKIE_SECURE=true` so the session cookie is only sent over HTTPS:
   ```yaml
   environment:
     COOKIE_SECURE: "true"
   ```
4. `docker compose up -d`
5. In NPM add a Proxy Host:
   - **Domain**: your hostname
   - **Scheme**: `http`
   - **Forward Hostname**: `pbx-manager` (the container name)
   - **Forward Port**: `3000`
   - **Block Common Exploits**: on
   - **Websockets Support**: not needed; the app polls over plain HTTP
   - **SSL tab**: request a certificate and turn on **Force SSL** and **HTTP/2**

The app does not read `X-Forwarded-*` headers, so no extra proxy configuration is required.
Lockout is tracked per account rather than per IP, so it keeps working correctly even though
every request now arrives from the proxy's address.

If you would rather keep the host port instead of sharing a network, NPM must forward to the
host rather than to `127.0.0.1` (which inside NPM's container means NPM itself). In that case
change the mapping to your LAN IP and forward to that - but the hop from NPM to the app is
then unencrypted, so only do it on a network you trust.

> **Check the startup log after switching.** It prints `Session cookie: Secure ...` once
> `COOKIE_SECURE=true` is in effect. If you set that flag while still serving plain HTTP,
> sign-in will silently fail - the browser accepts the cookie but never sends it back.

### Behind an authentication proxy
If you would rather have Authelia, Authentik or oauth2-proxy handle sign-in, set:

```
TRUST_PROXY_AUTH=true
PROXY_USER_HEADER=remote-user
```

The app then trusts that header to name the signed-in user, who must still exist as an
account here (create them first, password unused). **Only enable this when the proxy strips
the header from incoming client requests and the app is not reachable any other way** -
otherwise anyone who reaches the port can impersonate any user by setting the header. The
app prints a warning at startup whenever this mode is on.

## Example template
`examples/default-template.xml` is a complete 441-field Cisco MPP `flat-profile` config used
as the fallback "Default Template". Every value in it is a **placeholder**:

| Field | Placeholder |
|---|---|
| `Admin_Passwd`, `Admin_Password`, `Password_1_` | `12345` |
| `Proxy_1_`, `Profile_Rule`, `Picture_Download_URL` | `192.168.1.10` |
| `Station_Display_Name` | `Reception - 1001` |

> **Change these before provisioning any real phone.** Loading this template and creating a
> config would set the phone's admin password to `12345` and point it at a proxy that almost
> certainly is not yours. It exists so the editor opens with a realistic field set, not as a
> deployable config.

To make your own the default, drop it at `data/default-template.xml` (that directory is
gitignored) or point `DEFAULT_TEMPLATE_PATH` at it. Either takes precedence over the example.

## Notes
- **SFTP passwords are never persisted** - you type them at connect time. Only the profile
  (host, port, username, remote directory) is saved.
- XML is rebuilt on save, so formatting and comments may differ from the source file. Bulk
  edit only rewrites files it actually changes, so unaffected files are left untouched.
- The **SFTP connection is shared**: once someone connects, any signed-in user works through
  that connection. The change log records who did what, but users are not isolated from one
  another. Give accounts only to people you would trust with the PBX password.
- The `data/` directory holds accounts, sessions, saved servers, templates and the change
  log. It is gitignored and must stay that way - it contains password hashes, TOTP secrets
  and templates that may carry phone admin passwords.
- Values are trimmed of leading and trailing whitespace when a config is parsed.

## License
MIT - see [LICENSE](LICENSE).
