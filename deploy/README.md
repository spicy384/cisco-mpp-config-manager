# Deployment examples

Pick the one that matches where your reverse proxy lives. Each directory is a
self-contained Compose project with its own `.env.example`.

**None of them needs the source.** They all run the image published at
`ghcr.io/spicy384/cisco-mpp-config-manager`, so a server only needs Docker and the
handful of files shown below, fetched with `curl`. Cloning the repository works too,
but nothing is built from it.

| Setup | Use when | HTTPS handled by |
|---|---|---|
| [`../docker-compose.yml`](../docker-compose.yml) | Simplest. You reach it on the server itself, or over an SSH tunnel | Nothing - plain HTTP on loopback |
| [`caddy/`](caddy) | You want HTTPS on this host with nothing else in front | Caddy: self-signed, Let's Encrypt, or your own certificate |
| [`external-proxy/`](external-proxy) | Your proxy (Nginx Proxy Manager, etc.) runs on **another host** | The proxy for browsers; the app's own self-signed cert for the hop to it |

All three run the same image. The differences are only in what is exposed and who
terminates TLS.

To update any of them: `docker compose pull && docker compose up -d`. To stay on a
release instead of following `latest`, set `PBX_VERSION=1.0.3` (or whichever) in `.env`.

---

## caddy/ - one host, HTTPS from Caddy

Caddy terminates HTTPS and proxies to the app over an internal Docker network. **The app
publishes no ports**, so the only route in is through Caddy over HTTPS, and HTTP is
redirected to it.

```bash
mkdir -p ~/pbx-manager && cd ~/pbx-manager
curl -fsSLO https://raw.githubusercontent.com/spicy384/cisco-mpp-config-manager/main/deploy/caddy/docker-compose.yml
curl -fsSLO https://raw.githubusercontent.com/spicy384/cisco-mpp-config-manager/main/deploy/caddy/Caddyfile
curl -fsSL  https://raw.githubusercontent.com/spicy384/cisco-mpp-config-manager/main/deploy/caddy/.env.example -o .env
nano .env                 # set PBX_DOMAIN and choose PBX_TLS
docker compose up -d
```

(From a clone: `cd deploy/caddy && cp .env.example .env`, edit, `docker compose up -d`.)

One line in `.env`, `PBX_TLS`, chooses the certificate. Switch between them at any time
by editing it and running `docker compose up -d` again.

| Certificate | `PBX_TLS` | Needs | Browsers |
|---|---|---|---|
| Self-signed | `internal` | Nothing. Works for a domain, an internal name or an IP address | Warn until Caddy's root certificate is trusted |
| Let's Encrypt | your email address | A real domain pointing at this host; inbound TCP 80 and 443 from the internet | Trusted |
| Your own | `/certs/fullchain.pem /certs/privkey.pem` | The certificate and key in the folder named by `PBX_CERT_DIR` | Whatever your certificate is |

### Self-signed
Caddy runs its own small certificate authority and issues the site's certificate from it,
renewing it by itself. To stop the browser warning, trust that authority's root once on each
machine that uses the app:

```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

Import `caddy-root.crt` as a trusted root (Windows: double-click, *Install Certificate*,
*Trusted Root Certification Authorities*; macOS: Keychain Access, then *Always Trust*).
**Keep the `caddy_data` volume**: deleting it creates a new authority that has to be
trusted all over again.

### Let's Encrypt
Set `PBX_TLS` to your email address. It is registered with the certificate authority as
your account contact the moment the container starts, so use a real one and set
`PBX_DOMAIN` first. Caddy asks Let's Encrypt and, if that cannot issue, falls back to
ZeroSSL, its other built-in authority; either way the certificate is trusted and renewed
automatically. Watch the first start, since issuance takes a few seconds:

```bash
docker compose logs -f caddy
```

Caddy uses port 80 for the ACME challenge, so both 80 and 443 must reach this host from the
internet. **Keep the `caddy_data` volume**: it holds the certificates and the account key,
and Let's Encrypt allows only 5 identical certificates per week.

If the host is not reachable from the internet, Let's Encrypt cannot validate the domain
this way. Obtain the certificate elsewhere (certbot with DNS-01 needs no inbound access)
and use the next mode, or see the note at the end of the `Caddyfile` about a DNS plugin.

### Your own certificate
Put the certificate (with its chain) and the private key in a folder, set `PBX_CERT_DIR`
to it, and give `PBX_TLS` the two paths as they appear inside the container, under
`/certs`:

```bash
PBX_TLS=/certs/fullchain.pem /certs/privkey.pem
PBX_CERT_DIR=./certs
```

For certificates kept by certbot, mount the whole of `/etc/letsencrypt`. The files in
`live/` are links into `archive/`, so mounting `live/<domain>` alone leaves them broken:

```bash
PBX_TLS=/certs/live/pbx.example.com/fullchain.pem /certs/live/pbx.example.com/privkey.pem
PBX_CERT_DIR=/etc/letsencrypt
```

Caddy reads the files when it starts, so after a renewal run `docker compose restart caddy`
(a certbot `--deploy-hook` is a good place for it).

In every mode the proxy and the app share a host, so the hop between them never touches the
network: the app runs plain HTTP internally and `TLS_ENABLED` stays off.

---

## external-proxy/ - proxy on another host

The proxy is somewhere else, so the hop from it to the app crosses the network.
The app serves HTTPS itself with a self-signed certificate to keep that hop
encrypted - otherwise sign-ins and session cookies would be readable in transit.

```bash
mkdir -p ~/pbx-manager && cd ~/pbx-manager
curl -fsSLO https://raw.githubusercontent.com/spicy384/cisco-mpp-config-manager/main/deploy/external-proxy/docker-compose.yml
curl -fsSL  https://raw.githubusercontent.com/spicy384/cisco-mpp-config-manager/main/deploy/external-proxy/.env.example -o .env
nano .env                 # set BIND_IP and TLS_HOSTS
docker compose up -d
```

(From a clone: `cd deploy/external-proxy && cp .env.example .env`, edit, `docker compose up -d`.)

Then in the proxy:

- **Scheme**: `https`
- **Forward Hostname**: the `BIND_IP` you set
- **Forward Port**: `3000`

Proxies do not verify upstream certificates by default, so the self-signed one is
accepted. It is there to encrypt the hop, not to prove identity.

Two things to get right:

1. `TLS_HOSTS` must include whatever the proxy connects to, or the certificate will
   not cover it.
2. Firewall port 3000 so only the proxy's address can reach it. Binding to a single
   LAN IP is a start, not a substitute.

---

## Running your own build

Only needed when you are changing the app. From the repository root, build the image
under the name the compose files use, then start whichever setup you like; it runs your
build until the next `docker compose pull`:

```bash
docker build -t ghcr.io/spicy384/cisco-mpp-config-manager:latest .
```

For the root compose file there is also an override that does it in one step:
`docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build`.

---

## Supplying your own certificate

Any of these can use a real certificate instead of a generated one. Obtain it
however you like - certbot with DNS-01 needs no inbound access - then:

```yaml
environment:
  TLS_CERT: /certs/fullchain.pem
  TLS_KEY: /certs/privkey.pem
volumes:
  - /opt/pbx-certs:/certs:ro
```

`TLS_CERT`/`TLS_KEY` take precedence over `TLS_ENABLED`. Certificates are read only
at startup, so restart the container after a renewal.

The folder must hold the files themselves, readable by user 1000 (who the app runs as in
the container). Certbot's `/etc/letsencrypt/live/<domain>` does not work mounted directly:
its files are links into `../../archive`, and both folders are root-only. Let certbot copy
the pair out and restart the app whenever it issues or renews:

```bash
sudo install -d -m 750 -o 1000 -g 1000 /opt/pbx-certs
sudo certbot certonly --dns-cloudflare -d pbx.example.com \
  --deploy-hook 'install -m 640 -o 1000 -g 1000 "$RENEWED_LINEAGE/fullchain.pem" "$RENEWED_LINEAGE/privkey.pem" /opt/pbx-certs/ && docker restart pbx-manager'
```

This is about the **app's own** certificate. For Caddy's, see *Your own certificate* under
[caddy/](#caddy---one-host-https-from-caddy) above.
