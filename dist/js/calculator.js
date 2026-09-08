/* =========================================================
   Kalkulator IPv4 / CIDR — vanilla JS, tanpa library tambahan
   Semua perhitungan murni di browser (client-side), tidak
   perlu backend atau database.
   ========================================================= */

// --- Helper: ubah IP string "192.168.1.1" jadi angka 32-bit ---
function ipToInt(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    throw new Error("Format IP tidak valid. Contoh: 192.168.1.1");
  }
  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  );
}

// --- Helper: ubah angka 32-bit balik jadi IP string ---
function intToIp(int) {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join(".");
}

// --- Helper: ubah angka 32-bit jadi biner dengan titik tiap oktet ---
function intToBinary(int) {
  const bin = (int >>> 0).toString(2).padStart(32, "0");
  return bin.match(/.{1,8}/g).join(".");
}

// --- Helper: dari prefix (/24) jadi subnet mask integer ---
function prefixToMaskInt(prefix) {
  if (prefix < 0 || prefix > 32) {
    throw new Error("Prefix harus antara /0 sampai /32");
  }
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

// --- Fungsi utama: hitung semua detail subnet dari IP + CIDR ---
function calculateSubnet(ipStr, prefix) {
  const ipInt = ipToInt(ipStr);
  const maskInt = prefixToMaskInt(prefix);
  const wildcardInt = (~maskInt) >>> 0;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalHosts = Math.pow(2, 32 - prefix);
  let firstHost, lastHost, usableHosts;
  if (prefix >= 31) {
    firstHost = intToIp(networkInt);
    lastHost = intToIp(broadcastInt);
    usableHosts = prefix === 32 ? 1 : 2;
  } else {
    firstHost = intToIp(networkInt + 1);
    lastHost = intToIp(broadcastInt - 1);
    usableHosts = totalHosts - 2;
  }

  return {
    ip: ipStr,
    prefix,
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    firstHost,
    lastHost,
    totalHosts,
    usableHosts,
    binaryIp: intToBinary(ipInt),
    binaryMask: intToBinary(maskInt),
    binaryNetwork: intToBinary(networkInt),
  };
}

// --- Render hasil ke DOM ---
function renderResult(result) {
  const rows = [
    ["Network Address", result.networkAddress],
    ["Broadcast Address", result.broadcastAddress],
    ["Subnet Mask", `${result.subnetMask} (/${result.prefix})`],
    ["Wildcard Mask", result.wildcardMask],
    ["Host Range", `${result.firstHost} - ${result.lastHost}`],
    ["Usable Hosts", result.usableHosts.toLocaleString("id-ID")],
    ["Total Hosts", result.totalHosts.toLocaleString("id-ID")],
  ];

  const tbody = document.getElementById("result-body");
  tbody.innerHTML = rows
    .map(
      ([label, value]) => `
      <tr class="border-b border-slate-200 dark:border-slate-700">
        <td class="py-3 pr-4 font-medium text-secondary dark:text-slate-300">${label}</td>
        <td class="py-3 font-mono text-dark dark:text-white">${value}</td>
      </tr>`
    )
    .join("");

  document.getElementById("binary-ip").textContent = result.binaryIp;
  document.getElementById("binary-mask").textContent = result.binaryMask;
  document.getElementById("binary-network").textContent = result.binaryNetwork;

  document.getElementById("result-card").classList.remove("hidden");
  document.getElementById("error-box").classList.add("hidden");
}

function showError(message) {
  const box = document.getElementById("error-box");
  box.textContent = message;
  box.classList.remove("hidden");
  document.getElementById("result-card").classList.add("hidden");
}

// --- Simpan riwayat 5 perhitungan terakhir di localStorage ---
function saveHistory(ipStr, prefix) {
  const key = "ipv4-calc-history";
  let history = JSON.parse(localStorage.getItem(key) || "[]");
  const entry = `${ipStr}/${prefix}`;
  history = [entry, ...history.filter((h) => h !== entry)].slice(0, 5);
  localStorage.setItem(key, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const key = "ipv4-calc-history";
  const history = JSON.parse(localStorage.getItem(key) || "[]");
  const wrap = document.getElementById("history-list");
  if (!wrap) return;

  if (history.length === 0) {
    wrap.innerHTML = `<p class="text-sm text-secondary dark:text-slate-400">Belum ada riwayat perhitungan.</p>`;
    return;
  }

  wrap.innerHTML = history
    .map(
      (entry) => `
      <button
        type="button"
        data-entry="${entry}"
        class="history-item mr-2 mb-2 rounded-full border border-slate-300 px-3 py-1 text-sm text-dark hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-200"
      >${entry}</button>`
    )
    .join("");

  wrap.querySelectorAll(".history-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [ip, prefix] = btn.dataset.entry.split("/");
      document.getElementById("ip-input").value = ip;
      document.getElementById("prefix-input").value = prefix;
      runCalculation();
    });
  });
}

// --- Jalankan perhitungan dari nilai form ---
function runCalculation() {
  const ipStr = document.getElementById("ip-input").value.trim();
  const prefix = parseInt(document.getElementById("prefix-input").value, 10);

  try {
    if (!ipStr) throw new Error("Isi dulu alamat IP-nya, ya.");
    const result = calculateSubnet(ipStr, prefix);
    renderResult(result);
    saveHistory(ipStr, prefix);
  } catch (err) {
    showError(err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("calc-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      runCalculation();
    });
  }
  renderHistory();

  // Tombol untuk menghapus riwayat (menggunakan key "ipv4-calc-history")
  const clearHistoryBtn = document.getElementById('clear-history');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', function (e) {
      e.preventDefault(); // Mencegah tombol melakukan submit form
      localStorage.removeItem('ipv4-calc-history'); 
      renderHistory(); // Perbarui tampilan riwayat langsung tanpa perlu reload halaman
    });
  }
});

// Fungsi untuk menyalin teks ke clipboard
function copyText(elementId, btnElement) {
  const text = document.getElementById(elementId).innerText;
  
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = btnElement.innerHTML;
    
    btnElement.innerHTML = '<span class="text-xs font-semibold text-sky-800">Copied!</span>';
    
    setTimeout(() => {
      btnElement.innerHTML = originalHTML;
    }, 2000);
  }).catch(err => {
    console.error('Gagal menyalin teks: ', err);
  });
}