document.addEventListener('DOMContentLoaded', () => {
    // 1. Tính toán doanh thu
    tinhToanDoanhThu();

    // 2. Khởi tạo theo dõi bàn Real-time
    khoiTaoDanhSachBan();

    // 3. Khởi tạo quản lý Menu & Sự kiện Modal
    initializeMenuEditing();
});

// =============================================================
// PHẦN 1: TÍNH DOANH THU (GIỮ NGUYÊN)
// =============================================================
function tinhToanDoanhThu() {
    const danhSach = JSON.parse(localStorage.getItem('danhSachHoaDon')) || [];
    let tongNgay = 0, tongTuan = 0;
    const now = new Date();
    const todayStr = now.toDateString(); 
    const currentDay = now.getDay(); 
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1; 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0); 

    danhSach.forEach(bill => {
        const billDate = new Date(bill.ngayTao); 
        if (billDate.toDateString() === todayStr) tongNgay += parseInt(bill.tongTien) || 0;
        if (billDate >= startOfWeek) tongTuan += parseInt(bill.tongTien) || 0;
    });

    const elNgay = document.getElementById('doanh-thu-hom-nay');
    const elTuan = document.getElementById('doanh-thu-tuan');
    if (elNgay) elNgay.innerText = tongNgay.toLocaleString('vi-VN') + " VNĐ";
    if (elTuan) elTuan.innerText = tongTuan.toLocaleString('vi-VN') + " VNĐ";
}

// =============================================================
// PHẦN 2: REAL-TIME TRẠNG THÁI BÀN (GIỮ NGUYÊN)
// =============================================================
let intervals = {};
function khoiTaoDanhSachBan() {
    setupDropdown('pool', 'POOL', 20);
    setupDropdown('snooker', 'SNOOKER', 20);
    setupDropdown('libre', 'LIBRE', 20);
}

function setupDropdown(id, type, count) {
    const select = document.getElementById(`select-${id}`);
    if(!select) return;
    
    select.innerHTML = '<option value="">-- Chọn bàn --</option>';
    for(let i=1; i<=count; i++) {
        const val = `${type}_${i}`;
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = `Bàn ${i}`;
        select.appendChild(opt);
    }

    select.addEventListener('change', function() {
        const key = this.value;
        const dispId = `time-${id}`;
        
        if(intervals[id]) clearInterval(intervals[id]);
        
        updateTimeDisplay(key, dispId);
        
        if(key) {
            intervals[id] = setInterval(() => { updateTimeDisplay(key, dispId); }, 1000);
        }
    });
}

function updateTimeDisplay(key, elemId) {
    const el = document.getElementById(elemId);
    if(!key) {
        el.innerHTML = "Chọn bàn để xem...";
        el.className = "result-display-card";
        el.style.borderLeft = "1px solid #4a4a4a";
        return;
    }

    const state = JSON.parse(localStorage.getItem('tableState')) || {};
    const data = state[key];

    if(data && data.startTime) {
        const diff = Date.now() - data.startTime;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        
        el.innerHTML = `
            <div style="text-align:center">
                <strong style="color:#00c8ff">${key.replace('_',' ')}</strong><br>
                <span style="color:#ff4444;font-weight:bold;">🔴 ĐANG CHƠI</span>
                <div style="font-size:1.5em; font-family:monospace; margin-top:5px; color:white;">
                    ${pad(h)}:${pad(m)}:${pad(s)}
                </div>
            </div>`;
        el.className = "result-display-card status-occupied";
        el.style.borderLeft = "5px solid #ff4444";
    } else {
        el.innerHTML = `
            <div style="text-align:center">
                <strong>${key.replace('_',' ')}</strong><br>
                <span style="color:#00b34a;font-weight:bold;">🟢 BÀN TRỐNG</span>
            </div>`;
        el.className = "result-display-card status-available";
        el.style.borderLeft = "5px solid #00b34a";
    }
}
function pad(n){ return n.toString().padStart(2,'0'); }

// =============================================================
// PHẦN 3: QUẢN LÝ MENU VỚI POPUP (ĐÃ CHỈNH SỬA)
// =============================================================
const MENU_KEY = 'editableMenuStats';
const defaultMenu = { food: [], drink: [] };
let currentAddType = 'food'; // Biến theo dõi đang thêm Food hay Drink

function initializeMenuEditing() {
    // Load dữ liệu
    const data = JSON.parse(localStorage.getItem(MENU_KEY)) || defaultMenu;
    renderTable('food-tbody', data.food);
    renderTable('drink-tbody', data.drink);
    
    // Nút Lưu thay đổi (khi sửa trực tiếp trên bảng)
    const btnSave = document.getElementById('save-menu-data');
    if(btnSave) btnSave.onclick = () => { saveMenuFromTable(); alert("Đã lưu menu!"); };

    // --- SETUP MODAL EVENTS ---
    setupModalEvents();
}

function setupModalEvents() {
    const modal = document.getElementById('modal-add-menu');
    const btnClose = document.getElementById('btn-close-modal');
    const btnConfirm = document.getElementById('btn-confirm-add');
    const title = document.getElementById('modal-title');

    // Mở Popup THÊM ĐỒ ĂN
    const btnFood = document.getElementById('btn-open-add-food');
    if(btnFood) {
        btnFood.onclick = () => {
            currentAddType = 'food';
            title.innerText = "THÊM MÓN ĂN MỚI";
            title.style.color = "#00FCCE";
            openModal();
        }
    }

    // Mở Popup THÊM ĐỒ UỐNG
    const btnDrink = document.getElementById('btn-open-add-drink');
    if(btnDrink) {
        btnDrink.onclick = () => {
            currentAddType = 'drink';
            title.innerText = "THÊM ĐỒ UỐNG MỚI";
            title.style.color = "#00FCCE";
            openModal();
        }
    }

    // Hàm mở modal & Reset form
    function openModal() {
        modal.style.display = 'flex';
        document.getElementById('inp-menu-name').value = '';
        document.getElementById('inp-menu-qty').value = '1';
        document.getElementById('inp-menu-price').value = '';
        document.getElementById('inp-menu-name').focus();
    }

    // Đóng Modal
    function closeModal() { modal.style.display = 'none'; }
    btnClose.onclick = closeModal;
    window.onclick = (e) => { if(e.target == modal) closeModal(); };

    // XỬ LÝ KHI BẤM "XÁC NHẬN THÊM"
    btnConfirm.onclick = () => {
        const name = document.getElementById('inp-menu-name').value.trim();
        const qty = parseInt(document.getElementById('inp-menu-qty').value) || 0;
        const price = parseInt(document.getElementById('inp-menu-price').value) || 0;

        if(!name || price <= 0) {
            alert("Vui lòng nhập tên món và giá bán hợp lệ!");
            return;
        }

        // Lấy dữ liệu cũ
        const data = JSON.parse(localStorage.getItem(MENU_KEY)) || defaultMenu;
        
        // Thêm item mới vào mảng tương ứng
        const newItem = { n: name, q: qty, p: price };
        if(currentAddType === 'food') {
            data.food.push(newItem);
        } else {
            data.drink.push(newItem);
        }

        // Lưu và vẽ lại
        localStorage.setItem(MENU_KEY, JSON.stringify(data));
        initializeMenuEditing(); // Re-render table

        closeModal();
    };
}

// --- Các hàm hỗ trợ Render và Save từ bảng (Giữ nguyên logic cũ) ---

function renderTable(tbodyId, items) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = ''; 
    let grandTotal = 0;
    
    items.forEach((item, idx) => {
        const tr = tbody.insertRow();
        const total = item.q * item.p;
        grandTotal += total;
        
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td contenteditable="true">${item.n}</td>
            <td contenteditable="true" class="qty">${item.q}</td>
            <td contenteditable="true" class="price">${item.p.toLocaleString('vi-VN')}</td>
            <td contenteditable="true" class="total" style="font-weight:bold; color:#00c8ff;">${total.toLocaleString('vi-VN')}</td>
            <td><button class="delete-button">X</button></td>
        `;
        
        // Nút xóa
        tr.querySelector('.delete-button').onclick = () => { 
            tr.remove(); 
            saveMenuFromTable(); 
            updateGrandTotalDisplay(tbodyId); 
        };

        // Logic tính toán khi sửa trực tiếp
        tr.addEventListener('input', (e) => {
            const target = e.target;
            const qEl = tr.querySelector('.qty');
            const pEl = tr.querySelector('.price');
            const tEl = tr.querySelector('.total');
            
            let q = parseInt(qEl.innerText.replace(/\D/g,'')) || 0;
            
            if (target.classList.contains('total')) {
                let t = parseInt(tEl.innerText.replace(/\D/g,'')) || 0;
                if(q === 0) { q = 1; qEl.innerText = 1; }
                let newPrice = Math.round(t / q);
                pEl.innerText = newPrice.toLocaleString('vi-VN');
            } else {
                let p = parseInt(pEl.innerText.replace(/\D/g,'')) || 0;
                let newTotal = q * p;
                tEl.innerText = newTotal.toLocaleString('vi-VN');
            }
            updateGrandTotalDisplay(tbodyId);
        });
    });
    
    // Hàng Tổng Cộng
    const totalRow = tbody.insertRow();
    totalRow.className = "total-row";
    totalRow.innerHTML = `
        <td colspan="4">TỔNG CỘNG:</td>
        <td class="grand-total-cell">${grandTotal.toLocaleString('vi-VN')}</td>
        <td></td>
    `;
}

function updateGrandTotalDisplay(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const totalCells = tbody.querySelectorAll('tr:not(.total-row) .total');
    let sum = 0;
    totalCells.forEach(cell => { sum += parseInt(cell.innerText.replace(/\D/g,'')) || 0; });
    const grandCell = tbody.querySelector('.total-row .grand-total-cell');
    if(grandCell) grandCell.innerText = sum.toLocaleString('vi-VN');
}

function saveMenuFromTable() {
    const getData = (id) => {
        const tbody = document.getElementById(id);
        if(!tbody) return [];
        const rows = tbody.querySelectorAll('tr:not(.total-row)');
        return Array.from(rows).map(r => {
            const name = r.cells[1].innerText;
            const q = parseInt(r.cells[2].innerText.replace(/\D/g,'')) || 0;
            const p = parseInt(r.cells[3].innerText.replace(/\D/g,'')) || 0;
            return { n: name, q: q, p: p };
        });
    };
    const data = { food: getData('food-tbody'), drink: getData('drink-tbody') };
    localStorage.setItem(MENU_KEY, JSON.stringify(data));
}