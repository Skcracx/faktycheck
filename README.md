# FaktyCheck

<img src="https://github.com/user-attachments/assets/e0db9cac-f3ae-464a-a606-e23338104031" alt="Preview" width="600"/>


## 📌 Deskripsi

**FaktyCheck** adalah aplikasi web berbasis Flask yang dirancang sebagai sarana pembelajaran dalam membangun sistem deteksi keaslian berita menggunakan teknologi kecerdasan buatan. Aplikasi ini memungkinkan pengguna untuk:

- Memasukkan URL atau teks berita secara langsung,
- Menganalisis apakah berita tersebut **asli**, **palsu**, atau mengandung **misinformasi**,
- Menyajikan ringkasan dari isi berita,
- Memberikan referensi berupa sumber berita terpercaya terkait.

> ⚠️ **Catatan Penting:**  
Model deteksi dalam aplikasi ini masih dalam tahap pengembangan dan saat ini memiliki kecenderungan mengklasifikasikan sebagian besar berita sebagai palsu, termasuk berita yang sebenarnya sudah terverifikasi. Hal ini terjadi karena keterbatasan pada dataset yang digunakan untuk melatih model.

Dataset diambil dari Kaggle:  
🔗 [Indonesia False News - Kaggle Dataset](https://www.kaggle.com/datasets/muhammadghazimuharam/indonesiafalsenews?select=Data_latih.csv)

Berdasarkan pengamatan, terdapat ketidakseimbangan kelas (imbalance class) antara jumlah data berita asli dan berita palsu dalam dataset tersebut. Hal ini cukup umum ditemukan dalam dataset klasifikasi berita dan menjadi tantangan tersendiri dalam pengembangan sistem deteksi yang akurat. Proyek ini sepenuhnya ditujukan untuk keperluan **eksperimen dan edukasi**.

---

## 🎯 Fitur Utama

- ✅ Deteksi berita dari teks atau URL
- 💡 Backend menggunakan Python Flask

---

## 🚀 Instalasi dan Menjalankan Aplikasi

### 1. Clone repository
```bash
git clone https://github.com/Skcracx/faktycheck.git
cd faktycheck

# Membuat virtual environment
python -m venv venv

# Aktifkan (Linux/MacOS)
source venv/bin/activate

# Aktifkan (Windows)
venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Run server
flask run
# metode lain run server (sesuaikan nama filenya)
server.py

# Jika berhasil muncul output berikut
 * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
