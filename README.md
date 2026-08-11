# PBX MPP Config Manager

Small web app to connect to FreePBX over SFTP, list Cisco MPP `.xml` config files, view/edit fields, and upload saved/new configs.

## Features
- Save multiple PBX server profiles (host/port/user/remote dir) and connect using only password
- List `.xml` files with `Station_Display_Name` shown under each filename
- Open/edit XML as tag/value/attributes rows
- Soft-delete rows with one-click Undo
- Reset editor to the last loaded/saved state
- Hide/Show tags where the value is empty
- Save buttons at top and bottom of the editor
- Create new config files and upload
- Full starter field set based on your provided standard template
- Bulk edit one tag across many config files at once, preview-first, with live progress
- Per-server change log of every write, retained between connections

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
1. Install dependencies:
   ```powershell
   npm install
   ```
2. Start app:
   ```powershell
   npm start
   ```
3. Open browser: [http://localhost:3000](http://localhost:3000)

## Change Log
Every write the app makes to a phone config is recorded: bulk edits, single-file saves, and
new file creation. Previews are **not** logged, because they change nothing.

Editor saves are diffed against the file's previous contents, so the log names the exact
fields that moved rather than just "the file was saved":

| Action | Phone | File | Tag | Before | After |
|---|---|---|---|---|---|
| Changed field | Front Desk - 7001 | `spa001.xml` | `Voice_Mail_Number` | `*97` | `*555` |
| Added field | Front Desk - 7001 | `spa001.xml` | `Time_Zone` | (not set) | `GMT+10:00` |
| Removed field | Kitchen - 7002 | `spa002.xml` | `Admin_Passwd` | `secret` | (removed) |

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
This app has **no login of its own**. Anyone who can reach its port can read your saved
server profiles (host, username, remote directory) and the full change log, and can push
config to every phone on the PBX. They would still need the SFTP password to connect, but
treat the port as sensitive.

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
3. the original local Windows path, so existing non-Docker installs keep working

If none exist the template loads **empty** - creating a config from it would produce an empty
file. The container logs which one it resolved at startup, so check `docker compose logs` if
"Default Template" looks wrong. To supply one:

```bash
docker cp spaTemplate.xml pbx-manager:/data/default-template.xml
docker compose restart
```

### Environment variables
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the app listens on |
| `DATA_DIR` | `./data` (`/data` in the image) | Where the JSON stores are written |
| `DEFAULT_TEMPLATE_PATH` | unset | Explicit path to the default template XML |
| `TZ` | `UTC` | Affects timestamps shown in the change log |

### Updating
```bash
docker compose up -d --build
```
The volume is untouched by a rebuild, so your servers and change log carry over.

## Tests
```powershell
npm test
```
Runs two suites (135 checks, no external test framework):
- `test/unit.test.js` - pure helpers imported directly from `server.js`: bulk edit modes,
  XML round-tripping, path-traversal rejection, log scope keying.
- `test/e2e.test.js` - boots the real server and drives it over a real SFTP connection to an
  in-memory mock PBX (`test/helpers/mock-sftp.js`). Covers preview-performs-no-writes,
  attribute preservation, no-op skipping, progress reporting, and the change log.

Run one suite with `npm run test:unit` or `npm run test:e2e`.

The e2e suite backs up `data/` to the OS temp directory before running and restores it
afterwards (including if it fails), so your saved servers and logs are never disturbed.

### Trying the UI without a real PBX
```powershell
npm run mock-pbx
```
Starts a fake PBX over SFTP and prints its port. Connect the app to `127.0.0.1` on that port
with `/tftpboot` and any username/password. It serves 8 config files with a deliberate 400ms
delay per file so the bulk-edit progress bar is easy to watch. Files are in-memory only.
Override with `MOCK_FILE_COUNT` and `MOCK_LATENCY_MS`.

## Notes
- Passwords are not persisted; they are required at connect time.
- Saved PBX server profiles are stored in `data/servers.json`.
- XML is rebuilt on save, so formatting/comments may differ from source files. Bulk edit
  only rewrites files it actually changes, so unaffected files are left byte-for-byte alone.
- The `data/` directory holds saved servers, templates and the change log. It is gitignored
  and must stay that way: templates can contain phone admin passwords.

## License
MIT - see [LICENSE](LICENSE).
