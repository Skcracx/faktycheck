document.addEventListener('DOMContentLoaded', function () {
    const newsForm = document.getElementById('news-form');
    const resultContainer = document.getElementById('result-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const newsTextInput = document.getElementById('news-text');
    const newsUrlInput = document.getElementById('news-url');
    const charCounter = document.getElementById('char-count');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const themeToggle = document.querySelector('.theme-toggle');
    const serverUrl = 'http://localhost:5000';
  
    initUI();
  
    if (newsForm) {
      newsForm.addEventListener('submit', function (event) {
        event.preventDefault();
  
        const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab') || 'text';
        let requestData = {};
  
        if (activeTab === 'text') {
          const newsText = newsTextInput.value.trim();
          if (!newsText) {
            showError('Silakan masukkan teks berita');
            showToast('Teks berita tidak boleh kosong', 'error');
            return;
          }
          requestData = { text: newsText };
        } else {
          const newsUrl = newsUrlInput.value.trim();
          if (!newsUrl) {
            showError('Silakan masukkan URL berita');
            showToast('URL tidak boleh kosong', 'error');
            return;
          }
          if (!isValidUrl(newsUrl)) {
            showError('Format URL tidak valid');
            showToast('URL tidak valid', 'error');
            return;
          }
          requestData = { url: newsUrl };
        }
  
        loadingIndicator.style.display = 'block';
        loadingIndicator.classList.add('animate-fade-in');
        resultContainer.innerHTML = '';
        resultContainer.style.display = 'none';
  
        const submitButton = document.querySelector('.btn-detect');
        if (submitButton) {
          submitButton.classList.add('loading');
          submitButton.disabled = true;
          submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Memproses...';
        }
  
        fetch(`${serverUrl}/predict`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          })
          .then(response => response.json())
          .then(data => {
            displayResult(data);
            // ... reset tombol dsb
          })
          .catch(error => {
            console.error('Error:', error);
            showError('Gagal memproses data. Pastikan server sedang berjalan.');
          })
          .finally(() => {
            loadingIndicator.style.display = 'none';
            loadingIndicator.classList.remove('animate-fade-in');
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-search"></i> Deteksi Berita';
          });
          
      });
    }
  
    function initUI() {
      if (newsTextInput && charCounter) {
        newsTextInput.addEventListener('input', function () {
          const count = this.value.length;
          charCounter.textContent = count;
          charCounter.classList.toggle('text-danger', count > 5000);
        });
      }
  
      if (tabButtons.length && tabContents.length) {
        const tabIndicator = document.createElement('div');
        tabIndicator.className = 'tab-indicator';
        document.querySelector('.tabs').appendChild(tabIndicator);
  
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) updateTabIndicator(activeTab);
  
        tabButtons.forEach(button => {
          button.addEventListener('click', function () {
            const tab = this.getAttribute('data-tab');
  
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
  
            this.classList.add('active');
            document.getElementById(`${tab}-input-container`).classList.add('active');
            updateTabIndicator(this);
  
            if (tab === 'text') {
              newsUrlInput.value = '';
            } else {
              newsTextInput.value = '';
              charCounter.textContent = '0';
            }
  
            resultContainer.style.display = 'none';
          });
        });
      }
  
      if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
          document.body.classList.add('dark-mode');
          themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
  
        themeToggle.addEventListener('click', function () {
          const icon = this.querySelector('i');
          document.body.classList.toggle('dark-mode');
          icon.classList.toggle('fa-moon');
          icon.classList.toggle('fa-sun');
          const isDark = document.body.classList.contains('dark-mode');
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
          icon.classList.add('animate-pulse');
          setTimeout(() => icon.classList.remove('animate-pulse'), 1000);
        });
      }
  
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            window.scrollTo({
              top: target.offsetTop - 80,
              behavior: 'smooth'
            });
          }
        });
      });
  
      const animateOnScroll = () => {
        const elements = document.querySelectorAll('.step, .feature-card');
        elements.forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight - 100) {
            el.classList.add('animate-fade-in');
          }
        });
      };
  
      animateOnScroll();
      window.addEventListener('scroll', animateOnScroll);
    }
  
    function updateTabIndicator(activeTab) {
      const tabIndicator = document.querySelector('.tab-indicator');
      if (!tabIndicator) return;
      tabIndicator.style.width = activeTab.offsetWidth + 'px';
      tabIndicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    }
  
    function displayResult(data) {
      if (!resultContainer) return;
      resultContainer.style.display = 'block';
      resultContainer.classList.add('animate-fade-in');
  
      const isFake = data.label === 'FAKE';
      const label = isFake ? 'PALSU' : 'ASLI';
      const resultClass = isFake ? 'fake-news' : 'real-news';
      const fakePercentage = Math.round(data.probability.fake * 100);
      const realPercentage = Math.round(data.probability.real * 100);
  
      const recommendation = isFake
        ? `<div class="source-info"><h3><i class="fas fa-exclamation-triangle"></i> Rekomendasi</h3><ul><li>Verifikasi berita ke media terpercaya</li><li>Periksa tanggal dan sumber</li><li>Waspadai judul provokatif</li></ul></div>`
        : `<div class="source-info"><h3><i class="fas fa-check-circle"></i> Rekomendasi</h3><ul><li>Tetap cek silang dengan sumber lain</li><li>Berita tampaknya valid, tetapi jangan langsung percaya sepenuhnya</li></ul></div>`;
  
      const sourceHTML = data.source_info?.url
        ? `<div class="source-info"><h3><i class="fas fa-link"></i> Sumber</h3><p><a href="${data.source_info.url}" target="_blank">${data.source_info.url}</a></p></div>`
        : `<div class="source-info"><h3><i class="fas fa-keyboard"></i> Sumber</h3><p>Input manual dari pengguna</p></div>`;
  
      const resultHTML = `
        <div class="${resultClass}">
          <div class="result-label">
            <span class="detection-label ${resultClass}">${label}</span>
            <span class="confidence">(${isFake ? fakePercentage : realPercentage}% keyakinan)</span>
          </div>
          <div class="probability-bars">
            <div class="probability-item">
              <div class="label">Palsu</div>
              <div class="bar-container">
                <div class="bar fake-bar" style="width: ${fakePercentage}%;">
                  <span class="percentage">${fakePercentage}%</span>
                </div>
              </div>
            </div>
            <div class="probability-item">
              <div class="label">Asli</div>
              <div class="bar-container">
                <div class="bar real-bar" style="width: ${realPercentage}%;">
                  <span class="percentage">${realPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="text-preview">
            <h4><i class="fas fa-quote-left"></i> Cuplikan Teks</h4>
            <p>${data.text_preview}</p>
          </div>
          ${sourceHTML}
          ${recommendation}
          <div class="result-actions" style="margin-top: 2rem; text-align: center;">
            <button class="btn btn-outline share-btn"><i class="fas fa-share-alt"></i> Bagikan</button>
            <button class="btn btn-outline report-btn"><i class="fas fa-flag"></i> Laporkan</button>
          </div>
        </div>
      `;
  
      resultContainer.innerHTML = resultHTML;
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast(`Berita terdeteksi sebagai ${label}`, isFake ? 'warning' : 'success');
  
      const shareBtn = resultContainer.querySelector('.share-btn');
      const reportBtn = resultContainer.querySelector('.report-btn');
  
      if (shareBtn) shareBtn.addEventListener('click', () => showShareDialog(data));
      if (reportBtn) reportBtn.addEventListener('click', () => showReportDialog());
    }
  
    function showToast(message, type = 'info') {
      const existingToast = document.querySelector('.toast');
      if (existingToast) existingToast.remove();
  
      const toast = document.createElement('div');
      toast.className = `toast toast-${type} animate-slide-in`;
  
      let icon = 'info-circle';
      if (type === 'success') icon = 'check-circle';
      if (type === 'error') icon = 'exclamation-circle';
      if (type === 'warning') icon = 'exclamation-triangle';
  
      toast.innerHTML = `<i class="fas fa-${icon}"></i><p>${message}</p><button class="toast-close"><i class="fas fa-times"></i></button>`;
      document.body.appendChild(toast);
  
      toast.querySelector('.toast-close').addEventListener('click', function () {
        toast.classList.replace('animate-slide-in', 'animate-slide-out');
        setTimeout(() => toast.remove(), 300);
      });
  
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toast.classList.replace('animate-slide-in', 'animate-slide-out');
          setTimeout(() => toast.remove(), 300);
        }
      }, 5000);
    }
  
    function isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch (_) {
        return false;
      }
    }
  
    function showError(message) {
      if (!resultContainer) return;
      resultContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>${message}</p>
        </div>
      `;
      resultContainer.style.display = 'block';
      resultContainer.classList.add('animate-fade-in');
    }
  
    function showShareDialog(data) {
        let modal = document.getElementById('share-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'share-modal';
          modal.className = 'modal';
          document.body.appendChild(modal);
        }
    
        const shareText = `FaktyCheck mendeteksi berita ini sebagai ${data.label === 'FAKE' ? 'PALSU' : 'ASLI'} dengan tingkat keyakinan ${Math.round((data.label === 'FAKE' ? data.probability.fake : data.probability.real) * 100)}%.`;
    
        modal.innerHTML = `
          <div class="modal-content animate-scale-in">
            <div class="modal-header">
              <h2><i class="fas fa-share-alt"></i> Bagikan Hasil</h2>
              <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <p>Bagikan ke media sosial:</p>
              <div class="share-options">
                <button class="share-option facebook"><i class="fab fa-facebook-f"></i> Facebook</button>
                <button class="share-option twitter"><i class="fab fa-twitter"></i> Twitter</button>
                <button class="share-option whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                <button class="share-option telegram"><i class="fab fa-telegram-plane"></i> Telegram</button>
              </div>
              <div class="share-link">
                <p>Atau salin link:</p>
                <div class="copy-link-container">
                  <input type="text" value="https://faktycheck.id" readonly />
                  <button class="copy-btn"><i class="fas fa-copy"></i></button>
                </div>
              </div>
            </div>
          </div>
        `;
    
        modal.style.display = 'flex';
    
        modal.querySelector('.close-btn').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.copy-btn').addEventListener('click', function () {
          const input = modal.querySelector('input');
          input.select();
          document.execCommand('copy');
          this.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => (this.innerHTML = '<i class="fas fa-copy"></i>'), 1500);
          showToast('Link berhasil disalin!', 'success');
        });
    
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal(modal);
        });
    
        modal.querySelectorAll('.share-option').forEach(button => {
          button.addEventListener('click', () => {
            const platform = button.classList[1];
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(shareText);
            let shareUrl = '';
    
            switch (platform) {
              case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
              case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                break;
              case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
              case 'telegram':
                shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
                break;
            }
    
            if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
          });
        });
      }
    
      function showReportDialog() {
        let modal = document.getElementById('report-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'report-modal';
          modal.className = 'modal';
          document.body.appendChild(modal);
        }
    
        modal.innerHTML = `
          <div class="modal-content animate-scale-in">
            <div class="modal-header">
              <h2><i class="fas fa-flag"></i> Laporkan Masalah</h2>
              <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <form id="report-form">
                <div class="form-group">
                  <label for="report-type">Jenis Masalah</label>
                  <select id="report-type" required>
                    <option value="">-- Pilih --</option>
                    <option value="false_result">Hasil Tidak Akurat</option>
                    <option value="bug">Bug/Tidak Berfungsi</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="report-desc">Deskripsi</label>
                  <textarea id="report-desc" rows="4" placeholder="Jelaskan masalahnya..." required></textarea>
                </div>
                <div class="form-group">
                  <label for="report-email">Email (opsional)</label>
                  <input type="email" id="report-email" placeholder="email@example.com" />
                </div>
                <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Kirim Laporan</button>
              </form>
            </div>
          </div>
        `;
    
        modal.style.display = 'flex';
    
        modal.querySelector('.close-btn').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal(modal);
        });
    
        const form = modal.querySelector('#report-form');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          modal.querySelector('.modal-body').innerHTML = `
            <div class="success-message">
              <i class="fas fa-check-circle"></i>
              <h3>Terima Kasih!</h3>
              <p>Laporan kamu telah kami terima.</p>
            </div>
          `;
          showToast('Laporan berhasil dikirim!', 'success');
          setTimeout(() => closeModal(modal), 2500);
        });
      }
    
      function closeModal(modal) {
        const content = modal.querySelector('.modal-content');
        content.classList.replace('animate-scale-in', 'animate-scale-out');
        setTimeout(() => {
          modal.style.display = 'none';
          content.classList.replace('animate-scale-out', 'animate-scale-in');
        }, 300);
      }
    });
      