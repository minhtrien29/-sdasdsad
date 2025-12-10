const formLogin = document.getElementById('form-login');
// xử lí sự kiện submit form
formLogin.addEventListener('submit', function(event) {
    event.preventDefault(); // ngăn chặn hành vi mặc định của form
    // lấy giá trị từ các input
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value; 
    const userError = document.getElementById('userError');  
     // Lấy dữ liệu từ localStorage
    const userlocal = JSON.parse(localStorage.getItem('users')) || [];
    //tìm kiếm người dùng trong localStorage
    const foundUser = userlocal.find(user => user.email === emailInput && user.password === passwordInput);
    if (!foundUser) {
        userError.style.display = 'block';
    } else {
        window.location.href = '../trang-chu.html';
    }
    localStorage.setItem('currentUser', JSON.stringify(foundUser));

});