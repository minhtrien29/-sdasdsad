const ids = [
    "sang2", "sang3", "sang4", "sang5", "sang6", "sang7", "sangCN",
    "chieu2", "chieu3", "chieu4", "chieu5", "chieu6", "chieu7", "chieuCN",
    "toi2", "toi3", "toi4", "toi5", "toi6", "toi7", "toiCN",
];

// Cấu trúc dsNV đã thay đổi: lưu đối tượng { ten, sdt }
let dsNV = JSON.parse(localStorage.getItem("dsNV")) || {
    ql: [], // Quản lý: [{ ten: "...", sdt: "..." }]
    pv: [], // Phục vụ: [{ ten: "...", sdt: "..." }]
    tn: [], // Thu ngân: [{ ten: "...", sdt: "..." }]
};
let lichNV = JSON.parse(localStorage.getItem("lichNV")) || {};
let Xoa = false;
let nhanVienHienTai = "";

const nhomToChucVu = {
    ql: "Quản Lý",
    pv: "Phục Vụ",
    tn: "Thu Ngân"
};

/* =======================================================
    1. CÁC HÀM XỬ LÝ LỊCH VÀ NHÂN VIÊN
========================================================= */

function taoCheckbox(id, giaTri = "Không") {
    const td = document.getElementById(id);
    if (!td) return;
    
    const isChecked = giaTri === "Có" ? "checked" : "";
    // Đảm bảo td không bị ghi đè, chỉ chèn checkbox
    td.innerHTML = `<input type="checkbox" id="check-${id}" ${isChecked}>`; 
    td.classList.remove("checked");
    td.style.fontSize = "14px";
    td.style.fontWeight = "normal";

    const checkboxElement = document.getElementById(`check-${id}`);
    if (checkboxElement) {
        checkboxElement.onchange = () => capNhatNhanh(id);
    }
}

// Hàm hiển thị danh sách nhân viên theo nhóm khi click vào tiêu đề
function hienThi(id) {
    const list = document.getElementById(id);
    const searchInput = document.getElementById("search");
    
    // Nếu đang tìm kiếm, không thay đổi trạng thái ẩn/hiện
    if (searchInput && searchInput.value.trim() !== "") {
        return;
    }

    // Chuyển đổi trạng thái ẩn/hiện
    if (list) {
        list.style.display = 
            list.style.display === "none" || list.style.display === ""
            ? "block"
            : "none";
    }
}

function capNhatNhanh(id) {
    if (!nhanVienHienTai) return alert("⚠ Hãy chọn nhân viên trước!");
    const checkbox = document.getElementById(`check-${id}`);
    const giaTriMoi = checkbox.checked ? "Có" : "Không";
    
    // Đảm bảo lịch NV tồn tại
    if (!lichNV[nhanVienHienTai]) {
        lichNV[nhanVienHienTai] = {};
        ids.forEach((i) => (lichNV[nhanVienHienTai][i] = "Không"));
    }

    lichNV[nhanVienHienTai][id] = giaTriMoi;
    localStorage.setItem("lichNV", JSON.stringify(lichNV));

    const cell = document.getElementById(id);
    if (cell) {
        cell.style.transition = "none";
        // Đổi màu nhanh để phản hồi (Xanh cho Có, Đỏ cho Không)
        cell.style.backgroundColor = giaTriMoi === "Có" ? "#2ecc71" : "#e74c3c"; 
        setTimeout(() => {
            cell.style.transition = "background-color 0.2s";
            cell.style.backgroundColor = "transparent"; // Hoặc màu nền mặc định của bảng
        }, 100);
    }
}

function capNhat() {
    localStorage.setItem("lichNV", JSON.stringify(lichNV));
    alert("💾 Đã lưu lịch cho " + nhanVienHienTai + ".");
}

function resetLuaChon() {
    if (!nhanVienHienTai) return;
    
    if (!lichNV[nhanVienHienTai]) {
        lichNV[nhanVienHienTai] = {};
        ids.forEach((id) => (lichNV[nhanVienHienTai][id] = "Không"));
        localStorage.setItem("lichNV", JSON.stringify(lichNV));
    }
    
    // Tải lại các checkbox dựa trên dữ liệu hiện có
    ids.forEach((id) => {
        const val = lichNV[nhanVienHienTai][id] || "Không";
        taoCheckbox(id, val);
    });
    alert("🔁 Đã tải lại lịch làm việc hiện tại từ Local Storage.");
}

function chonNhanVien(ten) {
    nhanVienHienTai = ten;
    const tenNVElement = document.getElementById("tenNV");
    if (tenNVElement) {
        tenNVElement.innerText = "Lịch làm của: " + ten;
    }
    const ngayElement = document.getElementById("ngay");
    if (ngayElement) {
        ngayElement.innerText =
            "Tháng: " + (new Date().getMonth() + 1) + "/" + new Date().getFullYear();
    }

    if (!lichNV[ten]) {
        lichNV[ten] = {};
        ids.forEach((id) => (lichNV[ten][id] = "Không"));
    }
    resetLuaChon();
}

// Hàm nhận đối tượng nhân viên (nv) thay vì chỉ tên
function createListItem(nv, nhom) { 
    const li = document.createElement("li");
    li.textContent = nv.ten;
    li.onclick = () => {
        if (Xoa) {
            if (confirm("Xóa nhân viên '" + nv.ten + "'?")) {
                // Lọc bỏ đối tượng có tên tương ứng
                dsNV[nhom] = dsNV[nhom].filter((item) => item.ten !== nv.ten);
                delete lichNV[nv.ten];
                localStorage.setItem("dsNV", JSON.stringify(dsNV));
                localStorage.setItem("lichNV", JSON.stringify(lichNV));
                
                hienThiDanhSach();
                hienThiDanhSachTongHop(); // Cập nhật danh sách tổng hợp
                
                if (nhanVienHienTai === nv.ten) {
                    nhanVienHienTai = "";
                    document.getElementById("tenNV").innerText = "Chưa chọn nhân viên";
                    // Xóa nội dung lịch
                    ids.forEach((id) => {
                        const cell = document.getElementById(id);
                        if(cell) cell.innerHTML = "";
                    });
                }
            }
        } else {
            chonNhanVien(nv.ten);
        }
    };
    return li;
}

// --- KHU VỰC XỬ LÝ MODAL (THÊM MỚI VÀO) ---

// 1. Hàm mở Modal (thay thế logic prompt cũ)
function themNhanVien() {
    document.getElementById('modalThemNV').style.display = 'flex';
    // Reset form cho trống mỗi khi mở
    document.getElementById('inpTen').value = '';
    document.getElementById('inpSDT').value = '';
    document.getElementById('inpChucVu').value = 'ql';
}

// 2. Hàm đóng Modal
function dongModal() {
    document.getElementById('modalThemNV').style.display = 'none';
}

// 3. Hàm xử lý khi bấm nút "Xác Nhận Thêm"
function xuLyThem() {
    const nhom = document.getElementById('inpChucVu').value; // Lấy chức vụ (ql/pv/tn)
    const ten = document.getElementById('inpTen').value.trim();
    const sdt = document.getElementById('inpSDT').value.trim();

    // Validate dữ liệu
    if (!ten) {
        alert("❌ Tên nhân viên không được để trống.");
        return;
    }

    // Kiểm tra trùng tên trong nhóm đó
    if (dsNV[nhom].some(nv => nv.ten === ten)) {
        alert("❌ Nhân viên này đã tồn tại trong nhóm này.");
        return;
    }

    // Tạo đối tượng nhân viên mới
    const newEmployee = {
        ten: ten,
        sdt: sdt || "Đang cập nhật"
    };

    // Thêm vào mảng dữ liệu
    dsNV[nhom].push(newEmployee);

    // Khởi tạo lịch làm việc rỗng cho nhân viên mới
    lichNV[ten] = {};
    ids.forEach((id) => (lichNV[ten][id] = "Không"));

    // Lưu vào LocalStorage
    localStorage.setItem("dsNV", JSON.stringify(dsNV));
    localStorage.setItem("lichNV", JSON.stringify(lichNV));

    // Cập nhật lại giao diện
    hienThiDanhSach();
    hienThiDanhSachTongHop();

    // Thông báo và đóng modal
    alert("✅ Thêm nhân viên thành công.");
    dongModal();
}

function xoaNhanVien() {
    Xoa = !Xoa;
    const xoaBtn = document.getElementById("xoaNV");
    xoaBtn.textContent = Xoa ? "Click tên để xóa" : " Xóa";
    const leftPanel = document.querySelector(".left"); // Đã thay đổi từ .left sang .capnhat-nhanvien .left
    if (leftPanel) {
        if (Xoa) {
            leftPanel.classList.add("deleting");
        } else {
            leftPanel.classList.remove("deleting");
        }
    }
    alert(Xoa ? "Chế độ XÓA đã bật. Click vào tên nhân viên để xóa." : "Chế độ XÓA đã TẮT.");
}

// Cập nhật: Lặp qua đối tượng nhân viên
function hienThiDanhSach() {
    for (let nhom in dsNV) {
        const ul = document.getElementById(nhom);
        if (ul) {
            ul.innerHTML = "";
            dsNV[nhom].forEach((nv) => { 
                const li = createListItem(nv, nhom); 
                ul.appendChild(li);
            });
        }
    }
}

/* =======================================================
    2. HÀM HIỂN THỊ DANH SÁCH TỔNG HỢP (table-body)
========================================================= */

function hienThiDanhSachTongHop() {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = ""; // Xóa sạch nội dung cũ
    
    let stt = 1;
    
    for (let nhom in dsNV) {
        const chucVu = nhomToChucVu[nhom];
        
        dsNV[nhom].forEach((nv) => { 
            const row = document.createElement('tr');
            
            // STT
            const sttCell = document.createElement('td');
            sttCell.textContent = stt++;
            row.appendChild(sttCell);

            // Tên Nhân Viên
            const nameCell = document.createElement('td');
            nameCell.textContent = nv.ten; 
            row.appendChild(nameCell);
            
            // Chức Vụ
            const positionCell = document.createElement('td');
            positionCell.textContent = chucVu;
            row.appendChild(positionCell);
            
            // Số Điện Thoại
            const phoneCell = document.createElement('td');
            phoneCell.textContent = nv.sdt; 
            row.appendChild(phoneCell);
            
            tableBody.appendChild(row);
        });
    }
}


/* =======================================================
    3. KHỞI TẠO VÀ SỰ KIỆN
========================================================= */

// Sự kiện tìm kiếm (đã được tối ưu hóa cho cấu trúc HTML hiện tại)
const searchInput = document.getElementById("search");
if (searchInput) {
    searchInput.addEventListener("input", function () {
        const keyword = this.value.toLowerCase().trim();
        for (let nhom in dsNV) {
            const ul = document.getElementById(nhom);
            // Lấy h3 (tiêu đề nhóm)
            const h3 = ul ? ul.previousElementSibling : null; 

            if (!ul || !h3) continue;
            
            const lis = ul.getElementsByTagName("li");
            let found = false;
            
            for (let li of lis) {
                if (li.textContent.toLowerCase().includes(keyword)) {
                    li.style.display = "list-item";
                    found = true;
                } else {
                    li.style.display = "none";
                }
            }
            
            if (keyword === "") {
                // Khi không tìm kiếm, ẩn danh sách (để người dùng click mở)
                ul.style.display = "none"; 
                h3.style.display = "block";
            } else {
                // Khi tìm kiếm, hiển thị danh sách và tiêu đề nếu có kết quả
                ul.style.display = found ? "block" : "none";
                h3.style.display = found ? "block" : "none";
            }
        }
    });
}


// --- Khởi tạo ứng dụng ---
hienThiDanhSach(); // Hiển thị danh sách ở panel trái
hienThiDanhSachTongHop(); // Hiển thị danh sách có SĐT ở bảng dưới

// Xóa nội dung mặc định của ô lịch khi khởi tạo
ids.forEach((id) => {
    const cell = document.getElementById(id);
    if(cell) cell.innerHTML = "";
});

// Cập nhật thông tin ngày tháng
const ngayElement = document.getElementById("ngay");
if (ngayElement) {
    ngayElement.innerText =
        "Tháng: " + (new Date().getMonth() + 1) + "/" + new Date().getFullYear();
}