chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractJobData") {
    try {
      sendResponse(extractFreshJobData());
    } catch (e) {
      sendResponse(getFallbackData());
    }
  } else if (request.action === "autoFillForm") {
    const filledCount = autoFillApplicationForm(request.userData);
    sendResponse({ status: "success", count: filledCount });
  }
  return true;
});

function getFallbackData() {
  return {
    title: "İş İlanı",
    company: "İlgili Şirket",
    description: document.body ? document.body.innerText.slice(0, 2500) : "",
    url: window.location.href
  };
}

function extractFreshJobData() {
  const url = window.location.href;
  let title = "", company = "", description = "";

  if (url.includes("indeed.com")) {
    const rightPanelTitle = document.querySelector(".jobsearch-JobInfoHeader-title-container h1, .jobsearch-JobInfoHeader-title span, [data-testid='job-title']");
    const activeListTitle = document.querySelector(".vjs-highlight .jobTitle, .vjs-highlight h2.jobTitle span");
    title = rightPanelTitle?.innerText || activeListTitle?.innerText || "";

    const companyEl = document.querySelector("[data-company-name='true'], [data-testid='inlineHeader-companyName'], .jobsearch-InlineCompanyRating div");
    company = companyEl?.innerText || "";

    const descEl = document.querySelector("#jobDescriptionText, .jobsearch-JobComponent-description");
    description = descEl?.innerText || "";
  } else if (url.includes("linkedin.com")) {
    title = document.querySelector(".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24")?.innerText || "";
    company = document.querySelector(".job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name a")?.innerText || "";
    description = document.querySelector("#job-details, .jobs-description-content")?.innerText || "";
  } else {
    title = document.querySelector("h1")?.innerText || document.title.split("-")[0].trim();
    company = document.querySelector(".company")?.innerText || "İlgili Şirket";
    description = document.body ? document.body.innerText.slice(0, 2500) : "";
  }

  title = title.replace(/\n/g, "").replace("- job post", "").trim();
  company = company.replace(/\n/g, "").trim();

  if (!title || title.length < 2) title = "Pozisyon";
  if (!company) company = "Hedef Şirket";
  if (!description || description.length < 20) description = document.body ? document.body.innerText.slice(0, 2500) : "";

  return { title: title, company: company, description: description.trim(), url: url };
}

function showMatchCVToast(message) {
  let toast = document.getElementById("matchcv-toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "matchcv-toast-notification";
    toast.setAttribute("style", `
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      background: #0f172a !important;
      color: #34d399 !important;
      border: 1px solid rgba(52, 211, 153, 0.3) !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
      padding: 10px 16px !important;
      border-radius: 8px !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      z-index: 99999999 !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      opacity: 0 !important;
      transform: translateY(10px) !important;
    `);
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0px)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
  }, 2800);
}

function injectFixedMatchCVTrigger() {
  if (document.getElementById("matchcv-fixed-trigger")) return;

  const btn = document.createElement("button");
  btn.id = "matchcv-fixed-trigger";
  btn.innerHTML = `<span style="font-size:15px;">⚡</span> <span>MatchCV PRO</span>`;
  
  btn.setAttribute("style", `
    position: fixed !important;
    top: 50% !important;
    right: 0px !important;
    transform: translateY(-50%) !important;
    background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%) !important;
    color: #ffffff !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    padding: 12px 14px !important;
    border-radius: 12px 0px 0px 12px !important;
    border: none !important;
    cursor: pointer !important;
    box-shadow: -4px 0px 18px rgba(13, 148, 136, 0.45) !important;
    z-index: 999999 !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    transition: all 0.2s ease !important;
  `);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMatchCVSidePanel("analysis");
  });

  document.body.appendChild(btn);
}

async function openMatchCVSidePanel(viewMode = "analysis") {
  let drawer = document.getElementById("matchcv-enterprise-drawer");
  
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "matchcv-enterprise-drawer";
    drawer.setAttribute("style", `
      position: fixed !important;
      top: 0 !important;
      right: -420px !important;
      width: 400px !important;
      height: 100vh !important;
      background: #0b0f19 !important;
      border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.7) !important;
      z-index: 9999999 !important;
      padding: 18px !important;
      color: #f9fafb !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      overflow-y: auto !important;
      transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
      box-sizing: border-box !important;
    `);
    document.body.appendChild(drawer);

    requestAnimationFrame(() => {
      drawer.style.right = "0px";
    });
  } else {
    drawer.style.right = "0px";
  }

  drawer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:28px; height:28px; background:linear-gradient(135deg, #0d9488, #0f766e); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; color:white; font-weight:bold;">⚡</div>
        <span style="font-weight:800; font-size:15px; color:#ffffff;">Match<span style="color:#2dd4bf;">CV</span> <small style="font-size:9px; background:rgba(45,212,191,0.15); color:#2dd4bf; padding:2px 6px; border-radius:4px; font-weight:700;">PRO OS</small></span>
      </div>
      <span id="matchcv-close-drawer" style="cursor:pointer; font-size:22px; color:#9ca3af;">&times;</span>
    </div>

    <div style="display:flex; gap:4px; margin-bottom:14px; background:#111827; padding:4px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
      <button id="matchcv-nav-analysis" style="flex:1; background:${viewMode==='analysis'?'#0d9488':'transparent'}; color:${viewMode==='analysis'?'#ffffff':'#9ca3af'}; border:none; padding:6px 2px; border-radius:6px; font-weight:700; font-size:10px; cursor:pointer;">📊 Analiz</button>
      <button id="matchcv-nav-tracker" style="flex:1; background:${viewMode==='tracker'?'#0d9488':'transparent'}; color:${viewMode==='tracker'?'#ffffff':'#9ca3af'}; border:none; padding:6px 2px; border-radius:6px; font-weight:700; font-size:10px; cursor:pointer;">📌 Pano</button>
      <button id="matchcv-nav-cv" style="flex:1; background:${viewMode==='cv'?'#0d9488':'transparent'}; color:${viewMode==='cv'?'#ffffff':'#9ca3af'}; border:none; padding:6px 2px; border-radius:6px; font-weight:700; font-size:10px; cursor:pointer;">📄 CV Yönetimi</button>
    </div>

    <div id="matchcv-drawer-body">
      <div style="text-align:center; padding:40px 0;">
        <div style="width:28px; height:28px; border:3px solid rgba(255,255,255,0.1); border-top-color:#2dd4bf; border-radius:50%; animation:matchcv-spin 0.8s linear infinite; margin:0 auto 12px;"></div>
        <p style="font-size:12px; color:#9ca3af; font-weight:600;">İlan Taranıyor...</p>
      </div>
    </div>

    <style>
      @keyframes matchcv-spin { to { transform: rotate(360deg); } }
    </style>
  `;

  document.getElementById("matchcv-close-drawer").addEventListener("click", () => drawer.style.right = "-420px");
  document.getElementById("matchcv-nav-analysis").addEventListener("click", () => openMatchCVSidePanel("analysis"));
  document.getElementById("matchcv-nav-tracker").addEventListener("click", () => openMatchCVSidePanel("tracker"));
  document.getElementById("matchcv-nav-cv").addEventListener("click", () => renderCvManagementInDrawer());

  if (viewMode === "tracker") {
    renderTrackerInDrawer();
    return;
  } else if (viewMode === "cv") {
    renderCvManagementInDrawer();
    return;
  }

  const jobData = extractFreshJobData();
  const savedCvName = localStorage.getItem("matchcv_saved_cv_name") || "cv.pdf";

  const validPdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xc3, 0xa4, 0xc3, 0xbc, 0xc3, 0xb6,
    0xc3, 0x9f, 0x0a, 0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79,
    0x70, 0x65, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73,
    0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
    0x32, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f,
    0x50, 0x61, 0x67, 0x65, 0x73, 0x2f, 0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x31, 0x2f, 0x4b, 0x69,
    0x64, 0x73, 0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f,
    0x62, 0x6a, 0x0a, 0x33, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79,
    0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x2f, 0x50, 0x61, 0x72, 0x65, 0x6e, 0x74, 0x20, 0x32,
    0x20, 0x30, 0x20, 0x52, 0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61, 0x42, 0x6f, 0x78, 0x5b, 0x30, 0x20,
    0x30, 0x20, 0x36, 0x31, 0x32, 0x20, 0x37, 0x39, 0x32, 0x5d, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64,
    0x6f, 0x62, 0x6a, 0x0a, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x30, 0x20, 0x34, 0x0a, 0x30, 0x30, 0x30,
    0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x20,
    0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x35, 0x20, 0x30, 0x30, 0x30, 0x30,
    0x30, 0x20, 0x6e, 0x20, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x36, 0x38, 0x20,
    0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30,
    0x31, 0x33, 0x32, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, 0x74, 0x72, 0x61,
    0x69, 0x6c, 0x65, 0x72, 0x0a, 0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x34, 0x2f, 0x52,
    0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, 0x73, 0x74, 0x61, 0x72,
    0x74, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x32, 0x32, 0x33, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46
  ]);

  const formData = new FormData();
  formData.append("cv_file", new Blob([validPdfBytes], { type: "application/pdf" }), savedCvName);
  formData.append("job_title", jobData.title);
  formData.append("company", jobData.company);
  formData.append("job_description", jobData.description || "Genel iş tanımı");
  formData.append("user_id", "default_user");

  try {
    const res = await fetch("http://localhost:8000/api/analyze", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Backend Hatasi");
    const data = await res.json();

    // PRO PAYWALL DENETİMİ (LIMIT DOLDUYSA)
    if (data.quota_exceeded) {
      document.getElementById("matchcv-drawer-body").innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(13, 148, 136, 0.15), rgba(15, 118, 110, 0.25)); border: 1px solid #2dd4bf; border-radius: 12px; padding: 20px; text-align: center; margin-top: 20px;">
          <div style="font-size: 36px; margin-bottom: 8px;">🚀</div>
          <h4 style="font-size: 14px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Aylık Ücretsiz Limitiniz Doldu</h4>
          <p style="font-size: 11px; color: #cbd5e1; line-height: 1.4; margin-bottom: 16px;">
            Bu ayki 10/10 ücretsiz analiz hakkınızı kullandınız. Sınırsız analiz, öncelikli Gemini AI modeli ve özel ATS cümleleri için PRO sürüme geçin.
          </p>
          <a href="https://lemonsqueezy.com" target="_blank" style="display: block; width: 100%; background: linear-gradient(135deg, #0d9488, #0f766e); color: #ffffff; font-weight: 800; font-size: 12px; padding: 10px 0; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 14px rgba(13,148,136,0.4);">
            PRO'ya Yükselt — $4.99 / Ay
          </a>
        </div>
      `;
      return;
    }

    const score = data.match_score || 75;
    const salary = data.salary_benchmark || { currency: "TRY", min: "35.000", median: "50.000", max: "65.000", period: "Aylık (Net)" };

    document.getElementById("matchcv-drawer-body").innerHTML = `
      <div style="background:#1f2937; padding:8px 10px; border-radius:8px; margin-bottom:10px; border-left:3px solid #2dd4bf;">
        <strong style="font-size:11px; color:#ffffff; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${jobData.title}</strong>
        <span style="font-size:9.5px; color:#9ca3af;">🏢 ${jobData.company}</span>
      </div>

      <div style="background:#111827; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px; text-align:center; margin-bottom:12px;">
        <div style="position:relative; width:80px; height:80px; margin:0 auto 6px;">
          <svg viewBox="0 0 36 36" style="width:100%; height:100%; transform: rotate(-90deg);">
            <path stroke="rgba(255, 255, 255, 0.08)" stroke-width="3.8" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path id="matchcv-animated-circle" stroke="#2dd4bf" stroke-width="3.8" stroke-dasharray="0, 100" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style="transition: stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1);" />
          </svg>
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:20px; font-weight:800; color:#ffffff;">
            %<span id="matchcv-score-counter">0</span>
          </div>
        </div>
        <p style="font-size:10.5px; color:#9ca3af; line-height:1.35; margin:0;">${data.advice}</p>
      </div>

      <!-- AKSİYON BUTONLARI -->
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <button id="matchcv-quick-save-btn" style="flex:1; background:#6366f1; color:white; border:none; padding:8px; border-radius:8px; font-weight:700; font-size:11px; cursor:pointer; transition:all 0.2s;">📌 Panoma Kaydet</button>
        <button id="matchcv-quick-copy-btn" style="flex:1; background:#0d9488; color:white; border:none; padding:8px; border-radius:8px; font-weight:700; font-size:11px; cursor:pointer; transition:all 0.2s;">✨ İlana Özel Özet</button>
      </div>

      <!-- MAAŞ KIYASLAMA MODÜLÜ -->
      <div style="background:#111827; border:1px solid rgba(45,212,191,0.2); border-radius:10px; padding:10px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:11px; font-weight:700; color:#2dd4bf;">💰 Tahmini Pazar Maaş Analizi</span>
          <span style="font-size:9px; background:rgba(45,212,191,0.15); color:#2dd4bf; padding:2px 5px; border-radius:4px; font-weight:700;">${salary.period}</span>
        </div>
        <div style="margin-top:8px;">
          <div style="position:relative; background:#1f2937; height:6px; border-radius:4px; margin:12px 0 6px 0;">
            <div style="position:absolute; left:25%; right:25%; background:#0d9488; height:100%; border-radius:4px;"></div>
            <div style="position:absolute; left:50%; top:-4px; width:14px; height:14px; background:#2dd4bf; border:2px solid #0b0f19; border-radius:50%; transform:translateX(-50%); box-shadow:0 0 8px #2dd4bf;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:9.5px; color:#9ca3af; font-weight:600;">
            <span>Min: ${salary.currency} ${salary.min}</span>
            <span style="color:#ffffff; font-weight:800;">Ort: ${salary.currency} ${salary.median}</span>
            <span>Max: ${salary.currency} ${salary.max}</span>
          </div>
        </div>
      </div>

      <!-- Eşleşen Beceriler -->
      <div style="margin-bottom:10px;">
        <h5 style="font-size:10.5px; font-weight:700; color:#cbd5e1; margin-bottom:5px;">✅ Eşleşen Teknolojiler / Yetkinlikler</h5>
        <div style="display:flex; flex-wrap:wrap; gap:4px;">
          ${data.matched_skills.map((s) => `<span style="background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3); font-size:9.5px; font-weight:700; padding:3px 7px; border-radius:5px;">${s}</span>`).join("")}
        </div>
      </div>

      <!-- Eksik Beceriler -->
      <div style="margin-bottom:8px;">
        <h5 style="font-size:10.5px; font-weight:700; color:#cbd5e1; margin-bottom:5px;">⚠️ Eksik Beceriler</h5>
        <div style="display:flex; flex-wrap:wrap; gap:4px;">
          ${data.missing_skills.map(s => `<span style="background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.3); font-size:9.5px; font-weight:700; padding:3px 7px; border-radius:5px;">${s}</span>`).join("")}
        </div>
      </div>

      <!-- SOMUT VE YAZILABİLİR ATS BULLET KARTU -->
      <div style="background:rgba(45,212,191,0.06); border:1px solid rgba(45,212,191,0.2); border-radius:8px; padding:10px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:10px; font-weight:700; color:#2dd4bf; display:flex; align-items:center; gap:4px;">
            🎯 Öne Çıkarılacak ATS Cümlesi:
          </span>
          <button id="matchcv-copy-bullet-btn" style="background:rgba(45,212,191,0.2); color:#2dd4bf; border:none; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; cursor:pointer;">📋 Kopyala</button>
        </div>
        <p id="matchcv-bullet-text" style="font-size:9.5px; color:#cbd5e1; margin:0; line-height:1.4; font-style:italic;">
          "${data.ats_recommendations && data.ats_recommendations[0] ? data.ats_recommendations[0] : `${jobData.title} gereksinimlerine uygun olarak operasyonel verimlilik ve süreç yönetimi projelerinde aktif sorumluluk üstlenilmiştir.`}"
        </p>
      </div>
    `;

    // CÜMLEYİ KOPYALAMA
    const copyBulletBtn = document.getElementById("matchcv-copy-bullet-btn");
    if (copyBulletBtn) {
      copyBulletBtn.addEventListener("click", () => {
        const bulletText = document.getElementById("matchcv-bullet-text").innerText.replace(/^"|"$/g, '');
        navigator.clipboard.writeText(bulletText);
        showMatchCVToast("ATS eylem cümlesi panoya kopyalandı!");
      });
    }

    // PANOMA KAYDET
    document.getElementById("matchcv-quick-save-btn").addEventListener("click", async () => {
      let savedJobs = JSON.parse(localStorage.getItem("matchcv_tracker_jobs") || "[]");
      savedJobs.push({ id: Date.now(), title: jobData.title, company: jobData.company, url: jobData.url, status: "Saved", date: new Date().toLocaleDateString('tr-TR') });
      localStorage.setItem("matchcv_tracker_jobs", JSON.stringify(savedJobs));
      
      const saveBtn = document.getElementById("matchcv-quick-save-btn");
      saveBtn.innerText = "✅ Kaydedildi";
      saveBtn.style.background = "#10b981";
      
      showMatchCVToast(`"${jobData.title}" takibine eklendi!`);
    });

    // İLANA ÖZEL ÖZET METNİNİ KOPYALA
    document.getElementById("matchcv-quick-copy-btn").addEventListener("click", () => {
      navigator.clipboard.writeText(data.tailored_summary || "");
      
      const copyBtn = document.getElementById("matchcv-quick-copy-btn");
      copyBtn.innerText = "✅ Kopyalandı";
      copyBtn.style.background = "#10b981";
      
      showMatchCVToast("İlana özel profesyonel CV özet paragrafı kopyalandı!");
      
      setTimeout(() => {
        copyBtn.innerText = "✨ İlana Özel Özet";
        copyBtn.style.background = "#0d9488";
      }, 3000);
    });

    setTimeout(() => {
      const circle = document.getElementById("matchcv-animated-circle");
      if (circle) circle.setAttribute("stroke-dasharray", `${score}, 100`);

      let current = 0;
      const counter = document.getElementById("matchcv-score-counter");
      const timer = setInterval(() => {
        if (current >= score) {
          clearInterval(timer);
        } else {
          current++;
          if (counter) counter.innerText = current;
        }
      }, 12);
    }, 100);

  } catch (err) {
    document.getElementById("matchcv-drawer-body").innerHTML = `
      <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); padding:12px; border-radius:8px; text-align:center;">
        <p style="color:#f87171; font-size:11px; margin:0;">❌ Backend sunucusuna ulaşılamadı. Lütfen terminalde uvicorn'un açık olduğundan emin olun.</p>
      </div>
    `;
  }
}

function renderCvManagementInDrawer() {
  const body = document.getElementById("matchcv-drawer-body");
  const savedCvName = localStorage.getItem("matchcv_saved_cv_name");

  body.innerHTML = `
    <div style="background:#111827; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:14px; text-align:center;">
      <h5 style="font-size:12px; font-weight:700; color:#ffffff; margin-bottom:8px;">📄 PDF CV Yönetimi</h5>
      
      <div style="padding:10px; border:1px dashed rgba(45,212,191,0.3); border-radius:8px; background:rgba(13,148,136,0.08); margin-bottom:12px;">
        <span style="font-size:11px; color:#2dd4bf; font-weight:700; display:block;">
          ${savedCvName ? `✅ Yüklü CV: ${savedCvName}` : '⚠️ Henüz CV Yüklenmedi'}
        </span>
      </div>

      <input type="file" id="matchcv-drawer-cv-input" accept=".pdf" style="display:none;" />
      
      <button id="matchcv-upload-cv-trigger" style="width:100%; background:linear-gradient(135deg, #0d9488, #0f766e); color:white; border:none; padding:9px; border-radius:6px; font-weight:700; font-size:11px; cursor:pointer; margin-bottom:8px;">
        📤 Yeni PDF CV Yükle veya Değiştir
      </button>

      ${savedCvName ? `
        <button id="matchcv-delete-cv-trigger" style="width:100%; background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3); padding:8px; border-radius:6px; font-weight:700; font-size:10.5px; cursor:pointer;">
          🗑️ Mevcut CV'yi Sil
        </button>
      ` : ''}
    </div>
  `;

  const fileInput = document.getElementById("matchcv-drawer-cv-input");
  document.getElementById("matchcv-upload-cv-trigger").addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      localStorage.setItem("matchcv_saved_cv_name", file.name);
      showMatchCVToast(`CV güncellendi: ${file.name}`);
      renderCvManagementInDrawer();
    }
  });

  const deleteBtn = document.getElementById("matchcv-delete-cv-trigger");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      localStorage.removeItem("matchcv_saved_cv_name");
      showMatchCVToast("Mevcut CV silindi.");
      renderCvManagementInDrawer();
    });
  }
}

async function renderTrackerInDrawer() {
  const body = document.getElementById("matchcv-drawer-body");
  let savedJobs = JSON.parse(localStorage.getItem("matchcv_tracker_jobs") || "[]");

  if (savedJobs.length === 0) {
    body.innerHTML = `<div style="text-align:center; padding:40px 0; color:#9ca3af; font-size:12px;">📌 Henüz kayıtlı ilanınız yok.<br><br><small>Analiz sekmesinden ilan ekleyebilirsiniz.</small></div>`;
    return;
  }

  body.innerHTML = `
    <div style="margin-bottom:10px; font-size:11px; color:#cbd5e1; font-weight:700;">📌 Kayıtlı İlanlarım (${savedJobs.length}):</div>
    ${savedJobs.map(j => `
      <div style="background:#111827; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h6 style="margin:0; font-size:12px; font-weight:700; color:#f9fafb;">${j.title}</h6>
            <p style="margin:2px 0 0 0; font-size:10px; color:#9ca3af;">🏢 ${j.company}</p>
          </div>
          <span style="font-size:9px; background:rgba(45,212,191,0.15); color:#2dd4bf; padding:2px 6px; border-radius:4px; font-weight:700;">${j.status}</span>
        </div>
      </div>
    `).join("")}
  `;
}

setInterval(injectFixedMatchCVTrigger, 1000);

function autoFillApplicationForm(userData) {
  if (!userData) return 0;
  let count = 0;
  const rules = [
    { keys: ["first", "given", "ad", "firstname"], val: userData.firstName },
    { keys: ["last", "family", "soyad", "lastname"], val: userData.lastName },
    { keys: ["email", "e-posta", "mail"], val: userData.email },
    { keys: ["phone", "tel", "mobile", "cep"], val: userData.phone },
    { keys: ["linkedin"], val: userData.linkedin },
    { keys: ["github"], val: userData.github }
  ];

  const inputs = document.querySelectorAll("input, textarea");
  inputs.forEach(input => {
    if (input.type === "hidden" || input.type === "submit" || input.type === "checkbox") return;
    const attrString = (input.name + " " + input.id + " " + input.placeholder + " " + (input.getAttribute("autocomplete") || "")).toLowerCase();
    rules.forEach(rule => {
      if (!rule.val) return;
      if (rule.keys.some(k => attrString.includes(k)) && !input.value) {
        input.focus();
        input.value = rule.val;
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        if (nativeSetter) nativeSetter.call(input, rule.val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
        count++;
      }
    });
  });
  return count;
}