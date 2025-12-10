// lấy ra element của form đăng ký
const formRegister = document.getElementById('form-register');


// lắng nghe sự kiện submit của form đăng ký
    formRegister.addEventListener('submit', function(event) {
    event.preventDefault(); // ngăn chặn hành vi mặc định của form
    // lấy giá trị từ các input
    const nameInput = document.getElementById('name').value;
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;
    const repasswordInput = document.getElementById('repassword').value;
    
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const repasswordError = document.getElementById('repasswordError');
    // xử lí dữ liệu
    //lấy dữ liệu từ localStorage
    userlocal = JSON.parse(localStorage.getItem('users')) || [];
    /**
     * validate email
     * @param {*} email : string email cần kiểm tra
     * @returns : boolean true nếu đúng định dạng, false nếu sai định dạng
     * author: 30/10/2025
     */
    function validateEmail(email) {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    }
    
    
    //kiểm tra dữ liệu
    let isValid = true;
    // dữ liệu đăng ký
    if (!nameInput) {
        nameError.style.display = 'block';
        isValid = false;
    }else {
        nameError.style.display = 'none';
    }
    if (!emailInput) {
        emailError.style.display = 'block';
        isValid = false;
    } else if (validateEmail(emailInput) === false) {
        emailError.textContent = 'Email không đúng định dạng.';
        emailError.style.display = 'block';
        isValid = false;
    }
    else {
        emailError.style.display = 'none';
    }
    
    if (!passwordInput) {
        passwordError.style.display = 'block';
        isValid = false;
    }else {
        passwordError.style.display = 'none';
    }
    if (!repasswordInput) {
        repasswordError.textContent = 'Vui lòng nhập lại mật khẩu.';
        repasswordError.style.display = 'block';  
        isValid = false;  
    }
    else if (passwordInput !== repasswordInput) { 
        repasswordError.textContent = 'Mật khẩu nhập lại không khớp.'; // Thay đổi nội dung lỗi
        repasswordError.style.display = 'block';
        isValid = false;
    }
    else {
        repasswordError.style.display = 'none';
    }
    // nếu dữ liệu hợp lệ thì in ra console
    
    if (isValid) {
    // in ra console (hoặc bạn có thể gửi dữ liệu này lên server)
    console.log('Đăng ký với:', { name:nameInput, email:emailInput, password:passwordInput, repassword:repasswordInput });
    // bạn có thể thêm mã để gửi dữ liệu đến server tại đây
    // lưu dữ liệu vào localStorage
    userlocal.push({ name: nameInput, email: emailInput, password: passwordInput });
    localStorage.setItem('users', JSON.stringify(userlocal));
    setTimeout(function(){
    // chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
    window.location.href = 'login.html';
    },1000)};
});
