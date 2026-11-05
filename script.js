const GS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzGD2akVdn5TdycTWbHvoNuLQBDWaPzIkJCY2wLgD4JvN5F47qpaOqVVyqSJWDnqtCcbA/exec";

let selectedClass = "6A";
let adminSelectedClass = "6A";
let studentsList = [];
let studentResults = {};
let takenObjects = [];
let currentIndex = 0;
let countdown;
let timeLeft = 180;
let isGameActive = false;
let adminInterval = null;

// Satu paket tunggal: Menggambar Pemandangan (berisi berbagai macam sub-tema pemandangan)
const pemandanganPackage = [
    "Pemandangan Gunung", "Pemandangan Pantai", "Pemandangan Sawah", "Pemandangan Air Terjun", 
    "Pemandangan Desa", "Pemandangan Taman Bunga", "Pemandangan Sungai", "Pemandangan Hutan", 
    "Pemandangan Senja / Sunset", "Pemandangan Malam Hari", "Pemandangan Danau", "Pemandangan Padang Rumput", 
    "Pemandangan Laut", "Pemandangan Lembah", "Pemandangan Bukit", "Pemandangan Jembatan", 
    "Pemandangan Rumah Kayu", "Pemandangan Air Mancur", "Pemandangan Kota", "Pemandangan Kebun Binatang", 
    "Pemandangan Kebun Buah", "Pemandangan Pelangi", "Pemandangan Pulau Kecil", "Pemandangan Gua", 
    "Pemandangan Gurun Pasir", "Pemandangan Kutub Es"
];

let canvas, ctx;
let isDrawing = false;
let currentTool = "brush"; 
let currentColor = "#000000";
let currentBrushSize = 5;
let undoStack = [];

const availablePalette = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
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

function initCanvas() {
    canvas = document.getElementById('drawing-canvas');
    ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 380;

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
    
    const selectEl = document.getElementById('package-item-select');
    selectEl.innerHTML = '';
    
    let availableItems = pemandanganPackage.filter(item => !takenObjects.includes(item.toLowerCase()));

    if (availableItems.length === 0) {
        let opt = document.createElement('option');
        opt.value = "";
        opt.textContent = "Semua sub-tema pemandangan sudah diambil!";
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
        alert("Semua sub-tema pemandangan sudah habis diambil!");
        return;
    }

    takenObjects.push(selectEl.trim().toLowerCase());
    studentsList[currentIndex].chosenItem = selectEl;

    document.getElementById('student-choice-modal').style.display = 'none';
    document.getElementById('game-panel').classList.remove('hidden');

    document.getElementById('current-player').textContent = studentsList[currentIndex].name;
    document.getElementById('target-soal-badge').textContent = `Tema: ${selectEl}`;

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

// =========================================================================
// SISTEM PENILAIAN AI TERBARU (PEMANDANGAN: WARNA, FULL KANVAS, MACAM GAMBAR)
// =========================================================================
function evaluateDrawingWithAI() {
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let totalPixels = width * height;
    let nonWhitePixels = 0;
    let uniqueColors = new Set();
    let quadrantFilled = [0, 0, 0, 0]; // 4 Kuadran kanvas untuk mendeteksi sebaran elemen pemandangan

    let midX = width / 2;
    let midY = height / 2;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let idx = (y * width + x) * 4;
            let r = data[idx];
            let g = data[idx + 1];
            let b = data[idx + 2];

            // Cek piksel bukan warna latar putih
            if (!(r > 245 && g > 245 && b > 245)) {
                nonWhitePixels++;
                
                // Merekam variasi warna RGB (dikelompokkan tiap step 32 untuk akurasi variasi nuansa warna)
                uniqueColors.add(`${Math.floor(r / 32)},${Math.floor(g / 32)},${Math.floor(b / 32)}`);

                // Deteksi sebaran area/quadrant gambar di kanvas
                if (x < midX && y < midY) quadrantFilled[0] = 1;      // Kiri Atas
                else if (x >= midX && y < midY) quadrantFilled[1] = 1; // Kanan Atas
                else if (x < midX && y >= midY) quadrantFilled[2] = 1; // Kiri Bawah
                else quadrantFilled[3] = 1;                            // Kanan Bawah
            }
        }
    }

    // 1. Coverage / Full pada Kanvas (0.0 hingga 1.0)
    let canvasCoverageRatio = nonWhitePixels / totalPixels;

    // 2. Variasi / Macam Warna (Jumlah warna unik di kanvas)
    let colorVarietyCount = uniqueColors.size;

    // 3. Sebaran Macam Elemen Pemandangan (Berdasarkan jumlah kuadran aktif yang terisi objek)
    let activeQuadrants = quadrantFilled.reduce((a, b) => a + b, 0);

    // --- FORMULA PENILAIAN AI BARU ---
    // Semakin banyak warna, semakin penuh kanvas, dan semakin kaya macam/sebaran gambar, nilai semakin tinggi.
    
    // Skor Full Kanvas (Maks 35 poin)
    let scoreCoverage = Math.min(35, canvasCoverageRatio * 140);

    // Skor Variasi Warna (Maks 35 poin)
    let scoreColorVariety = Math.min(35, colorVarietyCount * 3.5);

    // Skor Ragam Elemen / Macam Gambar Pemandangan (Maks 30 poin)
    let scoreElementRichness = (activeQuadrants / 4) * 30;

    let finalScore = Math.round(scoreCoverage + scoreColorVariety + scoreElementRichness);
    
    // Batas minimum jika gambar hampir kosong
    if (canvasCoverageRatio < 0.01) {
        finalScore = Math.max(5, finalScore);
    } else {
        finalScore = Math.max(25, Math.min(100, finalScore));
    }

    let keteranganWarna = colorVarietyCount > 8 ? "Sangat kaya variasi warna." : (colorVarietyCount > 4 ? "Variasi warna cukup baik." : "Variasi warna masih sedikit.");
    let keteranganFull = canvasCoverageRatio > 0.4 ? "Kanvas terisi dengan sangat penuh dan ekspresif." : (canvasCoverageRatio > 0.15 ? "Kanvas terisi dengan baik." : "Kanvas masih banyak area kosong.");
    let keteranganElemen = activeQuadrants >= 3 ? "Komposisi dan macam elemen pemandangan tersebar luas." : "Elemen pemandangan masih terpusat di satu bagian.";

    let detailedFeedback = `
Analisis AI Pemandangan:
- Tingkat Full Kanvas (Coverage): ${Math.round(canvasCoverageRatio * 100)}% (${keteranganFull})
- Variasi Macam Warna: ${colorVarietyCount} jenis warna (${keteranganWarna})
- Sebaran Macam Elemen Pemandangan: ${activeQuadrants}/4 Bagian Area (${keteranganElemen})

Rincian Skor Aspek:
1. Kepadatan / Full Kanvas: ${Math.round(scoreCoverage)} / 35
2. Variasi Warna: ${Math.round(scoreColorVariety)} / 35
3. Kekayaan Elemen Pemandangan: ${Math.round(scoreElementRichness)} / 30

Kelebihan:
- Karya pemandangan menunjukkan eksplorasi warna dan kelengkapan elemen gambar yang harmonis.

Saran Peningkatan:
- Untuk mendapatkan nilai maksimal, penuhi seluruh area kanvas dengan beragam warna cat dan tambahkan lebih banyak macam objek pemandangan (seperti pohon, awan, matahari, atau burung).
    `.trim();

    return { 
        score: `${finalScore}%`, 
        desc: detailedFeedback
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
        package: "pemandangan",
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
    document.getElementById('modal-preview-title').innerHTML = `<i class="fas fa-robot"></i> Hasil & Analisis AI: ${studentName}`;
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
