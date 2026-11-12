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
| [`caddy/`](caddy) | You have a domain and this host can be reached on 80/443 | Caddy, automatic Let's Encrypt |
| [`external-proxy/`](external-proxy) | Your proxy (Nginx Proxy Manager, etc.) runs on **another host** | The proxy for browsers; the app's own self-signed cert for the hop to it |

All three run the same image. The differences are only in what is exposed and who
terminates TLS.

To update any of them: `docker compose pull && docker compose up -d`. To stay on a
release instead of following `latest`, set `PBX_VERSION=1.0.3` (or whichever) in `.env`.

---

## caddy/ - one host, automatic certificates

Caddy gets a Let's Encrypt certificate, renews it, and proxies to the app over an
internal Docker network. **The app publishes no ports**, so the only route in is
through Caddy over HTTPS.

```bash
mkdir -p ~/pbx-manager && cd ~/pbx-manager
curl -fsSLO https://raw.githubusercontent.com/spicy384/cisco-mpp-config-manager/main/deploy/caddy/docker-compose.yml
curl -fsSLO https://raw.githubusercontent.com/spicy384/cisco-mpp-config-manager/main/deploy/caddy/Caddyfile
curl -fsSL  https://raw.githubusercontent.com/spicy384/cisco-mpp-config-manager/main/deploy/caddy/.env.example -o .env
nano .env                 # set PBX_DOMAIN and ACME_EMAIL
docker compose up -d
```

(From a clone: `cd deploy/caddy && cp .env.example .env`, edit, `docker compose up -d`.)

Needs a real domain pointing at this host and inbound TCP 80 and 443. Caddy uses
80 for the ACME challenge and for redirecting HTTP to HTTPS.

Watch the first start - certificate issuance takes a few seconds:

```bash
docker compose logs -f caddy
```

Because the proxy and the app share a host, the hop between them never touches the
network, so the app runs plain HTTP internally and `TLS_ENABLED` stays off.

**Keep the `caddy_data` volume.** It holds the certificates and the ACME account
key. Deleting it forces re-issuance, and Let's Encrypt allows only 5 identical
certificates per week.

If this host is not reachable from the internet, Let's Encrypt cannot validate the
domain. The `Caddyfile` documents two alternatives: `tls internal` (Caddy's own CA,
real HTTPS but browsers warn until you trust its root), or DNS-01 validation with a
Caddy image built with your DNS provider's plugin.

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
  - /etc/letsencrypt/live/pbx.example.com:/certs:ro
```

`TLS_CERT`/`TLS_KEY` take precedence over `TLS_ENABLED`. Certificates are read only
at startup, so restart the container after a renewal.
