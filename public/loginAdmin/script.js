const container = document.querySelector('.container');
const registrBtn = document.querySelector('.registr-btn');
const loginBtn = document.querySelector('.login-btn');
const btnR =  document.getElementById('btn-register');
const btnL =  document.getElementById('btn-login');

//login Admin
btnL.addEventListener('click', async function (e) {
    e.preventDefault();
    const socket = io('http://localhost:3000');
    const nameUser = document.getElementById('nameUser').value.trim();
    const pass = document.getElementById('pass').value.trim();
    console.log(nameUser);
    try {
        const response = await fetch("http://localhost:3000/api/Admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
            username: nameUser,  
            password: pass }) 
        });
        const data = await response.json();
        console.log(data.adminId)
        socket.emit("register", data.adminId);
       
        if (data.message === "the account exists") {
            window.location.href = "/Home/LoginAdmin/Dashboard"; 
        } else {
            alert("❌ Incorrect username or password!                                                    ❌ اسم المستخدم أو كلمة المرور غير صحيحة!");
        } 
    } catch (error) {
        console.error("Error fetching data:", error);
    }
});