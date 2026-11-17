# Panduan Deployment VPS (Docker)

Panduan ini menjelaskan cara menjalankan **Pointer AI Avatar** di Virtual Private Server (VPS) menggunakan Docker.

## Prasyarat
1. **VPS Linux** (Ubuntu 22.04 / 24.04 direkomendasikan).
2. RAM minimal 4GB (8GB lebih disarankan untuk memori Chrome + Backend).
3. Akses SSH ke server.
4. Domain aktif (opsional tapi disarankan agar bisa menggunakan HTTPS/WSS untuk koneksi mic/kamera).

## Langkah 1: Instalasi Docker & Git
Jalankan perintah ini di terminal VPS Anda:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git docker.io docker-compose-v2
```

## Langkah 2: Clone Repositori
```bash
git clone https://github.com/redoreza/assisten-AI.git
cd assisten-AI
```

## Langkah 3: Persiapan Environment
```bash
# Salin template
cp .env.example .env

# Buat folder data agar permission aman
mkdir -p data/sqlite data/chroma data/knowledge_base data/personas
```
Edit file `.env` dan masukkan API Key Anda (`GROQ_API_KEY`, `VOYAGE_API_KEY`, dll).
*Catatan Penting*: Jika Anda mendeploy ke IP publik/domain, Anda harus mengubah konfigurasi WS URL untuk Frontend agar mengarah ke domain/IP publik VPS. Buka `docker-compose.yml` dan sesuaikan:
```yaml
      - NEXT_PUBLIC_WS_URL=ws://IP_VPS_ANDA:8000/ws
      # Atau jika menggunakan HTTPS/Domain: wss://api.domain.com/ws
```

## Langkah 4: Jalankan Docker Compose
Jalankan perintah ini untuk mem-build dan menjalankan semua container di latar belakang (*detached mode*):
```bash
sudo docker compose up -d --build
```
Proses *build* mungkin membutuhkan waktu beberapa menit untuk menginstal dependensi Python dan membangun Next.js.

## Langkah 5: Pengecekan
Untuk melihat apakah kontainer berjalan lancar:
```bash
sudo docker compose ps
```
Untuk melihat log dari backend:
```bash
sudo docker compose logs -f backend
```

Aplikasi Anda kini bisa diakses melalui port 3000 VPS Anda (`http://IP_VPS:3000`).

---

### Catatan Terkait HTTPS (Wajib untuk Mic/Kamera)
Browser mewajibkan konteks yang aman (HTTPS) agar pengguna bisa mengizinkan akses Kamera dan Mikrofon. Karena itu, mengakses `http://IP_VPS:3000` dari luar localhost **tidak akan bisa memicu mikrofon**. 

**Solusi paling mudah:**
1. Gunakan **Cloudflare Tunnels**. Instal `cloudflared` di VPS dan rutekan traffic ke `localhost:3000`.
2. Atau setup Nginx Reverse Proxy dengan Let's Encrypt / Certbot.
