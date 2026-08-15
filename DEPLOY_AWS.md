# Deploy Sky APX on AWS Free Tier (Caddy + MySQL)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  GoDaddy DNS                                        │
│  A record -> EC2 public IP                          │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  EC2 t2.micro  (Ubuntu 22.04 / 24.04)               │
│  ┌─────────────────────────────────────────────┐    │
│  │  Caddy  (reverse proxy, auto HTTPS, gzip)   │    │
│  │  :443 ──► :3000 (Node.js TanStack Start)    │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  MySQL 8  (local on EC2)                    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Step 1 — Launch EC2

1. **AWS Console → EC2 → Launch Instance**
2. Name: `skyapx-prod`
3. AMI: **Ubuntu 22.04 LTS**
4. Type: **t2.micro** (free tier)
5. Key pair: Create new → download `.pem`
6. Security group:
   - SSH (22) from **My IP**
   - HTTP (80) from **Anywhere**
   - HTTPS (443) from **Anywhere**
7. Storage: **8 GiB**
8. Launch

---

## Step 2 — SSH into EC2

```bash
chmod 400 skyapx-key.pem
ssh -i skyapx-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Step 3 — Run setup

```bash
sudo apt update && sudo apt upgrade -y
git clone https://github.com/YOUR_USERNAME/skyapx.git /opt/skyapx/app
cd /opt/skyapx/app
chmod +x deploy/setup-server.sh
sudo bash deploy/setup-server.sh yourdomain.com
```

What it installs:
- **Node.js 22** — runtime
- **Caddy** — reverse proxy + auto HTTPS (no certbot needed)
- **MySQL 8** — database
- **PM2** — process manager (available but systemd is primary)

---

## Step 4 — Configure GoDaddy DNS

**GoDaddy → DNS Management** → Add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | @ | YOUR_EC2_PUBLIC_IP | 600 |
| **A** | www | YOUR_EC2_PUBLIC_IP | 600 |

Wait 5-15 minutes for DNS propagation.

---

## Step 5 — Verify

```bash
# SSH into EC2
ssh -i skyapx-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Check services
sudo systemctl status skyapx
sudo systemctl status caddy

# Check app
curl -s http://127.0.0.1:3000/ | head -20

# Check Caddy auto-SSL
curl -sI https://yourdomain.com | head -5
```

Visit:
- `https://yourdomain.com` — website
- `https://yourdomain.com/admin-login` — admin

---

## Step 6 — CI/CD (GitHub Actions)

### Add GitHub Secrets

**GitHub → Settings → Secrets → Actions:**

| Secret | Value |
|--------|-------|
| `EC2_HOST` | Your EC2 public IP |
| `EC2_USER` | `deploy` |
| `EC2_SSH_KEY` | Paste entire `.pem` key |

### How it works

Push to `main` → GitHub Actions builds → SSHs into EC2 → pulls code → installs deps → builds → restarts `skyapx` service.

---

## Access MySQL

```bash
# Get password
grep DATABASE_URL /opt/skyapx/.env

# Connect
mysql -u root -p
# Enter password

# Inside MySQL
USE skyapx;
SHOW TABLES;
SELECT * FROM enquiries;
SELECT * FROM courses;
EXIT;
```

**Remote access (from your laptop via SSH tunnel):**
```bash
# Terminal 1: Create tunnel
ssh -i skyapx-key.pem -L 3306:localhost:3306 ubuntu@YOUR_EC2_IP

# Terminal 2: Connect locally
mysql -u root -p -h 127.0.0.1
```

---

## Caddy Management

```bash
# Check status
sudo systemctl status caddy

# Reload after config change
sudo systemctl reload caddy

# View config
cat /etc/caddy/Caddyfile

# View logs
sudo journalctl -u caddy -f

# Test config
caddy validate --config /etc/caddy/Caddyfile
```

**Caddy auto-renews SSL** — no manual certbot commands needed.

---

## App Management

```bash
# Restart app
sudo systemctl restart skyapx

# View app logs
journalctl -u skyapx -f
journalctl -u skyapx -n 100

# Manual deploy (without CI/CD)
cd /opt/skyapx/app
git pull origin main
npm ci --omit=dev
npm run build
sudo systemctl restart skyapx
```

---

## Free Tier Cost

| Service | Free Tier |
|---------|-----------|
| EC2 t2.micro | 750h/month (12 months) |
| EBS 8 GiB | 30 GiB/month (12 months) |
| Data transfer | 100 GB/month (12 months) |
| MySQL (local) | $0 |
| Caddy | $0 |
| **Total** | **~$0/month** |

---

## Security Checklist

- [ ] Change admin password after first login
- [ ] SSH key only (disable password auth):
  ```bash
  sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
  sudo systemctl restart sshd
  ```
- [ ] UFW enabled (only 22, 80, 443)
- [ ] EC2 security group: SSH restricted to your IP
- [ ] Strong MySQL root password

---

## Troubleshooting

### 502 Bad Gateway
App is down:
```bash
sudo systemctl status skyapx
sudo systemctl restart skyapx
```

### SSL not provisioning
DNS not pointing to EC2:
```bash
nslookup yourdomain.com    # should return EC2 IP
sudo journalctl -u caddy -n 50
```

### MySQL connection failed
```bash
sudo systemctl status mysql
grep DATABASE_URL /opt/skyapx/.env
mysql -u root -p -e "SELECT 1"
```

### Build fails
```bash
node --version    # should be 22.x
npm --version
```

### App not restarting after deploy
```bash
sudo systemctl restart skyapx
sudo systemctl status skyapx
journalctl -u skyapx -n 20
```
