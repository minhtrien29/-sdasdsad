// Biến lưu tạm số tiền chờ thanh toán
let currentBillAmount = 0;
let currentBillNote = "";

// Key lưu trữ
const TABLE_STRUCTURE_KEY = 'tableStructureConfig';
const BOOKING_KEY = 'billiardBookings';
const ORDER_KEY = 'billiardOrders'; 

document.addEventListener('DOMContentLoaded', () => {
    restoreTableStructure();
    setupGlobalEvents();
    setupTabEvents();
    setupBookingEvents();
});

// ======================= 1. QUẢN LÝ CẤU TRÚC BÀN =======================
function saveTableStructure() {
    const structure = {
        LIBRE: getTableIds('libreContainer'),
        POOL: getTableIds('Container'),
        SNOOKER: getTableIds('snookerContainer')
    };
    localStorage.setItem(TABLE_STRUCTURE_KEY, JSON.stringify(structure));
}

function getTableIds(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('.table-box h3')).map(h3 => {
        return parseInt(h3.textContent.match(/\d+/)[0]);
    }).filter(n => !isNaN(n));
}

function restoreTableStructure() {
    const saved = localStorage.getItem(TABLE_STRUCTURE_KEY);
    if (!saved) {
        // Tạo mặc định
        const defaults = [
            { id: 'libreContainer', type: 'LIBRE', price: '50.000/h' },
            { id: 'Container', type: 'POOL', price: '60.000/h' },
            { id: 'snookerContainer', type: 'SNOOKER', price: '100.000/h' }
        ];
        defaults.forEach(d => {
            const container = document.getElementById(d.id);
            if(container) createTableElement(container, container.querySelector('.add-box'), d.type, d.price, 1);
        });
        return;
    }

    const structure = JSON.parse(saved);
    const restoreType = (containerId, type, price, ids) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        const addBtn = container.querySelector('.add-box');
        container.querySelectorAll('.table-box').forEach(el => el.remove());
        ids.forEach(id => createTableElement(container, addBtn, type, price, id));
    };

    restoreType('libreContainer', 'LIBRE', '50.000/h', structure.LIBRE || []);
    restoreType('Container', 'POOL', '60.000/h', structure.POOL || []);
    restoreType('snookerContainer', 'SNOOKER', '100.000/h', structure.SNOOKER || []);
}

function createTableElement(container, insertBeforeElement, type, price, index) {
    const newTable = document.createElement('div');
    newTable.className = "table-box trong";
    newTable.setAttribute('data-loai', type);
    newTable.setAttribute('data-gia', price);
    
    newTable.innerHTML = `
        <div class="table-header">
            <h3>Bàn ${index}</h3>
            <button type="button" class="btn-xoa">❌</button>
        </div>
        <p class="table-info">${price.replace('/h',' VNĐ / GIỜ')}</p>
        <button type="button" class="btn btn-mo">MỞ BÀN</button>
        <button type="button" class="btn btn-tinh" style="display:none">TÍNH TIỀN</button>
        <div class="timer">00:00:00</div>
    `;

    container.insertBefore(newTable, insertBeforeElement);
    initTable(newTable);
}

// ======================= 2. LOGIC BÀN (TIMER & TÍNH TIỀN) =======================
function initTable(table) {
    const btnOpen = table.querySelector('.btn-mo');
    const btnCalc = table.querySelector('.btn-tinh');
    const btnDelete = table.querySelector('.btn-xoa');
    const timer = table.querySelector('.timer');

    const loaiBan = table.getAttribute('data-loai');
    const giaBan = table.getAttribute('data-gia');
    const nameHeader = table.querySelector('h3').textContent; 
    const tableNum = parseInt(nameHeader.match(/\d+/)[0]);
    const tableKey = `${loaiBan}_${tableNum}`;

    let startTime = null;
    let interval = null;
    let startDate = null;

    const updateTimerDisplay = (startTs) => {
        const elapsed = Date.now() - startTs;
        const h = Math.floor(elapsed / 3600000);
        const m = Math.floor((elapsed % 3600000) / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        timer.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };

    const startTimerLoop = (startTs) => {
        if (interval) clearInterval(interval);
        updateTimerDisplay(startTs); 
        btnOpen.style.display = 'none';
        btnCalc.style.display = 'inline-block';
        interval = setInterval(() => { updateTimerDisplay(startTs); }, 1000);
    };

    const savedState = getTableState(tableKey);
    if (savedState) {
        startTime = savedState.startTime;
        startDate = new Date(savedState.startDate);
        table.classList.remove('trong', 'datcho');
        table.classList.add('dangchoi');
        startTimerLoop(startTime);
    } else {
        btnOpen.style.display = 'inline-block';
        btnCalc.style.display = 'none';
        timer.textContent = "00:00:00";
    }

    // --- MỞ BÀN (Đã sửa: KHÔNG xóa món ăn) ---
    btnOpen.addEventListener('click', () => {
        if (getTableState(tableKey)) return;

        // Lưu ý: Chúng ta không xóa order ở đây nữa, 
        // để hỗ trợ trường hợp khách vào ngồi gọi món trước rồi mới mở giờ.
        
        startDate = new Date();
        startTime = Date.now();
        saveTableState(tableKey, startTime, startDate);
        
        table.classList.remove('trong', 'datcho');
        table.classList.add('dangchoi');
        startTimerLoop(startTime);
    });

    // --- TÍNH TIỀN ---
    btnCalc.addEventListener('click', () => {
        if (!startTime) return;
        if (!confirm(`Bạn có muốn kết thúc và tính tiền cho ${nameHeader}?`)) return;

        clearInterval(interval);
        interval = null;
        
        const finalTimeStr = timer.textContent.trim();
        const endDate = new Date();

        // Reset trạng thái bàn
        table.classList.remove('dangchoi');
        table.classList.add('trong');
        timer.textContent = "00:00:00";
        btnOpen.style.display = 'inline-block';
        btnCalc.style.display = 'none';

        clearTableState(tableKey);
        
        // Tính tiền giờ
        const [h, m, s] = finalTimeStr.split(':').map(Number);
        const totalHours = h + (m / 60) + (s / 3600);
        const pricePerHour = (loaiBan === 'LIBRE') ? 50000 : (loaiBan === 'POOL' ? 60000 : 100000);
        
        let billTimeAmount = 0;
        const rawBill = totalHours * pricePerHour;
        if (rawBill > 0) billTimeAmount = Math.ceil(rawBill / 1000) * 1000;

        // Tính tiền món ăn
        const storedOrders = JSON.parse(localStorage.getItem(ORDER_KEY)) || {};
        const tableOrders = storedOrders[tableKey] || [];
        let serviceTotal = 0;
        
        // Render Hóa Đơn
        const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
        
        const headerEl = document.querySelector('#billContainer h3');
        if(headerEl) headerEl.textContent = `Hóa đơn ${nameHeader}`;
        
        setText('billLoai', loaiBan);
        setText('billGia', giaBan);
        setText('billStart', startDate ? startDate.toTimeString().substring(0, 5) : '--:--');
        setText('billEnd', endDate.toTimeString().substring(0, 5));
        setText('billTotalTime', finalTimeStr);

        const billListEl = document.getElementById('billListItems');
        if (billListEl) {
            billListEl.innerHTML = ''; 
            if (tableOrders.length > 0) {
                tableOrders.forEach(item => {
                    serviceTotal += item.totalPrice;
                    const p = document.createElement('p');
                    p.style.display = 'flex';
                    p.style.justifyContent = 'space-between';
                    p.innerHTML = `<span>+ ${item.name} (x${item.quantity})</span> <span>${item.totalPrice.toLocaleString()} đ</span>`;
                    billListEl.appendChild(p);
                });
            } else {
                billListEl.innerHTML = '<div style="text-align:center; color:#888;">(Không gọi món)</div>';
            }
        }
        setText('billServiceTotal', serviceTotal.toLocaleString('vi-VN'));

        const finalTotal = billTimeAmount + serviceTotal;
        setText('billTotal', `${finalTotal.toLocaleString('vi-VN')} VNĐ`);

        currentBillAmount = finalTotal;
        currentBillNote = `Doanh thu từ ${loaiBan} - ${nameHeader}`;
        
        const billContainer = document.getElementById("billContainer");
        if(billContainer) billContainer.style.display = "block";

        // Xóa dữ liệu tạm thời gian & XÓA MÓN ĂN SAU KHI ĐÃ LÊN HÓA ĐƠN
        startTime = null;
        startDate = null;
        if (storedOrders[tableKey]) {
            delete storedOrders[tableKey];
            localStorage.setItem(ORDER_KEY, JSON.stringify(storedOrders));
        }
    });

    btnDelete.addEventListener('click', () => {
        if (confirm(`Bạn có chắc muốn xóa ${nameHeader} vĩnh viễn?`)) {
            clearTableState(tableKey);
            table.remove();
            saveTableStructure();
        }
    });
}

// ======================= 3. SỰ KIỆN TOÀN CỤC =======================
function setupGlobalEvents() {
    document.querySelectorAll('.add-box').forEach(addBtn => {
        addBtn.addEventListener('click', () => {
            const container = addBtn.parentElement;
            let type = 'POOL';
            let price = '60.000/h';
            
            if (container.id === 'libreContainer') { type = 'LIBRE'; price = '50.000/h'; } 
            else if (container.id === 'snookerContainer') { type = 'SNOOKER'; price = '100.000/h'; }

            const existingIds = Array.from(container.querySelectorAll('.table-box h3')).map(h3 => 
                parseInt(h3.textContent.match(/\d+/)[0])
            ).filter(n => !isNaN(n));
            
            const newIndex = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
            createTableElement(container, addBtn, type, price, newIndex);
            saveTableStructure();
        });
    });

    // Sự kiện thanh toán
    const btnPay = document.getElementById('btn-payment-confirm');
    if(btnPay) {
        btnPay.addEventListener('click', () => {
            if (currentBillAmount <= 0) {
                alert("Số tiền bằng 0 hoặc lỗi hóa đơn!");
                return;
            }
            if(confirm(`Xác nhận thu ${currentBillAmount.toLocaleString('vi-VN')} VNĐ vào doanh thu?`)) {
                let list = JSON.parse(localStorage.getItem('danhSachHoaDon')) || [];
                const newBill = {
                    id: Date.now(),
                    ngayTao: new Date().toISOString(),
                    tongTien: currentBillAmount,
                    ghiChu: currentBillNote
                };
                list.push(newBill);
                localStorage.setItem('danhSachHoaDon', JSON.stringify(list));
                
                alert("✅ Thanh toán thành công!");
                currentBillAmount = 0;
                document.getElementById("billContainer").style.display = "none";
            }
        });
    }
}

// ======================= 4. TAB & BOOKING =======================
function setupTabEvents() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tab.getAttribute('data-target'));
        });
    });
}

function switchTab(targetId) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(t => {
        if(t.getAttribute('data-target') === targetId) t.classList.add('active');
        else t.classList.remove('active');
    });

    tabContents.forEach(c => {
        if(c.id === targetId) c.classList.add('active');
        else c.classList.remove('active');
    });

    if (targetId === 'booking-schedule') {
        renderBookings();
    }
}

function setupBookingEvents() {
    const modal = document.getElementById('bookingModal');
    if(!modal) return;
    const closeBtn = document.querySelector('.close-button');
    const saveBtn = document.getElementById('saveBookingBtn');
    
    // Xử lý khi đổi Loại bàn -> Cập nhật danh sách số bàn
    const typeSelect = document.getElementById('modal-table-type');
    const tableSelect = document.getElementById('modal-table-id');
    
    const updateTableOptions = () => {
        const type = typeSelect.value;
        tableSelect.innerHTML = '<option value="">-- Chọn bàn bất kỳ --</option>';
        
        let containerId = '';
        if (type === 'Libre') containerId = 'libreContainer';
        else if (type === 'Pool') containerId = 'Container';
        else if (type === 'Snooker') containerId = 'snookerContainer';
        
        const container = document.getElementById(containerId);
        if(container) {
            container.querySelectorAll('.table-box h3').forEach(h3 => {
                const num = h3.textContent.match(/\d+/)[0];
                const opt = document.createElement('option');
                opt.value = num;
                opt.textContent = `Bàn ${num}`;
                tableSelect.appendChild(opt);
            });
        }
    };

    if(typeSelect) typeSelect.addEventListener('change', updateTableOptions);
    
    // Nút mở modal
    const addNewBtn = document.querySelector('.add-new-booking'); // Sẽ được JS tạo ra sau
    
    const hideModal = () => {
        modal.classList.add('hidden');
        document.getElementById('modal-name').value = '';
        document.getElementById('modal-phone').value = '';
        document.getElementById('modal-time').value = '';
        document.getElementById('modal-note').value = '';
        document.getElementById('modal-table-id').value = '';
    };

    if(closeBtn) closeBtn.addEventListener('click', hideModal);
    window.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

    if(saveBtn) {
        saveBtn.addEventListener('click', () => {
            const name = document.getElementById('modal-name').value;
            const phone = document.getElementById('modal-phone').value;
            const time = document.getElementById('modal-time').value;
            const type = document.getElementById('modal-table-type').value;
            const tableId = document.getElementById('modal-table-id').value; // Lấy số bàn
            const note = document.getElementById('modal-note').value;

            if(!name || !time) {
                alert('Vui lòng nhập tên và giờ đặt!');
                return;
            }

            const newBooking = {
                id: Date.now(),
                name, phone, time, type, tableId, note // Lưu thêm tableId
            };

            const bookings = JSON.parse(localStorage.getItem(BOOKING_KEY)) || [];
            bookings.push(newBooking);
            bookings.sort((a,b) => a.time.localeCompare(b.time)); 
            localStorage.setItem(BOOKING_KEY, JSON.stringify(bookings));

            hideModal();
            renderBookings(); 
        });
    }

    // Expose updateTableOptions to global so we can call it when opening modal
    window.updateTableOptionsGlobal = updateTableOptions;
}

function renderBookings() {
    const container = document.querySelector('.booking-list');
    if(!container) return;
    const bookings = JSON.parse(localStorage.getItem(BOOKING_KEY)) || [];

    container.innerHTML = '';

    const addBtn = document.createElement('div');
    addBtn.className = 'booking-item add-new-booking';
    addBtn.innerHTML = '<span>+ Thêm lịch đặt mới</span>';
    addBtn.addEventListener('click', () => {
        const modal = document.getElementById('bookingModal');
        if(modal) {
            modal.classList.remove('hidden');
            if(window.updateTableOptionsGlobal) window.updateTableOptionsGlobal(); // Load danh sách bàn ngay khi mở
        }
    });
    container.appendChild(addBtn);

    bookings.forEach(bk => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        
        // Hiển thị số bàn cụ thể nếu có
        const tableDisplay = bk.tableId ? `Bàn ${bk.tableId}` : 'Bất kỳ';
        
        item.innerHTML = `
            <button type="button" class="btn-del-booking" onclick="deleteBooking(${bk.id})">×</button>
            <div class="booking-header">
                <span class="booking-table-name">${bk.name} - ${bk.time}</span>
                <span class="booking-status">${bk.type}</span>
            </div>
            <p><strong>Bàn:</strong> ${tableDisplay}</p>
            <p><strong>SĐT:</strong> ${bk.phone}</p>
            ${bk.note ? `<div class="booking-note"><p class="note-title">Lưu ý:</p><span class="note-content">${bk.note}</span></div>` : ''}
            
            <button onclick="receiveBooking(${bk.id})" class="btn-receive-booking">▶ Nhận bàn ${bk.tableId || 'Trống'}</button>
        `;
        container.appendChild(item);
    });
}

// --- LOGIC NHẬN BÀN CỤ THỂ ---
window.receiveBooking = function(id) {
    const bookings = JSON.parse(localStorage.getItem(BOOKING_KEY)) || [];
    const booking = bookings.find(b => b.id === id);
    if(!booking) return;

    if(!confirm(`Mở bàn cho khách ${booking.name}?`)) return;

    // 1. Chuyển Tab
    switchTab('table-list');

    // 2. Xác định container
    let containerId = '';
    if (booking.type === 'Libre') containerId = 'libreContainer';
    else if (booking.type === 'Pool') containerId = 'Container';
    else if (booking.type === 'Snooker') containerId = 'snookerContainer';

    const container = document.getElementById(containerId);
    if(container) {
        let targetTable = null;

        if (booking.tableId) {
            // A. Nếu đã chọn bàn cụ thể -> Tìm đúng bàn đó
            const allHeaders = container.querySelectorAll('.table-box h3');
            for(let h3 of allHeaders) {
                if (h3.textContent.includes(`Bàn ${booking.tableId}`)) {
                    targetTable = h3.parentElement.parentElement;
                    break;
                }
            }
            
            if (!targetTable) {
                alert(`Không tìm thấy Bàn ${booking.tableId}! Có thể đã bị xóa.`);
                return;
            }
            // Kiểm tra xem có trống không
            if (!targetTable.classList.contains('trong')) {
                alert(`Bàn ${booking.tableId} đang có khách chơi! Vui lòng chọn bàn khác hoặc chờ.`);
                targetTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

        } else {
            // B. Nếu chọn "Bất kỳ" -> Tìm bàn trống đầu tiên
            targetTable = container.querySelector('.table-box.trong');
            if(!targetTable) {
                alert(`Hết bàn trống loại ${booking.type}!`);
                return;
            }
        }

        // Mở bàn
        targetTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetTable.style.transition = '0.5s';
        targetTable.style.transform = 'scale(1.05)';
        setTimeout(() => targetTable.style.transform = 'scale(1)', 500);

        const btnMo = targetTable.querySelector('.btn-mo');
        if(btnMo) btnMo.click();

        deleteBooking(id, false); 
    }
}

window.deleteBooking = function(id, ask = true) {
    if(ask && !confirm('Xóa lịch đặt này?')) return;
    
    let bookings = JSON.parse(localStorage.getItem(BOOKING_KEY)) || [];
    bookings = bookings.filter(b => b.id !== id);
    localStorage.setItem(BOOKING_KEY, JSON.stringify(bookings));
    renderBookings();
}

// Helper Functions
function getTableState(tableKey) {
    const data = localStorage.getItem('tableState');
    return data ? JSON.parse(data)[tableKey] : null;
}
function saveTableState(tableKey, startTime, startDate) {
    const data = localStorage.getItem('tableState');
    const state = data ? JSON.parse(data) : {};
    state[tableKey] = { startTime, startDate };
    localStorage.setItem('tableState', JSON.stringify(state));
}
function clearTableState(tableKey) {
    const data = localStorage.getItem('tableState');
    if (data) {
        const state = JSON.parse(data);
        delete state[tableKey];
        localStorage.setItem('tableState', JSON.stringify(state));
    }
}