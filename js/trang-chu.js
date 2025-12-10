document.addEventListener("DOMContentLoaded", () => {
    loadDashboardStats(); 
    loadTopItems();       
    loadTable("table-kho");
    loadTable("table-fastfood");
});

// ======================= PHẦN 1: DASHBOARD (GIỮ NGUYÊN) =======================
function loadDashboardStats() {
    const listBill = JSON.parse(localStorage.getItem('danhSachHoaDon')) || [];
    let todayRevenue = 0;
    const now = new Date();
    const todayStr = now.toDateString(); 
    listBill.forEach(bill => {
        if(bill.ngayTao) {
            const billDate = new Date(bill.ngayTao);
            if (billDate.toDateString() === todayStr) todayRevenue += parseInt(bill.tongTien);
        }
    });
    const elRevenue = document.getElementById('dashboard-revenue');
    if(elRevenue) elRevenue.innerText = todayRevenue.toLocaleString('vi-VN') + " VNĐ";

    const tableState = JSON.parse(localStorage.getItem('tableState')) || {};
    const elTables = document.getElementById('dashboard-active-tables');
    if(elTables) elTables.innerText = Object.keys(tableState).length + " Bàn";

    const countStaff = countStaffOnShift();
    const elStaff = document.getElementById('dashboard-active-staff');
    if(elStaff) elStaff.innerText = countStaff + " NV";
}

function countStaffOnShift() {
    const lichNV = JSON.parse(localStorage.getItem('lichNV')) || {};
    const now = new Date();
    const dayMap = ["CN", "2", "3", "4", "5", "6", "7"];
    const key = getShift(now.getHours()) + dayMap[now.getDay()];
    if (!getShift(now.getHours())) return 0;
    
    let count = 0;
    for (let ten in lichNV) { if (lichNV[ten][key] === "Có") count++; }
    return count;
}
function getShift(h) {
    if (h >= 6 && h < 12) return "sang";
    if (h >= 12 && h < 18) return "chieu";
    if (h >= 18 && h <= 23) return "toi";
    return "";
}

function loadTopItems() {
    const data = JSON.parse(localStorage.getItem("myMenuData")) || [];
    const topFood = document.getElementById("table-monan");
    const topDrink = document.getElementById("table-nuoc");
    
    if(topFood) while(topFood.rows.length > 1) topFood.deleteRow(1);
    if(topDrink) while(topDrink.rows.length > 1) topDrink.deleteRow(1);

    [...data].sort((a, b) => (b.sold || 0) - (a.sold || 0)).forEach(item => {
        if (!item.sold || item.sold <= 0) return; 
        const row = `<tr><td>${item.name}</td><td style="text-align:center;font-weight:bold;color:#d35400">${item.sold}</td></tr>`;
        if (item.category === "drink" && topDrink) topDrink.innerHTML += row;
        else if (topFood && item.category === "food") topFood.innerHTML += row;
    });
}

// ======================= PHẦN 2: KHO (LOGIC MỚI - DÙNG MODAL) =======================

// 1. Mở Modal
function openModal(tableId) {
    const modal = document.getElementById('inventoryModal');
    // Lưu ID bảng đang thao tác vào biến ẩn
    document.getElementById('targetTableId').value = tableId;
    
    // Reset form
    document.getElementById('inpName').value = '';
    document.getElementById('inpQty').value = '1';
    document.getElementById('inpUnit').value = '';
    
    modal.style.display = "block";
    document.getElementById('inpName').focus();
}

// 2. Đóng Modal
function closeModal() {
    document.getElementById('inventoryModal').style.display = "none";
}

// Click ra ngoài thì đóng
window.onclick = function(event) {
    const modal = document.getElementById('inventoryModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// 3. Lưu sản phẩm mới từ Modal
function saveNewItem() {
    const name = document.getElementById('inpName').value.trim();
    const qty = document.getElementById('inpQty').value;
    const unit = document.getElementById('inpUnit').value.trim();
    const tableId = document.getElementById('targetTableId').value;

    if (!name || !unit) {
        alert("Vui lòng nhập tên sản phẩm và đơn vị tính!");
        return;
    }

    const currentData = JSON.parse(localStorage.getItem(tableId)) || [];
    currentData.push({ name: name, qty: qty, unit: unit });
    localStorage.setItem(tableId, JSON.stringify(currentData));

    loadTable(tableId);
    closeModal();
}

// 4. Load bảng từ LocalStorage
function loadTable(tableId) {
    const data = JSON.parse(localStorage.getItem(tableId)) || [];
    const table = document.getElementById(tableId);
    if(!table) return; 

    let tbody = table.querySelector('tbody');
    if (!tbody) { tbody = document.createElement('tbody'); table.appendChild(tbody); }
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>${item.unit}</td>
            <td style="text-align:center;">
                <button class="btn-delete" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="deleteRow('${tableId}', this)">X</button>
            </td>
        `;
    });
}

// 5. Xóa dòng
function deleteRow(tableId, btn) {
    if(confirm("Bạn có chắc muốn xóa dòng này?")) {
        const row = btn.closest('tr');
        const rowIndex = row.rowIndex - 1; // Trừ đi header
        
        const currentData = JSON.parse(localStorage.getItem(tableId)) || [];
        // Xóa phần tử tại index tương ứng
        if (rowIndex >= 0 && rowIndex < currentData.length) {
            currentData.splice(rowIndex, 1);
            localStorage.setItem(tableId, JSON.stringify(currentData));
        }
        loadTable(tableId);
    }
}

// 6. Chức năng Cập Nhật (Inline Edit)
function toggleEdit(tableId, btn) {
    const table = document.getElementById(tableId);
    const isEditing = table.classList.toggle("editing");
    
    // Đổi nút bấm
    btn.textContent = isEditing ? "Lưu Lại" : "Cập Nhật";
    btn.style.background = isEditing ? "#e67e22" : "#3498db"; 

    if (isEditing) {
        makeEditable(table);
    } else {
        saveTable(tableId); // Lưu dữ liệu sau khi sửa
        removeEditable(table);
    }
}

// Chuyển text thành input
function makeEditable(table) {
    const tbody = table.querySelector('tbody');
    if(!tbody) return;
    for (let r of tbody.rows) {
        for (let i = 0; i < 3; i++) { // Chỉ sửa 3 cột đầu (Tên, SL, Đơn vị)
            let val = r.cells[i].innerText;
            if(!r.cells[i].querySelector('input')) {
                r.cells[i].innerHTML = `<input class="cell-edit" value="${val}">`;
            }
        }
    }
}

// Chuyển input thành text
function removeEditable(table) {
    const tbody = table.querySelector('tbody');
    if(!tbody) return;
    for (let r of tbody.rows) {
        for (let i = 0; i < 3; i++) {
            const inp = r.cells[i].querySelector("input");
            if (inp) r.cells[i].innerText = inp.value;
        }
    }
}

// Lưu bảng hiện tại vào LocalStorage
function saveTable(tableId) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    if(!tbody) return;

    const rows = [...tbody.rows].map(r => {
        const getVal = (idx) => {
            const inp = r.cells[idx].querySelector('input');
            return inp ? inp.value : r.cells[idx].innerText;
        };
        return { name: getVal(0), qty: getVal(1), unit: getVal(2) };
    });
    localStorage.setItem(tableId, JSON.stringify(rows));
}