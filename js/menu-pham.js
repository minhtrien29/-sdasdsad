// --- KHỞI TẠO DỮ LIỆU ---
let menuData = JSON.parse(localStorage.getItem('myMenuData')) || [];
let currentTab = 'food'; 
let selectedItemForOrder = null;

// --- CHUYỂN TAB (Đồ ăn / Đồ uống) ---
function switchTab(tab) {
    currentTab = tab;
    
    // Cập nhật giao diện nút tab
    const btns = document.querySelectorAll('.tab-btn');
    if (btns.length > 0) { 
        if (tab === 'food') {
            btns[0].classList.add('active');
            if(btns[1]) btns[1].classList.remove('active');
        } else {
            if(btns[0]) btns[0].classList.remove('active');
            btns[1].classList.add('active');
        }
    }
    
    renderMenu();
}

// --- HIỂN THỊ DANH SÁCH MÓN ---
function renderMenu() {
    const container = document.getElementById('menuContainer');
    if(!container) return; 
    container.innerHTML = '';

    const itemsToShow = menuData.filter(item => item.category === currentTab);

    if (itemsToShow.length === 0) {
        container.innerHTML = '<div class="empty-msg">Danh sách đang trống. Vui lòng thêm món mới!</div>';
        return;
    }

    itemsToShow.forEach(item => {
        const imgSrc = (item.image && item.image.trim() !== "") ? item.image : 'https://via.placeholder.com/300x200?text=No+Image';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${imgSrc}" alt="${item.name}" class="card-img" onerror="this.src='https://via.placeholder.com/300x200?text=Error'">
            <div class="card-body">
                <div>
                    <div class="card-title">${item.name}</div>
                    <div class="card-price">${parseInt(item.price).toLocaleString()} VNĐ</div>
                    <small style="color:#777; font-size: 11px;">Đã bán: ${item.sold || 0}</small>
                </div>
                <div class="card-actions" style="display:flex; gap:5px; margin-top:5px;">
                      <button class="btn-order" onclick="openOrderModal('${item.id}', '${item.name}')" style="flex:1">Đặt Món</button>
                      <button class="btn-delete" onclick="deleteMenuItem('${item.id}')" style="background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer; padding:5px 10px;">Xóa</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- THÊM MÓN MỚI ---
function openAddModal() {
    document.getElementById('addModal').style.display = 'flex';
}

function addItem() {
    const name = document.getElementById('inputName').value;
    const price = document.getElementById('inputPrice').value;
    const image = document.getElementById('inputImage').value;
    const category = document.getElementById('inputCategory').value;

    if (!name || !price) {
        alert("Vui lòng nhập tên món và giá!");
        return;
    }

    const newItem = {
        id: Date.now().toString(),
        name: name,
        price: price,
        image: image,
        category: category,
        sold: 0 
    };

    menuData.push(newItem);
    localStorage.setItem('myMenuData', JSON.stringify(menuData));
    
    // Reset form
    document.getElementById('inputName').value = '';
    document.getElementById('inputPrice').value = '';
    document.getElementById('inputImage').value = '';
    
    closeModal('addModal');
    
    if(category !== currentTab) {
        switchTab(category);
    } else {
        renderMenu();
    }
    
    showToast(`Đã thêm mới món: ${name}`);
}

// --- XÓA MÓN ---
function deleteMenuItem(id) {
    if(confirm("Bạn có chắc muốn xóa món này khỏi thực đơn không?")) {
        menuData = menuData.filter(item => item.id !== id);
        localStorage.setItem('myMenuData', JSON.stringify(menuData));
        renderMenu();
        showToast("Đã xóa món ăn!");
    }
}

// --- ORDER (ĐẶT MÓN) ---
function openOrderModal(id, name) {
    selectedItemForOrder = menuData.find(i => i.id === id) || { id, name, price: 0 }; 
    document.getElementById('orderItemName').innerText = `Đang chọn: ${name}`;
    document.getElementById('orderModal').style.display = 'flex';
    document.getElementById('orderQuantity').value = '1';
    document.getElementById('orderQuantity').focus();
}

function confirmOrder() {
    const tableType = document.getElementById('orderTableType').value; 
    const tableNum = parseInt(document.getElementById('orderTable').value);
    const quantity = parseInt(document.getElementById('orderQuantity').value);

    // 1. Kiểm tra nhập liệu
    if (!tableNum || !quantity) {
        alert("Vui lòng nhập số bàn và số lượng!");
        return;
    }

    const tableKey = `${tableType}_${tableNum}`;

    // 2. [QUAN TRỌNG] Kiểm tra bàn đã mở chưa
    const tableState = JSON.parse(localStorage.getItem('tableState')) || {};
    
    // Nếu key không tồn tại trong tableState -> Bàn chưa bật giờ -> Chặn
    if (!tableState[tableKey]) {
        alert(`❌ Lỗi: Bàn ${tableNum} (${tableType}) CHƯA MỞ!\nVui lòng mở bàn ở Trang Chủ trước khi gọi món.`);
        return; 
    }

    // 3. Xử lý lưu đơn hàng
    const newItem = {
        name: selectedItemForOrder.name,
        price: parseInt(selectedItemForOrder.price),
        quantity: quantity,
        totalPrice: parseInt(selectedItemForOrder.price) * quantity
    };

    let currentOrders = JSON.parse(localStorage.getItem('billiardOrders')) || {};
    if (!currentOrders[tableKey]) {
        currentOrders[tableKey] = [];
    }
    currentOrders[tableKey].push(newItem);
    localStorage.setItem('billiardOrders', JSON.stringify(currentOrders));

    // 4. Cập nhật số lượng đã bán (Sold) để hiện ở Dashboard
    const itemIndex = menuData.findIndex(i => i.id === selectedItemForOrder.id);
    if(itemIndex > -1) {
        if(!menuData[itemIndex].sold) menuData[itemIndex].sold = 0;
        menuData[itemIndex].sold += quantity;
        localStorage.setItem('myMenuData', JSON.stringify(menuData));
    }

    const msg = `Đã thêm ${quantity} suất [${selectedItemForOrder.name}] vào Bàn ${tableNum}`;
    
    closeModal('orderModal');
    
    // Reset inputs
    document.getElementById('orderTable').value = ''; 
    document.getElementById('orderQuantity').value = '1'; 
    
    renderMenu();
    showToast(msg);
}

// --- TIỆN ÍCH ---
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if(!toast) return;
    const toastMsg = document.getElementById("toast-message");
    
    toastMsg.innerHTML = message; 
    toast.className = "show";
    
    setTimeout(function(){ 
        toast.className = toast.className.replace("show", ""); 
    }, 2500);
}

// --- [TÍNH NĂNG MỚI] LIÊN KẾT TỪ TRANG CHỦ ---
function checkAutoOrderFromHome() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderName = urlParams.get('autoOrder');

    if (orderName) {
        const foundItem = menuData.find(item => item.name.toLowerCase() === orderName.toLowerCase());
        if (foundItem) {
            if (foundItem.category !== currentTab) {
                switchTab(foundItem.category);
            }
            // Đợi 1 chút cho UI load xong rồi bật popup
            setTimeout(() => {
                openOrderModal(foundItem.id, foundItem.name);
                showToast(`Đã chọn nhanh: ${foundItem.name}`);
            }, 300);
            
            // Xóa tham số URL cho sạch đẹp
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// Chạy khởi tạo
renderMenu();
checkAutoOrderFromHome();