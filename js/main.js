const menuLinks = document.querySelectorAll('.main-menu li a');

    // 2. Lặp qua từng liên kết và thêm sự kiện lắng nghe nhấp chuột
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            // 3. Xóa lớp 'active' khỏi TẤT CẢ các liên kết trước
            menuLinks.forEach(item => {
                item.classList.remove('active');
            });
            
            // 4. Thêm lớp 'active' vào liên kết VỪA được nhấp
            this.classList.add('active');

            // Lưu ý: Nếu bạn muốn trang không bị tải lại khi nhấp vào, bạn có thể thêm:
            // event.preventDefault();
        });
    });

    // Tùy chọn: Đánh dấu mục hiện tại (ví dụ: Quản Lí Bàn) là active khi tải trang
    // Dựa trên URL hiện tại (nếu bạn dùng các liên kết .html)
    const currentPath = window.location.pathname.split('/').pop();
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
    document.getElementById("btnThongTin").addEventListener("click", function () {

    // Lấy dữ liệu từ localStorage
    let users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.length === 0) {
        alert("Chưa có người đăng ký nào!");
        return;
    }

    // Lấy người đăng ký mới nhất (cuối danh sách)
    let user = users[users.length - 1];

    let name = user.name || "Không có";
    let email = user.email || "Không có";

    alert(
        "Thông Tin Người Đăng Ký:\n\n" +
        "Họ và tên: " + name + "\n" +
        "Email: " + email
    );
});
