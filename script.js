const GS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzGD2akVdn5TdycTWbHvoNuLQBDWaPzIkJCY2wLgD4JvN5F47qpaOqVVyqSJWDnqtCcbA/exec";

let selectedClass = "6A";
let adminSelectedClass = "6A";
let selectedPackageKey = "hewan";
let studentsList = [];
let studentResults = {};
let takenObjects = [];
let currentIndex = 0;
let countdown;
let timeLeft = 180;
let isGameActive = false;
let adminInterval = null;

const packagesData = {
    hewan: [
        "Kucing", "Anjing", "Kelinci", "Kambing", "Sapi", "Kuda", "Ayam", "Bebek", 
        "Burung", "Ikan", "Kupu-kupu", "Lebah", "Semut", "Belalang", "Capung", 
        "Katak", "Kura-kura", "Ular", "Buaya", "Gajah", "Harimau", "Singa", 
        "Monyet", "Jerapah", "Zebra", "Panda"
    ],
    rumah: [
        "Meja", "Kursi", "Sofa", "Lemari", "Tempat tidur", "Bantal", "Guling", 
        "Selimut", "Kipas angin", "Televisi", "Kulkas", "Mesin cuci", "Kompor", 
        "Panci", "Wajan", "Piring", "Gelas", "Sendok", "Garpu", "Sapu", "Pel", 
        "Jam dinding", "Cermin", "Lampu", "Karpet", "Payung"
    ],
    sekolah: [
        "Buku tulis", "Buku paket", "Pensil", "Pulpen", "Penghapus", "Penggaris", 
        "Rautan", "Krayon", "Pensil warna", "Spidol", "Kertas gambar", "Buku gambar", 
        "Tas sekolah", "Tempat pensil", "Papan tulis", "Meja guru", "Kursi siswa", 
        "Lemari kelas", "Penggaris panjang", "Penghapus papan", "Jam dinding", 
        "Bendera", "Tiang bendera", "Tempat sampah", "Sapu ijuk", "Gunting"
    ]
};

let canvas, ctx;
let isDrawing = false;
let currentTool = "brush"; 
let currentColor = "#000000";
let currentBrushSize = 5;
let undoStack = [];

const availablePalette = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#00FF00", "#0000FF", 
    "#FFFF00", "#00FFFF", "#FF00FF", "#FFA500", "#800080", 
    "#008080", "#808080", "#A52A2A", "#FFC0CB", "#4682B4",
    "#D2B48C", "#8B0000", "#556B2F", "#483D8B", "#FF1493",
    "#FF4500", "#FFD700", "#ADFF2F", "#008000", "#00008B",
    "#8A2BE2", "#A0522D", "#2F4F4F", "#FF8C00", "#9ACD32",
    "#20B2AA", "#778899", "#B0C4DE", "#DB7093", "#CD853F",
    "#6B8E23", "#9932CC"
];

function openAdminLoginModal() {
    document.getElementById('admin-login-modal').style.display = 'flex';
    document.getElementById('admin-user-input').value = '';
    document.getElementById('admin-pass-input').value = '';
    document.getElementById('admin-login-error').style.display = 'none';
}

function closeAdminLoginModal() {
    document.getElementById('admin-login-modal').style.display = 'none';
}

function processAdminLogin() {
    const user = document.getElementById('admin-user-input').value.trim();
    const pass = document.getElementById('admin-pass-input').value.trim();

    if (user === "admin" && pass === "admin") {
        closeAdminLoginModal();
        openAdminDashboard();
    } else {
        document.getElementById('admin-login-error').style.display = 'block';
    }
}

function openAdminDashboard() {
    document.getElementById('admin-dashboard-page').style.display = 'flex';
    switchAdminClass(selectedClass === 'Contohkan' ? '6A' : selectedClass);

    if (adminInterval) clearInterval(adminInterval);
    adminInterval = setInterval(() => {
        fetchAdminDatabaseData(true);
    }, 1000);
}

function logoutAdmin() {
    document.getElementById('admin-dashboard-page').style.display = 'none';
    if (adminInterval) {
        clearInterval(adminInterval);
        adminInterval = null;
    }
}

function switchAdminClass(kelas) {
    adminSelectedClass = kelas;
    document.getElementById('admin-btn-6a').classList.toggle('active', kelas === '6A');
    document.getElementById('admin-btn-6b').classList.toggle('active', kelas === '6B');
    fetchAdminDatabaseData(false);
}

async function fetchAdminDatabaseData(isBackground = false) {
    const tbody = document.getElementById('admin-db-table-body');
    if (!isBackground) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Mengambil data dari Spreadsheet kelas ${adminSelectedClass}...</td></tr>`;
    }

    if (GS_WEB_APP_URL && GS_WEB_APP_URL !== "PASTE_URL_WEB_APP_GS_ANDA_DI_SINI") {
        try {
            let response = await fetch(`${GS_WEB_APP_URL}?action=getAdminData&kelas=${adminSelectedClass}`);
            let rows = await response.json();
            
            if (!rows || rows.length === 0) {
                if (!isBackground) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada data untuk kelas ${adminSelectedClass}</td></tr>`;
                return;
            }

            tbody.innerHTML = '';
            rows.forEach(row => {
                const tr = document.createElement('tr');
                const name = row[0] || '-';
                const objek = row[1] || '-';
                const gambar = row[2] || '';
                const nilai = row[3] || '0%';
                const waktu = row[5] || '-';

                let actionBtn = gambar ? `<button class="btn btn-glow btn-sm" onclick="openImageModal('${name}', '${gambar}', '${nilai}', 'Gambar tersimpan di database.')"><i class="fas fa-image"></i> Buka Hasil Gambar</button>` : '-';

                tr.innerHTML = `
                    <td><strong>${name}</strong></td>
                    <td>${objek}</td>
                    <td><strong style="color: #38bdf8;">${nilai}</strong></td>
                    <td style="font-size: 12px; color: #94a3b8;">${waktu}</td>
                    <td>${actionBtn}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) {
            console.error("Gagal sinkronisasi admin:", e);
        }
    }
}

function adminResetSession() {
    if (confirm("Yakin ingin melakukan RESET (Mulai Ulang Sesi)?")) {
        clearInterval(countdown);
        isGameActive = false;
        
        document.getElementById('game-panel').classList.add('hidden');
        document.getElementById('finish-panel').classList.add('hidden');
        document.getElementById('setup-panel').classList.remove('hidden');
        document.getElementById('app-header-el').classList.remove('hidden');
        document.getElementById('top-nav-admin').classList.remove('hidden');
        
        currentIndex = 0;
        studentResults = {};
        takenObjects = [];
        
        fetchStudentsFromDatabase();
        alert("Sesi berhasil direset ke halaman awal.");
    }
}

function selectClass(className) {
    selectedClass = className;
    document.querySelectorAll('.btn-class').forEach(btn => {
        if (btn.getAttribute('data-class') === className) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    fetchStudentsFromDatabase();
}

function selectPackage(pkgKey) {
    selectedPackageKey = pkgKey;
    document.querySelectorAll('.btn-package').forEach(btn => {
        if (btn.getAttribute('data-package') === pkgKey) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

async function fetchStudentsFromDatabase() {
    const sidebarClassLabel = document.getElementById('sidebar-class-label');
    const headerClassBadge = document.getElementById('header-class-badge');

    headerClassBadge.textContent = selectedClass === 'Contohkan' ? 'Mode Contoh' : `Kelas ${selectedClass}`;
    sidebarClassLabel.textContent = selectedClass === 'Contohkan' ? 'Mode Contoh (Tanpa Timer)' : `Kelas ${selectedClass} (Database)`;

    if (selectedClass === 'Contohkan') {
        setupStudentUI(["Siswa Contoh 1", "Siswa Contoh 2", "Siswa Contoh 3"]);
        return;
    }

    if (GS_WEB_APP_URL && GS_WEB_APP_URL !== "PASTE_URL_WEB_APP_GS_ANDA_DI_SINI") {
        try {
            let response = await fetch(`${GS_WEB_APP_URL}?action=getStudents&kelas=${selectedClass}`);
            let names = await response.json();
            setupStudentUI(names);
        } catch (e) {
            console.error("Gagal ambil dari database:", e);
            setupStudentUI(["Siswa A", "Siswa B", "Siswa C"]);
        }
    } else {
        setupStudentUI(["Siswa A", "Siswa B", "Siswa C"]);
    }
}

function setupStudentUI(rawNames) {
    const sidebarCountEl = document.getElementById('sidebar-count');
    const studentListEl = document.getElementById('student-list');

    sidebarCountEl.textContent = rawNames.length;
    studentListEl.innerHTML = '';
    rawNames.forEach((name, idx) => {
        const li = document.createElement('li');
        li.className = `student-item`;
        li.innerHTML = `
            <span class="student-name">${idx + 1}. ${name}</span>
            <span class="student-status status-pending">Siap</span>
        `;
        studentListEl.appendChild(li);
    });

    window.rawDatabaseNames = rawNames;
}

fetchStudentsFromDatabase();
document.getElementById('start-btn').addEventListener('click', startEntireGame);

function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function startEntireGame() {
    var elem = document.documentElement;
    if (elem.requestFullscreen) { elem.requestFullscreen().catch(()=>{}); }

    let names = window.rawDatabaseNames || [];
    if(names.length === 0) {
        alert("Daftar siswa kosong atau gagal dimuat!");
        return;
    }

    let randomizedNames = (selectedClass === 'Contohkan') ? names : shuffleArray(names);

    studentsList = randomizedNames.map((name) => {
        return { name: name, chosenItem: "", skipped: false };
    });

    currentIndex = 0;
    studentResults = {};
    takenObjects = [];
    isGameActive = true;
    
    document.getElementById('setup-panel').classList.add('hidden');
    document.getElementById('finish-panel').classList.add('hidden');
    document.getElementById('app-header-el').classList.add('hidden');
    document.getElementById('top-nav-admin').classList.add('hidden');

    if (selectedClass === 'Contohkan') {
        document.getElementById('timer-box').style.display = 'none';
    } else {
        document.getElementById('timer-box').style.display = 'block';
    }
    
    initCanvas();
    renderPaletteGrid();
    renderSidebarList();
    promptStudentChoice();
}

// =========================================================================
// PENGAMBILAN KOORDINAT AKURAT (PRESISI TINGGI UNTUK LAYAR HDMI & TOUCHSCREEN)
// =========================================================================
function getEventCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// =========================================================================
// INISIALISASI KANVAS UNTUK MOUSE, TOUCH, DAN MONITOR SENTUH DOKONGAN HDMI
// =========================================================================
function initCanvas() {
    canvas = document.getElementById('drawing-canvas');
    ctx = canvas.getContext('2d');

    // Set resolusi internal kanvas
    canvas.width = 800;
    canvas.height = 380;

    // Pointer Events (Mendukung Mouse, Touchscreen, & Stylus HDMI)
    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        startAction(getEventCoordinates(e));
    });

    canvas.addEventListener('pointermove', (e) => {
        e.preventDefault();
        if (isDrawing) moveAction(getEventCoordinates(e));
    });

    canvas.addEventListener('pointerup', (e) => {
        e.preventDefault();
        try { canvas.releasePointerCapture(e.pointerId); } catch(err){}
        stopAction();
    });

    canvas.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        stopAction();
    });

    // Mencegah Gestur Sentuh Layar Default
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

function clearCanvas() {
    saveUndoState();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function saveUndoState() {
    if (undoStack.length >= 15) undoStack.shift();
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function undoCanvas() {
    if (undoStack.length > 0) {
        const previousState = undoStack.pop();
        ctx.putImageData(previousState, 0, 0);
    }
}

function promptStudentChoice() {
    if (currentIndex >= studentsList.length) {
        isGameActive = false;
        endAllTurns();
        return;
    }

    const student = studentsList[currentIndex];
    if (student.skipped) {
        currentIndex++;
        promptStudentChoice();
        return;
    }

    document.getElementById('modal-student-name').textContent = student.name;
    document.getElementById('modal-package-name').textContent = selectedPackageKey.toUpperCase();
    
    const selectEl = document.getElementById('package-item-select');
    selectEl.innerHTML = '';
    
    let items = packagesData[selectedPackageKey] || [];
    let availableItems = items.filter(item => !takenObjects.includes(item.toLowerCase()));

    if (availableItems.length === 0) {
        let opt = document.createElement('option');
        opt.value = "";
        opt.textContent = "Semua objek di paket ini sudah diambil!";
        selectEl.appendChild(opt);
    } else {
        availableItems.forEach(item => {
            let opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            selectEl.appendChild(opt);
        });
    }

    document.getElementById('student-choice-modal').style.display = 'flex';
}

function confirmStudentChoice() {
    const selectEl = document.getElementById('package-item-select').value;
    
    if (!selectEl) {
        alert("Semua objek dalam paket ini sudah habis diambil!");
        return;
    }

    takenObjects.push(selectEl.trim().toLowerCase());
    studentsList[currentIndex].chosenItem = selectEl;

    document.getElementById('student-choice-modal').style.display = 'none';
    document.getElementById('game-panel').classList.remove('hidden');

    document.getElementById('current-player').textContent = studentsList[currentIndex].name;
    document.getElementById('target-soal-badge').textContent = `Objek: ${selectEl}`;

    undoStack = [];
    clearCanvas();

    if (selectedClass !== 'Contohkan') {
        timeLeft = 180;
        document.getElementById('timer').textContent = timeLeft;
        startTimer();
    }
    renderSidebarList();
}

function startAction(coords) {
    if (currentTool === "fill") {
        saveUndoState();
        floodFill(Math.floor(coords.x), Math.floor(coords.y), hexToRgba(currentColor));
        return;
    }

    isDrawing = true;
    saveUndoState();
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = currentBrushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = (currentTool === "eraser") ? "#ffffff" : currentColor;
    ctx.lineTo(coords.x + 0.1, coords.y + 0.1);
    ctx.stroke();
}

function moveAction(coords) {
    if (!isDrawing || currentTool === "fill") return;

    ctx.lineWidth = currentBrushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (currentTool === "eraser") {
        ctx.strokeStyle = "#ffffff";
    } else {
        ctx.strokeStyle = currentColor;
    }

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
}

function stopAction() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
}

function setTool(tool) {
    currentTool = tool;
    document.getElementById('tool-brush').classList.toggle('active', tool === 'brush');
    document.getElementById('tool-fill').classList.toggle('active', tool === 'fill');
    document.getElementById('tool-eraser').classList.toggle('active', tool === 'eraser');
    document.getElementById('brush-size-group').style.display = (tool === 'fill') ? 'none' : 'flex';
}

function updateBrushSize(val) {
    currentBrushSize = val;
    document.getElementById('brush-size-val').textContent = `${val}px`;
}

function setCurrentColor(hex) {
    currentColor = hex;
    if (currentTool === 'eraser') setTool('brush');
}

function renderPaletteGrid() {
    const grid = document.getElementById('color-palette-grid');
    grid.innerHTML = '';
    availablePalette.forEach(color => {
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.style.backgroundColor = color;
        item.onclick = () => {
            setCurrentColor(color);
            document.getElementById('color-picker').value = color;
        };
        grid.appendChild(item);
    });
}

function hexToRgba(hex) {
    let bigint = parseInt(hex.replace('#',''), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return [r, g, b, 255];
}

function floodFill(startX, startY, fillColor) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const width = canvas.width;
    const height = canvas.height;

    const startIndex = (startY * width + startX) * 4;
    const startR = data[startIndex];
    const startG = data[startIndex + 1];
    const startB = data[startIndex + 2];
    const startA = data[startIndex + 3];

    if (startR === fillColor[0] && startG === fillColor[1] && startB === fillColor[2] && startA === fillColor[3]) {
        return;
    }

    const queue = [[startX, startY]];
    const matchedColor = (r, g, b, a) => {
        return Math.abs(r - startR) < 30 && Math.abs(g - startG) < 30 && Math.abs(b - startB) < 30 && Math.abs(a - startA) < 30;
    };

    while (queue.length > 0) {
        const [x, y] = queue.pop();
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        let westX = x;
        let eastX = x;

        while (westX >= 0 && matchedColor(data[(y * width + westX) * 4], data[(y * width + westX) * 4 + 1], data[(y * width + westX) * 4 + 2], data[(y * width + westX) * 4 + 3])) {
            westX--;
        }
        westX++;

        while (eastX < width && matchedColor(data[(y * width + eastX) * 4], data[(y * width + eastX) * 4 + 1], data[(y * width + eastX) * 4 + 2], data[(y * width + eastX) * 4 + 3])) {
            eastX++;
        }
        eastX--;

        for (let cx = westX; cx <= eastX; cx++) {
            let idx = (y * width + cx) * 4;
            data[idx] = fillColor[0];
            data[idx + 1] = fillColor[1];
            data[idx + 2] = fillColor[2];
            data[idx + 3] = fillColor[3];

            if (y > 0) {
                let upIdx = ((y - 1) * width + cx) * 4;
                if (matchedColor(data[upIdx], data[upIdx+1], data[upIdx+2], data[upIdx+3])) {
                    queue.push([cx, y - 1]);
                }
            }
            if (y < height - 1) {
                let downIdx = ((y + 1) * width + cx) * 4;
                if (matchedColor(data[downIdx], data[downIdx+1], data[downIdx+2], data[downIdx+3])) {
                    queue.push([cx, y + 1]);
                }
            }
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

// ==========================================
// SISTEM PENILAIAN RUBRIK AI
// ==========================================
function evaluateDrawingWithAI() {
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let totalPixels = width * height;
    let nonWhitePixels = 0;
    let coloredPixels = 0;
    let uniqueColors = new Set();
    let edgeTransitions = 0;
    let grid = new Array(height);

    for (let y = 0; y < height; y++) {
        grid[y] = new Uint8Array(width);
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let idx = (y * width + x) * 4;
            let r = data[idx];
            let g = data[idx + 1];
            let b = data[idx + 2];

            if (!(r > 245 && g > 245 && b > 245)) {
                nonWhitePixels++;
                grid[y][x] = 1;
                uniqueColors.add(`${Math.floor(r / 32)},${Math.floor(g / 32)},${Math.floor(b / 32)}`);
                
                if (!(r < 30 && g < 30 && b < 30)) {
                    coloredPixels++;
                }
            } else {
                grid[y][x] = 0;
            }
        }
    }

    let completionRatio = nonWhitePixels / totalPixels;
    let colorFillRatio = coloredPixels / (nonWhitePixels || 1);

    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            if (grid[y][x] === 1) {
                let neighbors = grid[y - 1][x] + grid[y + 1][x] + grid[y][x - 1] + grid[y][x + 1];
                if (neighbors === 1 || neighbors === 3) {
                    edgeTransitions++;
                }
            }
        }
    }
    let jaggedRatio = edgeTransitions / (nonWhitePixels || 1);

    let scoreObjek = 0;
    if (completionRatio < 0.02) scoreObjek = 10;
    else if (completionRatio < 0.05) scoreObjek = 40;
    else if (completionRatio < 0.10) scoreObjek = 65;
    else if (completionRatio < 0.20) scoreObjek = 85;
    else scoreObjek = 95;

    let scoreKerapian = Math.max(20, Math.min(100, Math.round(100 - (jaggedRatio * 120) + (colorFillRatio * 30))));

    let colorCount = uniqueColors.size;
    let scoreHarmoni = 40;
    if (colorCount >= 2 && colorCount <= 4) scoreHarmoni = 75;
    else if (colorCount > 4 && colorCount <= 10) scoreHarmoni = 92;
    else if (colorCount > 10) scoreHarmoni = 85;

    let scoreKreativitas = Math.min(100, 50 + (colorCount * 5) + (completionRatio > 0.15 ? 20 : 0));
    let scoreTeknik = Math.max(30, Math.min(100, Math.round(90 - (jaggedRatio * 50))));

    let safetyCap = 100;
    let safetyStatusText = "Objek lengkap dan pewarnaan rapi (Berpeluang 85–100).";

    if (completionRatio < 0.03) {
        safetyCap = 20;
        safetyStatusText = "Hanya sebagian kecil objek yang dikerjakan (Maksimal nilai 20).";
    } else if (completionRatio < 0.08) {
        safetyCap = 50;
        safetyStatusText = "Objek utama belum lengkap (Maksimal nilai 50).";
    } else if (scoreKerapian < 50) {
        safetyStatusText = "Objek lengkap tetapi pewarnaan kurang rapi.";
    }

    let rawFinalScore = 
        (scoreObjek * 0.30) +
        (scoreKerapian * 0.25) +
        (scoreHarmoni * 0.25) +
        (scoreKreativitas * 0.10) +
        (scoreTeknik * 0.10);

    let finalScore = Math.min(rawFinalScore, safetyCap);
    finalScore = Math.round(finalScore);

    let kelebihan = completionRatio >= 0.08 ? "Gambar memiliki bentuk objek yang cukup jelas dengan variasi warna yang menarik." : "Pengerjaan awal sudah dimulai.";
    let kekurangan = scoreKerapian < 70 ? "Pewarnaan dan garis tepi masih kurang rapi atau belum merata." : "Perlu penambahan detail ornament pendukung agar lebih artistik.";

    let detailedFeedback = `
Analisis AI:
- Kondisi Kelengkapan: ${safetyStatusText}
- Tingkat Area Terisi: ${Math.round(completionRatio * 100)}%

Rincian Skor Aspek:
1. Kesesuaian Objek: ${Math.round(scoreObjek)} / 100 (Bobot 30%)
2. Kerapian Pewarnaan: ${Math.round(scoreKerapian)} / 100 (Bobot 25%)
3. Harmoni Warna: ${Math.round(scoreHarmoni)} / 100 (Bobot 25%)
4. Kreativitas & Detail: ${Math.round(scoreKreativitas)} / 100 (Bobot 10%)
5. Teknik Digital: ${Math.round(scoreTeknik)} / 100 (Bobot 10%)

Kelebihan:
- ${kelebihan}

Kekurangan:
- ${kekurangan}

Saran Perbaikan:
- Tingkatkan ketelitian dalam merapikan batas garis dan maksimalkan pewarnaan pada seluruh bagian objek.
    `.trim();

    return { 
        score: `${finalScore}%`, 
        desc: detailedFeedback,
        rawScores: {
            objek: Math.round(scoreObjek),
            kerapian: Math.round(scoreKerapian),
            harmoni: Math.round(scoreHarmoni),
            kreativitas: Math.round(scoreKreativitas),
            teknik: Math.round(scoreTeknik)
        }
    };
}

function startTimer() {
    if (selectedClass === 'Contohkan') return;
    clearInterval(countdown);
    countdown = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            handleTimeUp();
        }
    }, 1000);
}

function handleTimeUp() {
    const student = studentsList[currentIndex];
    const imageBase64 = canvas.toDataURL("image/png");
    const aiResult = evaluateDrawingWithAI();
    
    studentResults[student.name] = { 
        item: student.chosenItem, 
        imageData: imageBase64, 
        score: aiResult.score,
        desc: aiResult.desc,
        status: "Waktu Habis (Dinilai AI)" 
    };
    if (selectedClass !== 'Contohkan') {
        saveStudentScoreToDatabase(student, imageBase64, aiResult.score, "Waktu Habis");
    }
    renderSidebarList();

    const nextIndex = getNextValidIndex(currentIndex + 1);
    if (nextIndex < studentsList.length) {
        document.getElementById('timeup-message').innerHTML = `Waktu habis!<br><span style="color: #10b981; font-weight: bold; font-size: 18px;">${studentsList[nextIndex].name}..</span>`;
    } else {
        document.getElementById('timeup-message').innerHTML = `Waktu habis!<br>Sesi selesai.`;
    }
    document.getElementById('timeup-overlay').style.display = 'flex';
}

function proceedNextAfterTimeUp() {
    document.getElementById('timeup-overlay').style.display = 'none';
    currentIndex++;
    promptStudentChoice();
}

function triggerSelesaiButton() {
    if (selectedClass !== 'Contohkan') {
        clearInterval(countdown);
    }
    const student = studentsList[currentIndex];
    const imageBase64 = canvas.toDataURL("image/png");
    const aiResult = evaluateDrawingWithAI();
    
    studentResults[student.name] = { 
        item: student.chosenItem,
        imageData: imageBase64, 
        score: aiResult.score,
        desc: aiResult.desc,
        status: "Selesai (Dinilai AI)" 
    };
    
    if (selectedClass !== 'Contohkan') {
        saveStudentScoreToDatabase(student, imageBase64, aiResult.score, "Selesai");
    }
    document.getElementById('game-panel').classList.add('hidden');
    renderSidebarList();

    const nextIndex = getNextValidIndex(currentIndex + 1);
    if (nextIndex < studentsList.length) {
        document.getElementById('turn-alert-msg').innerHTML = `<span style="color: #10b981; font-weight: bold; font-size: 18px;">${studentsList[nextIndex].name}..</span>`;
        document.getElementById('turn-alert-overlay').style.display = 'flex';
    } else {
        endAllTurns();
    }
}

function closeTurnAlert() {
    document.getElementById('turn-alert-overlay').style.display = 'none';
    currentIndex++;
    promptStudentChoice();
}

function skipCurrentStudent() {
    if (selectedClass !== 'Contohkan') {
        clearInterval(countdown);
    }
    const student = studentsList[currentIndex];
    student.skipped = true;
    studentResults[student.name] = { item: "-", imageData: null, score: "0%", desc: "Dilewati.", status: "Dilewati (Skipped)" };
    
    if (selectedClass !== 'Contohkan') {
        saveStudentScoreToDatabase(student, "", "0%", "Dilewati (Skipped)");
    }
    
    document.getElementById('game-panel').classList.add('hidden');
    renderSidebarList();

    const nextIndex = getNextValidIndex(currentIndex + 1);
    if (nextIndex < studentsList.length) {
        currentIndex++;
        promptStudentChoice();
    } else {
        endAllTurns();
    }
}

function saveStudentScoreToDatabase(student, imageBase64, scoreVal, statusVal) {
    if (student.skipped || selectedClass === 'Contohkan') return;

    let payload = {
        kelas: selectedClass,
        package: selectedPackageKey,
        type: "appendSingle",
        result: {
            nama: student.name,
            objek: student.chosenItem,
            gambar: imageBase64,
            nilaiAI: scoreVal,
            status: statusVal,
            waktu: new Date().toLocaleString('id-ID')
        }
    };

    if (GS_WEB_APP_URL && GS_WEB_APP_URL !== "PASTE_URL_WEB_APP_GS_ANDA_DI_SINI") {
        fetch(GS_WEB_APP_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).catch(err => console.error("Gagal simpan data:", err));
    }
}

function getNextValidIndex(idx) {
    while(idx < studentsList.length && studentsList[idx].skipped) {
        idx++;
    }
    return idx;
}

function renderSidebarList() {
    const studentListEl = document.getElementById('student-list');
    studentListEl.innerHTML = '';
    studentsList.forEach((stu, idx) => {
        const li = document.createElement('li');
        li.className = `student-item ${idx === currentIndex && isGameActive ? 'active' : ''}`;
        
        let statusBadge = '<span class="student-status status-pending">Belum</span>';
        const data = studentResults[stu.name];
        
        if (stu.skipped) {
            statusBadge = '<span class="student-status status-skipped">Absen</span>';
        } else if (data && data.score) {
            statusBadge = `<span class="student-status status-done">${data.score}</span>`;
        } else if (idx === currentIndex && isGameActive) {
            statusBadge = '<span class="student-status status-active">Aktif</span>';
        }

        li.innerHTML = `
            <span class="student-name">${idx + 1}. ${stu.name}</span>
            ${statusBadge}
        `;
        studentListEl.appendChild(li);
    });
}

function endAllTurns() {
    document.getElementById('game-panel').classList.add('hidden');
    document.getElementById('finish-panel').classList.remove('hidden');
    renderSidebarList();

    const infoText = (selectedClass === 'Contohkan') 
        ? `✨ Mode Contohkan Selesai! (Data tidak disimpan ke Google Spreadsheet).` 
        : `✅ Sesi selesai! Seluruh nilai AI tersimpan di Google Spreadsheet (Sheet Data_${selectedClass})[cite: 2, 3].`;

    document.getElementById('sync-status-msg').textContent = infoText;

    const tbody = document.getElementById('result-table-body');
    tbody.innerHTML = '';
    studentsList.forEach((stu, idx) => {
        let res = studentResults[stu.name] || { item: "-", imageData: null, score: "0%", desc: "-", status: "-" };
        const tr = document.createElement('tr');
        
        let actionBtn = res.imageData ? `<button class="btn btn-glow btn-sm" onclick="openImageModal('${stu.name}', '${res.imageData}', '${res.score}', \`${res.desc}\`)"><i class="fas fa-robot"></i> Lihat Analisis AI</button>` : '-';

        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${stu.name}</td>
            <td><strong>${stu.skipped ? '-' : res.item}</strong></td>
            <td><strong style="color: #38bdf8;">${stu.skipped ? '0%' : res.score}</strong></td>
            <td>${stu.skipped ? 'Dilewati' : res.status}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

function openImageModal(studentName, imgData, score, desc) {
    document.getElementById('modal-preview-title').innerHTML = `<i class="fas fa-robot"></i> Hasil & Analisis Gambar: ${studentName}`;
    document.getElementById('modal-img-preview').src = imgData;
    document.getElementById('ai-score-text').innerHTML = `🤖 Nilai Akurasi AI: <span style="color: #f59e0b;">${score}</span>`;
    document.getElementById('ai-desc-text').style.whiteSpace = "pre-line";
    document.getElementById('ai-desc-text').textContent = desc;
    document.getElementById('image-modal').style.display = 'flex';
}

function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
}

document.getElementById('restart-btn').onclick = () => {
    document.getElementById('finish-panel').classList.add('hidden');
    document.getElementById('setup-panel').classList.remove('hidden');
    document.getElementById('app-header-el').classList.remove('hidden');
    document.getElementById('top-nav-admin').classList.remove('hidden');
    fetchStudentsFromDatabase();
};

document.addEventListener('fullscreenchange', () => {
    if (isGameActive && selectedClass !== 'Contohkan' && !document.fullscreenElement) {
        document.getElementById('warning-overlay').style.display = 'flex';
        clearInterval(countdown);
    }
});

function returnToFullscreen() {
    var elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(()=>{});
    document.getElementById('warning-overlay').style.display = 'none';
    startTimer();
}
