/**
 * Minimal in-memory SFTP server used to exercise the real read/modify/write path
 * without touching a live PBX. Implements just enough of the protocol for
 * ssh2-sftp-client's exists/list/get/put.
 */
const { Server, utils } = require("ssh2");

const { STATUS_CODE, OPEN_MODE } = utils.sftp;

const MODE_FILE = 0o100644;
const MODE_DIR = 0o040755;

/**
 * @param {object} options
 * @param {Record<string,string>} options.files initial contents, keyed by file name
 * @param {string} [options.dir] remote directory served
 * @param {number} [options.latencyMs] artificial per-file delay, to make progress observable
 */
/**
 * `host` defaults to loopback so the mock is never reachable off-machine.
 * Only widen it deliberately (e.g. "0.0.0.0" so a container can reach it) and
 * shut it down afterwards - it accepts any username and password.
 */
function startMockSftp({ files, dir = "/tftpboot", latencyMs = 0, host = "127.0.0.1" }) {
  const store = new Map(Object.entries(files));
  const writes = []; // every write, for assertions
  const state = { latencyMs };
  const stall = () => (state.latencyMs > 0
    ? new Promise((r) => setTimeout(r, state.latencyMs))
    : null);

  const hostKey = utils.generateKeyPairSync("ed25519").private;

  const server = new Server({ hostKeys: [hostKey] }, (client) => {
    client.on("authentication", (ctx) => ctx.accept());
    client.on("ready", () => {
      client.on("session", (accept) => {
        const session = accept();
        session.on("sftp", (acceptSftp) => {
          const sftp = acceptSftp();
          const handles = new Map();
          let handleCounter = 0;

          const newHandle = (data) => {
            const id = handleCounter++;
            const buf = Buffer.alloc(4);
            buf.writeUInt32BE(id, 0);
            handles.set(id, data);
            return buf;
          };
          const getHandle = (h) => handles.get(h.readUInt32BE(0));

          const baseName = (p) => p.split("/").filter(Boolean).pop();
          const inDir = (p) => {
            const norm = p.replace(/\\/g, "/");
            return norm === dir || norm.startsWith(`${dir}/`);
          };

          sftp.on("REALPATH", (reqid, p) => {
            const resolved = p === "." ? dir : p;
            sftp.name(reqid, [{ filename: resolved, longname: resolved, attrs: {} }]);
          });

          const statFor = (reqid, p) => {
            const norm = p.replace(/\\/g, "/");
            if (norm === dir) {
              return sftp.attrs(reqid, { mode: MODE_DIR, size: 0, uid: 0, gid: 0, atime: 0, mtime: 0 });
            }

            const name = baseName(norm);
            if (inDir(norm) && store.has(name)) {
              return sftp.attrs(reqid, {
                mode: MODE_FILE,
                size: Buffer.byteLength(store.get(name), "utf8"),
                uid: 0,
                gid: 0,
                atime: 0,
                mtime: 1700000000
              });
            }

            return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
          };

          sftp.on("STAT", statFor);
          sftp.on("LSTAT", statFor);

          sftp.on("OPENDIR", (reqid, p) => {
            if (p.replace(/\\/g, "/") !== dir) {
              return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
            }
            return sftp.handle(reqid, newHandle({ type: "dir", sent: false }));
          });

          sftp.on("READDIR", (reqid, h) => {
            const handleState = getHandle(h);
            if (!handleState || handleState.sent) {
              return sftp.status(reqid, STATUS_CODE.EOF);
            }

            handleState.sent = true;
            const names = [...store.keys()].map((name) => {
              const size = Buffer.byteLength(store.get(name), "utf8");
              return {
                filename: name,
                longname: `-rw-r--r-- 1 root root ${size} Jan 1 00:00 ${name}`,
                attrs: { mode: MODE_FILE, size, uid: 0, gid: 0, atime: 0, mtime: 1700000000 }
              };
            });

            return sftp.name(reqid, names);
          });

          sftp.on("OPEN", async (reqid, filename, flags) => {
            await stall();

            const name = baseName(filename.replace(/\\/g, "/"));
            const forWrite = Boolean(flags & (OPEN_MODE.WRITE | OPEN_MODE.TRUNC | OPEN_MODE.CREAT));

            if (forWrite) {
              return sftp.handle(reqid, newHandle({ type: "write", name, chunks: [] }));
            }
            if (!store.has(name)) {
              return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
            }
            return sftp.handle(reqid, newHandle({ type: "read", name, offset: 0 }));
          });

          sftp.on("READ", (reqid, h, offset, len) => {
            const handleState = getHandle(h);
            if (!handleState || handleState.type !== "read") {
              return sftp.status(reqid, STATUS_CODE.FAILURE);
            }

            const buf = Buffer.from(store.get(handleState.name), "utf8");
            if (offset >= buf.length) {
              return sftp.status(reqid, STATUS_CODE.EOF);
            }
            return sftp.data(reqid, buf.subarray(offset, Math.min(offset + len, buf.length)));
          });

          sftp.on("WRITE", (reqid, h, offset, data) => {
            const handleState = getHandle(h);
            if (!handleState || handleState.type !== "write") {
              return sftp.status(reqid, STATUS_CODE.FAILURE);
            }

            handleState.chunks.push({ offset, data: Buffer.from(data) });
            return sftp.status(reqid, STATUS_CODE.OK);
          });

          sftp.on("FSTAT", (reqid, h) => {
            const handleState = getHandle(h);
            const size = handleState && handleState.type === "read"
              ? Buffer.byteLength(store.get(handleState.name), "utf8")
              : 0;
            sftp.attrs(reqid, { mode: MODE_FILE, size, uid: 0, gid: 0, atime: 0, mtime: 1700000000 });
          });

          sftp.on("FSETSTAT", (reqid) => sftp.status(reqid, STATUS_CODE.OK));
          sftp.on("SETSTAT", (reqid) => sftp.status(reqid, STATUS_CODE.OK));

          sftp.on("CLOSE", (reqid, h) => {
            const handleState = getHandle(h);

            if (handleState && handleState.type === "write") {
              const total = Buffer.concat(
                handleState.chunks.sort((a, b) => a.offset - b.offset).map((c) => c.data)
              ).toString("utf8");

              store.set(handleState.name, total);
              writes.push({ name: handleState.name, content: total });
            }

            handles.delete(h.readUInt32BE(0));
            return sftp.status(reqid, STATUS_CODE.OK);
          });
        });
      });
    });

    // Expected when the app process is killed mid-connection during teardown.
    client.on("error", () => {});
  });

  return new Promise((resolve) => {
    server.listen(0, host, () => {
      resolve({
        port: server.address().port,
        store,
        writes,
        setLatency: (ms) => { state.latencyMs = ms; },
        close: () => new Promise((r) => server.close(r))
      });
    });
  });
}

module.exports = { startMockSftp };
