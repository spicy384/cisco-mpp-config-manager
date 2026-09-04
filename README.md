# PBX MPP Config Manager

Small web app to connect to FreePBX over SFTP, list Cisco MPP `.xml` config files, view and
edit fields, and upload saved or new configs. Runs as a container on a management server.

## Features
**Accounts**
- Sign-in with per-user accounts, optional TOTP two-factor and single-use recovery codes
- Administrator, user and read-only viewer roles; every write is attributed to the user who made it
- Can run behind an authentication reverse proxy instead (Authelia, Authentik, oauth2-proxy)
- SSH host keys are remembered on first connection and checked every time after, so the
  PBX password is never sent to a host that is not the one you connected to before

**Editing**
- Quick editor for everyday changes - set a line, speed dial, BLF or wallpaper without
  knowing a single tag name - with the full tag editor still there as **Advanced**
- Save multiple PBX server profiles (host/port/user/remote dir) and connect using only a password
- File list led by `Station_Display_Name`, since config file names are MAC addresses
- Open and edit XML as tag/value/attribute rows, with a sticky header for large configs
- Soft-delete rows with one-click Undo, duplicate rows, reset to the last loaded state
- Show only important fields, or hide empty ones; search across tag, value and attributes
- `Ctrl`/`Cmd`+`S` to save; Save buttons at the top and bottom of the editor
- A save is refused if the file changed on the PBX since it was opened, naming the last
  writer, so two people editing the same phone cannot silently overwrite each other
- Create new config files from a template and upload them

**Bulk changes and history**
- Bulk edit one tag across many config files at once, preview-first, with live progress
- Per-server change log of every write, showing field-level before and after, kept between
  connections and exportable to CSV
- Every write keeps a copy of the file first: restore any earlier version from the editor's
  **History** or straight from the change log, or roll back a whole bulk batch in one go
- Tell a phone to fetch its new configuration - one phone with **Resync Phone**, or every
  phone a bulk edit changed with a tick box - using the SSH connection already open

## Quick editor
The editor has two tabs. **Quick** covers the changes you make most often without needing to
know tag names or value syntax. **Advanced** is the original tag/value/attribute table,
unchanged, for anything Quick does not cover.

Everything Quick writes can be applied to **the open phone** or to **the phones ticked in the
XML Files list**. Bulk changes go through the same preview-then-confirm flow as
[Bulk Edit](#bulk-edit), so you always see a per-phone diff before anything is written.

### Lines and Buttons
Pick one of the 16 keys and choose what it does. For example, setting button 6 to
**BLF + speed dial + call pickup** for extension `1001` named `IT Helpdesk` writes:

```xml
<Extension_6_>Disabled</Extension_6_>
<Extended_Function_6_>fnc=blf+sd+cp;sub=1001@srv1.pbx.example.com:5060;nme=IT Helpdesk</Extended_Function_6_>
```

| Type | What it writes |
|---|---|
| **Line** | `Extension_N_`, `User_ID_N_`, `Display_Name_N_`, `Password_N_`, `Short_Name_N_` |
| **Speed dial** | `fnc=sd;ext=<ext>@<server>;nme=<name>` |
| **BLF** | `fnc=blf;sub=<ext>@<server>;nme=<name>` |
| **BLF + speed dial + call pickup** | `fnc=blf+sd+cp;sub=<ext>@<server>;nme=<name>` |
| **Custom** | Your own `fnc=` string, with the surrounding tags handled for you |
| **Unused** | Clears the key |

Setting a **Line** asks for the extension, display name, SIP password and short name, and
writes all five tags with the right attributes. Assigning any other function sets
`Extension_N_` to `Disabled`, because a key cannot both register a line and carry an
extended function.

The `@server` part comes from **SIP Server for speed dial / BLF** on the saved PBX profile.
Without it, Quick refuses to build a speed dial or BLF rather than writing a broken target.

Only syntax confirmed against real configuration is offered as a named type. Anything else -
park, DND, ACD and so on - goes through **Custom**, where you supply the `fnc=` string and the
app still handles `Extension_N_` and the tag plumbing.

Each key shows what it is currently set to, read back out of the config, and the form is
pre-filled from it. Before you apply, the editor shows exactly which tags and values it will
write.

### Settings
| Setting | Tags written |
|---|---|
| Station display name | `Station_Display_Name` |
| Voicemail number | `Voice_Mail_Number` |
| Time zone | `Time_Zone` |
| NTP server | `Primary_NTP_Server` |
| Admin password | `Admin_Passwd` (`ua="rw"`) |
| Wallpaper | `Phone_Background` = `Download Picture` and `Picture_Download_URL` |

> Quick changes update the editor but are **not written to the PBX until you press
> Save / Upload** (or, for a bulk change, Apply to PBX). That keeps one save path, so the
> change log and Reset behave exactly as they do for a manual edit.

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
| bob | Removed field | Kitchen - 7002 | `spa002.xml` | `Admin_Passwd` | `(hidden)` | (removed) |

The **User** column is the signed-in account that made the change. Entries written before
authentication was added show `-`.

**Passwords are never recorded.** Any tag whose name contains `passwd`, `password`,
`passphrase` or `secret` is logged as changed with its value replaced by `(hidden)`, so the
log still tells you a SIP or admin password was altered, by whom and when, without storing
it. Clearing one stays visibly empty, so "set" and "cleared" remain distinguishable.

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

## Version history and rollback
Before the app overwrites a config file - an editor save, a bulk apply, a Quick action -
it stores the file exactly as it was. That makes every change undoable:

- **History** in the editor lists the kept versions of the open file (when, why it was
  kept, by whom, phone name, size) with a **Restore** button on each.
- **Restore** in the change log puts the file back as it was *before that row's change*.
- **Roll Back This Batch** appears after a bulk apply and restores every file the batch
  changed, with the same progress bar as the apply.

Restore always shows what will change - the field-level differences between the version
and the file as it is on the PBX right now - before writing anything, and it stores the
current file first, so a restore can itself be undone. If a copy cannot be stored (disk
full, bad permissions) the write is refused rather than made without a way back.

Versions are kept per PBX under `snapshots/` in the data directory, **20 per file** by
default (`SNAPSHOT_KEEP` changes this); the oldest is dropped when a new one is kept. A
version is only ever restored to the server it came from. Files created from scratch have
no earlier version, and nothing is kept for writes made outside this app.

## Resyncing phones
Writing a config file does not change anything on the phone until it next fetches its
configuration. The app can tell it to, by running on the PBX over the SSH connection it
already holds:

```
asterisk -rx "pjsip send notify cisco-check-cfg endpoint {ext}"
```

`{ext}` is the phone's line 1 extension (`User_ID_1_`), which is what Asterisk knows
the phone as. Cisco MPP phones act on the resulting SIP NOTIFY when **Resync From SIP**
is enabled in their provisioning settings (`Resync_From_SIP` = `Yes`, as in the example
template). A phone restarts only if the change it fetched requires it.

Resync is always a separate, deliberate step:

- **Resync Phone** in the editor, next to Save, resyncs the open phone. Save never
  resyncs by itself, so you can make several changes and push them once.
- **Resync changed phones after applying** in Bulk Edit resyncs every phone the batch
  actually changed, as a second stage with its own progress. Untick it and nothing is sent.
  A rollback does not resync; resync the affected phones afterwards if you need to.
- A phone with no line 1 extension is skipped and says so. Every resync, sent, skipped or
  failed, is a row in the change log.

### If resync does not work
Use **Test Resync** in the Connection panel while connected: it runs the command for an
extension you type and shows exactly what the PBX printed. The usual causes:

- **The SSH user cannot run `asterisk`.** Connecting as `root` works out of the box.
  For another user, add it to the `asterisk` group, or set the profile's resync command to
  `sudo asterisk -rx "pjsip send notify cisco-check-cfg endpoint {ext}"` with a matching
  `sudoers` line such as `pbxmgr ALL=(root) NOPASSWD: /usr/sbin/asterisk -rx *`.
- **`Unable to retrieve endpoint`.** The extension is not a PJSIP endpoint. On a chan_sip
  PBX use `asterisk -rx "sip notify cisco-check-cfg {ext}"` instead.
- **`No such command`.** The `cisco-check-cfg` NOTIFY type is missing from
  `pjsip_notify.conf` (or `sip_notify.conf`). FreePBX ships it; a bare Asterisk may not.

The command is saved per PBX server profile and must contain `{ext}`; leave it blank for
the default. The extension is checked before it is inserted - only letters, digits, `_`,
`.` and `-` are accepted - so a config file cannot smuggle shell syntax into the command.

## Running in Docker

```bash
docker compose up -d --build
```

Then browse to <http://localhost:3000> **on the management server itself**.

That root compose file is the simple case: plain HTTP on loopback, reached on the server or
through an SSH tunnel. [`deploy/`](deploy) has ready-made alternatives:

| Setup | Use when | HTTPS handled by |
|---|---|---|
| `docker-compose.yml` (here) | You reach it on the server, or over an SSH tunnel | Nothing - plain HTTP on loopback |
| [`deploy/caddy/`](deploy/caddy) | You have a domain and this host is reachable on 80/443 | Caddy, automatic Let's Encrypt |
| [`deploy/external-proxy/`](deploy/external-proxy) | Your proxy runs on **another host** | The proxy for browsers, the app's own certificate for the hop to it |

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
Saved servers, templates, kept file versions and the change log live on the `pbx-data`
volume, mounted at `/data`. They survive `docker compose down` and image rebuilds. To
back them up:

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
| `TLS_ENABLED` | `false` | Serve HTTPS using a self-signed certificate generated into `DATA_DIR/tls` |
| `TLS_HOSTS` | unset | Extra names/IPs for the generated certificate's SANs, comma separated |
| `TLS_CERT` / `TLS_KEY` | unset | Paths to your own certificate and key; take precedence over `TLS_ENABLED` |
| `TRUST_PROXY_AUTH` | `false` | Accept a reverse proxy's authentication header (see above) |
| `SNAPSHOT_KEEP` | `20` | Versions kept per config file for restore and rollback |
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
| Administrator | Everything, plus add/remove users, change roles, reset another user's two-factor and forget a changed SSH host key |
| User | Connect to a PBX, edit and bulk edit configs, restore, resync, read the change log |
| Viewer | Connect to a PBX and look: open phones, preview a bulk edit, read history and the change log. Cannot change anything on the PBX or in the app |

Roles are enforced by the server on every request, not just hidden in the interface. An
administrator sets a role when adding an account and can change it later from **Users**;
nobody can change their own role, and the last administrator cannot be demoted.

Every write records **which user made it** in the Change Log. Entries written before
authentication existed show `-`.

### If someone loses their authenticator
An administrator opens **Users** and clicks **Reset MFA**. That user can then sign in with
their password alone and enrol again. If the *only* administrator is locked out, stop the
container, edit `users.json` in the data directory, set `"mfaEnrolled": false` and
`"totpSecret": null` on that account, and start it again.

### SSH host keys
The app works like OpenSSH's `known_hosts`. The first time it connects to a PBX it
records the SSH host key fingerprint (shown in the connection bar, in the same
`SHA256:...` form as `ssh-keygen -lf`). Every later connection must present the same
key, or the connection is refused **before the password is sent** and both fingerprints
are shown.

A changed key means one of two things: the PBX was rebuilt or its SSH keys regenerated,
or something between you and the PBX is intercepting the connection. Check the new
fingerprint against the PBX itself before trusting it:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

(Use the key file matching the type the server negotiated - `ed25519`, `ecdsa` or
`rsa`.) If it matches, an administrator clicks **Forget stored key and reconnect**.
Remembered keys live in `known-hosts.json` in the data directory.

### HTTPS
The app serves plain HTTP by default, which is fine on loopback. Turn on TLS when anything
crosses a network - in particular when a reverse proxy runs on a **different host**, because
that hop would otherwise carry passwords, TOTP codes and session cookies in clear text.

**Self-signed, generated for you.** Set `TLS_ENABLED=true` and the app creates a certificate
in `/data/tls` on first boot and reuses it afterwards, regenerating when it is missing,
unreadable, or within 30 days of expiry:

```yaml
environment:
  TLS_ENABLED: "true"
  TLS_HOSTS: "pbx-manager,192.168.1.50"   # names and IPs the cert should cover
  COOKIE_SECURE: "true"
```

`TLS_HOSTS` is optional but worth setting: it becomes the certificate's Subject Alternative
Names, so the address your proxy connects to is actually covered. `localhost`, `127.0.0.1`
and the container hostname are always included.

A self-signed certificate is fine as a **reverse proxy upstream**, because proxies do not
verify upstream certificates by default. A browser connecting directly will warn.

**Bring your own certificate.** Set both `TLS_CERT` and `TLS_KEY` and they take precedence
over generation:

```yaml
environment:
  TLS_CERT: /certs/fullchain.pem
  TLS_KEY: /certs/privkey.pem
  COOKIE_SECURE: "true"
volumes:
  - /etc/letsencrypt/live/pbx.example.com:/certs:ro
```

The app exits with an explanation rather than quietly falling back to HTTP if TLS is
requested but cannot be set up.

### What about Let's Encrypt?
There is no ACME client built in, and for the usual setup you do not want one:

- **Your proxy already does it.** Nginx Proxy Manager, Caddy and Traefik all obtain and renew
  Let's Encrypt certificates for the browser-facing side. That is the leg that needs a
  publicly trusted certificate.
- **This app usually cannot pass validation.** HTTP-01 and TLS-ALPN-01 need the app reachable
  from the internet on port 80/443 at the public name. An internal PBX tool normally is not.
- **It would buy nothing on the proxy hop.** Proxies do not verify upstream certificates, so
  a trusted certificate is no more protective there than the generated self-signed one.

**If you want Let's Encrypt without an existing proxy**, use
[`deploy/caddy/`](deploy/caddy): Caddy runs alongside the app on the same host, obtains and
renews the certificate automatically, and proxies to the app over an internal Docker network
so nothing but Caddy is exposed. That needs a real domain pointing at the host and inbound
TCP 80 and 443.

If you do want a real certificate on the app itself - for example to reach it directly by
hostname without warnings - obtain it with any ACME client that supports **DNS-01** (certbot,
acme.sh, lego), which needs no inbound access, and point `TLS_CERT`/`TLS_KEY` at the result.
Mount certbot's `live` directory and the app picks up renewals when the container restarts:

```bash
certbot certonly --dns-cloudflare -d pbx.example.com
```
```bash
docker compose restart pbx-manager
```

Certificates are only read at startup, so schedule a restart after your renewal hook.

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

#### When NPM is on a different host
A shared Docker network is not available across machines, so the app has to listen on the
network and NPM forwards to it. That hop leaves the machine, so **encrypt it**:

1. Publish on the LAN address rather than loopback, and turn on TLS:
   ```yaml
   ports:
     - "192.168.1.50:3000:3000"     # this host's LAN IP, not 0.0.0.0
   environment:
     TLS_ENABLED: "true"
     TLS_HOSTS: "192.168.1.50"      # whatever NPM will connect to
     COOKIE_SECURE: "true"
   ```
2. Firewall port 3000 so only NPM's address can reach it.
3. In NPM set **Scheme** to `https`, Forward Hostname to `192.168.1.50`, Forward Port `3000`.
   NPM does not verify the upstream certificate, so the self-signed one is accepted.

Without step 1 the browser-to-NPM leg is encrypted and the NPM-to-app leg is not, which
leaves credentials readable by anything on the path between the two LANs.

If you would rather keep the hop unencrypted, that is a deliberate choice: restrict it by
firewall and be aware that anyone able to observe traffic between those networks can read
sign-ins and replay session cookies.

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
  (host, port, username, remote directory, SIP server and resync command) is saved.
- **Values are preserved exactly as written.** Leading zeros, trailing decimal zeros and
  the like survive unchanged, so an extension of `0903` stays `0903` rather than becoming
  `903`.
- Phone configs contain SIP and admin passwords in plain text; that is how Cisco MPP
  provisioning works. The change log redacts them, but the config files themselves and
  `data/templates.json` do not.
- XML is rebuilt on save, so formatting and comments may differ from the source file. Bulk
  edit only rewrites files it actually changes, so unaffected files are left untouched.
- The **SFTP connection is shared**: once someone connects, any signed-in user works through
  that connection. The change log records who did what, but users are not isolated from one
  another. Give accounts only to people you would trust with the PBX password.
- The `data/` directory holds accounts, sessions, saved servers, templates, remembered SSH
  host keys, kept file versions and the change log. It is gitignored and must stay that
  way - it contains password hashes, TOTP secrets, and templates and kept versions that
  carry phone passwords in plain text.
- Values are trimmed of leading and trailing whitespace when a config is parsed.

## License
MIT - see [LICENSE](LICENSE).
