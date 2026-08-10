let currentJobData = { title: "Software Engineer", company: "Hedef Şirket", description: "" };
let uploadedCvFile = null;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Tab Yönetimi
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn, .tab-content").forEach(el => el.classList.remove("active"));
      e.target.classList.add("active");
      document.getElementById(e.target.dataset.tab).classList.add("active");
    });
  });

  // 2. Modal Yönetimi
  const modal = document.getElementById("settings-modal");
  document.getElementById("settings-btn").addEventListener("click", () => modal.classList.remove("hidden"));
  document.getElementById("close-modal").addEventListener("click", () => modal.classList.add("hidden"));

  // 3. CV Yükleme Alanı ve Hafıza Denetimi
  const savedCvName = localStorage.getItem("matchcv_saved_cv_name");
  if (savedCvName) {
    document.getElementById("cv-status").innerText = `✅ CV Yüklü: ${savedCvName}`;
  }

  const dropZone = document.querySelector(".file-drop-zone");
  const fileInput = document.getElementById("cv-input");

  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadedCvFile = e.target.files[0];
      localStorage.setItem("matchcv_saved_cv_name", uploadedCvFile.name);
      document.getElementById("cv-status").innerText = `✅ CV Yüklü: ${uploadedCvFile.name}`;
    }
  });

  document.getElementById("clear-cv-btn").addEventListener("click", () => {
    localStorage.removeItem("matchcv_saved_cv_name");
    uploadedCvFile = null;
    document.getElementById("cv-status").innerText = "📄 PDF CV Yükle veya Değiştir";
    alert("CV silindi.");
  });

  loadAutoFillData();

  // 4. Sayfadan Güvenli Veri Çekme (Timeout Korumalı)
  fetchJobDataFromTab();

  // 5. İşlem Dinleyicileri
  document.getElementById("analyze-btn").addEventListener("click", runAnalysis);
  document.getElementById("save-job-btn").addEventListener("click", saveJobToTracker);
  document.getElementById("trigger-autofill-btn").addEventListener("click", triggerAutoFill);
  document.getElementById("gen-cover-btn").addEventListener("click", generateCoverLetter);
  document.getElementById("download-cv-btn").addEventListener("click", downloadOptimizedTextFile);

  setupCopyBtn("copy-cover-btn", "cover-text", "Niyet Mektubu kopyalandı!");
  setupCopyBtn("copy-tailor-btn", "tailor-text", "Revize CV metni kopyalandı!");
  setupCopyBtn("copy-dm-btn", "dm-text", "İK DM mesajı kopyalandı!");

  renderTrackerList();
});

async function fetchJobDataFromTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Eğer sekme geçerli bir web sayfası değilse (ör. chrome://) doğrudan varsayılan veriye geç
    if (!tab || !tab.id || tab.url.startsWith("chrome://")) {
      applyFallbackJobData("Örnek Pozisyon", "Teknoloji Şirketi", "");
      return;
    }

    // 1.5 Saniye içinde yanıt gelmezse takılmayı önlemek için timeout mekanizması
    let responded = false;
    const timeout = setTimeout(() => {
      if (!responded) {
        applyFallbackJobData("Software Engineer", "İlgili Şirket", "");
      }
    }, 1500);

    chrome.tabs.sendMessage(tab.id, { action: "extractJobData" }, (response) => {
      responded = true;
      clearTimeout(timeout);
      
      if (chrome.runtime.lastError || !response) {
        applyFallbackJobData("Software Engineer", "İlgili Şirket", "");
      } else {
        currentJobData = response;
        document.getElementById("job-title-input").value = currentJobData.title || "Software Engineer";
        document.getElementById("company-name-input").value = currentJobData.company || "Hedef Şirket";
        checkVisaSponsorship(currentJobData.description);
        updateHRLink(currentJobData.company);
      }
    });
  } catch (err) {
    applyFallbackJobData("Software Engineer", "İlgili Şirket", "");
  }
}

function applyFallbackJobData(defaultTitle, defaultCompany, defaultDesc) {
  currentJobData = {
    title: defaultTitle,
    company: defaultCompany,
    description: defaultDesc || "Python, FastAPI, Docker, AWS ve PostgreSQL mimarilerinde deneyimli aday aranıyor."
  };
  document.getElementById("job-title-input").value = currentJobData.title;
  document.getElementById("company-name-input").value = currentJobData.company;
  checkVisaSponsorship(currentJobData.description);
  updateHRLink(currentJobData.company);
}

function checkVisaSponsorship(desc) {
  const badge = document.getElementById("visa-badge");
  const text = (desc || "").toLowerCase();
  
  if (text.includes("visa sponsorship") || text.includes("relocation support") || text.includes("vize sponsorluğu")) {
    badge.innerText = "🟢 Vize Sponsorluğu Var";
    badge.className = "badge visa-yes";
  } else if (text.includes("no visa") || text.includes("must be eligible to work")) {
    badge.innerText = "🔴 Vize Sponsorluğu Yok";
    badge.className = "badge visa-no";
  } else {
    badge.innerText = "🟡 Vize Durumu Belirsiz";
    badge.className = "badge visa-unknown";
  }
}

function updateHRLink(companyName) {
  const hrBtn = document.getElementById("hr-linkedin-link");
  if (companyName && companyName.length > 1) {
    const searchQuery = encodeURIComponent(`${companyName} recruiter OR hr OR talent acquisition`);
    hrBtn.href = `https://www.linkedin.com/search/results/people/?keywords=${searchQuery}`;
    hrBtn.classList.remove("hidden");
  } else {
    hrBtn.classList.add("hidden");
  }
}

function setupCopyBtn(btnId, targetId, msg) {
  document.getElementById(btnId).addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById(targetId).value);
    alert(msg);
  });
}

async function runAnalysis() {
  const savedCvName = localStorage.getItem("matchcv_saved_cv_name");
  if (!uploadedCvFile && !savedCvName) {
    alert("Lütfen önce PDF CV'nizi yükleyin.");
    return;
  }

  currentJobData.title = document.getElementById("job-title-input").value;
  currentJobData.company = document.getElementById("company-name-input").value;

  showLoader(true);
  const formData = new FormData();
  
  if (uploadedCvFile) {
    formData.append("cv_file", uploadedCvFile);
  } else {
    formData.append("cv_file", new Blob(["Aday CV Metni ve Yetkinlikleri"], { type: "application/pdf" }), savedCvName || "cv.pdf");
  }

  formData.append("job_title", currentJobData.title);
  formData.append("company", currentJobData.company);
  formData.append("job_description", currentJobData.description || "Genel iş tanımı");

  try {
    const res = await fetch("http://localhost:8000/api/analyze", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Backend Hatasi");
    const data = await res.json();
    renderResults(data);
  } catch (err) {
    alert("Backend sunucusuna ulaşılamadı! Terminalde uvicorn'un açık olduğundan emin olun.");
  } finally {
    showLoader(false);
  }
}

function renderResults(data) {
  document.getElementById("results-section").classList.remove("hidden");
  const score = data.match_score;
  document.getElementById("score-text").textContent = `${score}%`;
  document.getElementById("circle-stroke").setAttribute("stroke-dasharray", `${score}, 100`);
  document.getElementById("mentor-advice").innerText = data.advice;

  document.getElementById("matched-skills").innerHTML = data.matched_skills.map(s => `<span class="pill green">${s}</span>`).join("");
  document.getElementById("missing-skills").innerHTML = data.missing_skills.map(s => `<span class="pill orange">${s}</span>`).join("");
  document.getElementById("ats-list").innerHTML = data.ats_recommendations.map(r => `<li>${r}</li>`).join("");

  document.getElementById("tailor-text").value = data.tailored_summary || "CV Özeti hazırlanıyor...";
  document.getElementById("dm-text").value = `Merhaba ${currentJobData.company} ekibi, ${currentJobData.title} ilanıyla ilgileniyorum. Teknik birikimim pozisyon gereksinimlerinizle yüksek oranda örtüşüyor. CV'mi incelemeniz için iletişime geçmek istedim.`;
}

function saveJobToTracker() {
  const title = document.getElementById("job-title-input").value;
  const company = document.getElementById("company-name-input").value;
  
  let savedJobs = JSON.parse(localStorage.getItem("matchcv_tracker_jobs") || "[]");
  savedJobs.push({ id: Date.now(), title, company, status: "Başvuruldu", date: new Date().toLocaleDateString('tr-TR') });
  localStorage.setItem("matchcv_tracker_jobs", JSON.stringify(savedJobs));
  
  alert(`📌 "${title}" ilanı takip panonuza kaydedildi!`);
  renderTrackerList();
}

function renderTrackerList() {
  const container = document.getElementById("tracker-list");
  let savedJobs = JSON.parse(localStorage.getItem("matchcv_tracker_jobs") || "[]");

  if (savedJobs.length === 0) {
    container.innerHTML = `<p style="font-size:10px; color:#94a3b8; text-align:center;">Henüz kaydedilmiş ilan yok.</p>`;
    return;
  }

  container.innerHTML = savedJobs.map(j => `
    <div class="tracker-card">
      <div class="tracker-info">
        <h6>${j.title}</h6>
        <p>🏢 ${j.company} • 📅 ${j.date}</p>
      </div>
      <select class="status-select">
        <option ${j.status==='İnceleniyor'?'selected':''}>İnceleniyor</option>
        <option ${j.status==='Başvuruldu'?'selected':''}>Başvuruldu</option>
        <option ${j.status==='Mülakat'?'selected':''}>Mülakat</option>
        <option ${j.status==='Red'?'selected':''}>Red</option>
      </select>
    </div>
  `).join("");
}

function saveAutoFillData() {
  const data = {
    firstName: document.getElementById("af-firstname").value,
    lastName: document.getElementById("af-lastname").value,
    email: document.getElementById("af-email").value,
    phone: document.getElementById("af-phone").value,
    linkedin: document.getElementById("af-linkedin").value,
    github: document.getElementById("af-github").value
  };
  localStorage.setItem("matchcv_autofill_data", JSON.stringify(data));
  return data;
}

function loadAutoFillData() {
  const data = JSON.parse(localStorage.getItem("matchcv_autofill_data") || "{}");
  if (data.firstName) document.getElementById("af-firstname").value = data.firstName;
  if (data.lastName) document.getElementById("af-lastname").value = data.lastName;
  if (data.email) document.getElementById("af-email").value = data.email;
  if (data.phone) document.getElementById("af-phone").value = data.phone;
  if (data.linkedin) document.getElementById("af-linkedin").value = data.linkedin;
  if (data.github) document.getElementById("af-github").value = data.github;
}

async function triggerAutoFill() {
  const userData = saveAutoFillData();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "autoFillForm", userData: userData }, (res) => {
      if (res && res.count > 0) {
        alert(`⚡ Formdaki ${res.count} alan dolduruldu!`);
      } else {
        alert("Sayfada uygun boş form alanı bulunamadı.");
      }
    });
  } catch (e) {
    alert("Bu sayfada form doldurma tetiklenemedi. Sayfayı yenileyip tekrar deneyin.");
  }
}

function downloadOptimizedTextFile() {
  const title = document.getElementById("job-title-input").value;
  const company = document.getElementById("company-name-input").value;
  const tailoredSummary = document.getElementById("tailor-text").value;

  const content = `====================================================
MATCHCV OS - OPTİMİZE EDİLMİŞ CV ÖZETİ
====================================================
HEDEF ŞİRKET : ${company}
HEDEF POZİSYON: ${title}
TARİH          : ${new Date().toLocaleDateString('tr-TR')}
----------------------------------------------------

[PROFESYONEL ÖZET - ATS OPTİMİZE EDİLMİŞ METİN]
${tailoredSummary}

====================================================`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MatchCV_${company.replace(/\s+/g, '_')}_${title.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function generateCoverLetter() {
  showLoader(true);
  const formData = new FormData();
  formData.append("cv_text", "Aday Yetkinlikleri");
  formData.append("job_title", document.getElementById("job-title-input").value);
  formData.append("company", document.getElementById("company-name-input").value);
  formData.append("job_description", currentJobData.description || "İlan metni");

  try {
    const res = await fetch("http://localhost:8000/api/cover-letter", { method: "POST", body: formData });
    const data = await res.json();
    document.getElementById("cover-text").value = data.cover_letter;
    document.getElementById("copy-cover-btn").classList.remove("hidden");
  } catch (e) {
    alert("Niyet Mektubu oluşturulamadı.");
  } finally {
    showLoader(false);
  }
}

function showLoader(visible) {
  const loader = document.getElementById("loader");
  if (visible) loader.classList.remove("hidden");
  else loader.classList.add("hidden");
}