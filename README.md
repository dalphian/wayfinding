# 🏥 Hospital Wayfinding — Docker Setup

QR-based patient wayfinding for 1st &amp; 2nd floor.  
**Live URL:** https://wayfinding.bitsourcedocker.com  
**Admin/QR Codes:** https://wayfinding.bitsourcedocker.com/admin

Uses the existing **nginx-proxy** network with automatic SSL via Let's Encrypt.  
No build step required — nginx:alpine serves static files directly.

---

## Prerequisites

Your Docker host must already be running the nginx-proxy + acme-companion stack
with an external network named `nginx-proxy`. This compose file connects to it automatically.

---

## Deploy

```bash
# 1. Copy the wayfinding folder to your server
scp -r wayfinding/ user@your-server:/home/bit/wayfinding

# 2. On the server — start the container
cd /home/bit/wayfinding
docker compose up -d

# 3. SSL cert is issued automatically by acme-companion (takes ~60 seconds)
# 4. Open the admin page to print QR codes
open https://wayfinding.bitsourcedocker.com/admin
```

---

## QR Code Posters

1. Open **https://wayfinding.bitsourcedocker.com/admin**
2. Click **🖨 Print All Four QR Codes**
3. Post each at the correct entrance:

| QR Code                    | Post Location                              |
|----------------------------|--------------------------------------------|
| Main Entrance              | Front main entrance doors (west side)      |
| ED Entrance                | Emergency Dept. north-face entrance        |
| Parking Garage — Floor 1   | East parking garage walkway, Level 1       |
| Parking Garage — Floor 2   | East parking garage walkway, Level 2       |

---

## Patient Entrance URLs

| Entrance               | URL                                                        |
|------------------------|------------------------------------------------------------|
| Main Entrance          | https://wayfinding.bitsourcedocker.com/?entrance=main      |
| ED Entrance            | https://wayfinding.bitsourcedocker.com/?entrance=ed        |
| Parking Garage Floor 1 | https://wayfinding.bitsourcedocker.com/?entrance=parking1  |
| Parking Garage Floor 2 | https://wayfinding.bitsourcedocker.com/?entrance=parking2  |

---

## Container Management

```bash
# Stop
docker compose down

# Restart
docker compose restart

# View logs
docker compose logs -f wayfinding
```

## Updating Content

Edit `files/index.html` then restart:
```bash
docker compose restart wayfinding
```
No rebuild needed — files are volume-mounted.

---

## File Structure

```
wayfinding/
├── docker-compose.yml   ← nginx-proxy + Let's Encrypt config
├── nginx.conf           ← serves SPA, /admin redirect
├── README.md
└── files/
    └── index.html       ← entire app (edit to update content)
```
