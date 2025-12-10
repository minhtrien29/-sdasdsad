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