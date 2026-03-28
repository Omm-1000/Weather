/* CHECK LOGIN STATUS */
if (
    window.location.pathname.includes("dashboard.html") ||
    window.location.pathname.includes("history.html")
) {
    if (localStorage.getItem("loggedIn") !== "true") {
        window.location = "index.html";
    }
}
const apiKey="c3073ddfdc8c3988b1d465a221a16dd4";

/* =====================
   SIGNUP
===================== */
function signup(){

    const user=document.getElementById("signupUser").value;
    const pass=document.getElementById("signupPass").value;

    localStorage.setItem("user",user);
    localStorage.setItem("pass",pass);

    alert("Signup Successful!");
    window.location="index.html";
}

/* =====================
   LOGIN
===================== */
function login(){

    const user=document.getElementById("loginUser").value;
    const pass=document.getElementById("loginPass").value;

    if(user===localStorage.getItem("user") &&
       pass===localStorage.getItem("pass")){

        localStorage.setItem("loggedIn","true");
        window.location="dashboard.html";
    }
    else{
        alert("Invalid Login");
    }
}

/* =====================
   LOGOUT
===================== */
function logout(){
    localStorage.removeItem("loggedIn");
    window.location="index.html";
}

/* =====================
   WEATHER API
===================== */
async function getWeather(){

    const city=document.getElementById("city").value;

    const url=
`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    const response=await fetch(url);
    const data=await response.json();

    if(data.cod!=="200"){
        alert("City not found");
        return;
    }

    showWeekly(data);
    storeHistory(city);
}

/* =====================
   WEEK DATA
===================== */
function showWeekly(data){

    const daily={};

    data.list.forEach(item=>{
        const date=new Date(item.dt_txt);
        const day=date.toLocaleDateString("en-US",{weekday:"long"});

        if(!daily[day] && date.getHours()===12){
            daily[day]=item;
        }
    });

    let output="";

    for(let day in daily){

        const info=daily[day];

        output+=`
        <div class="dayCard">
        <h3>${day}</h3>
        🌡 ${info.main.temp} °C<br>
        ☁ ${info.weather[0].description}
        </div>`;
    }

    document.getElementById("weekly").innerHTML=output;
}

/* =====================
   STORE HISTORY
===================== */
function storeHistory(city){

    let history=
    JSON.parse(localStorage.getItem("history")) || [];

    history.push({
        city:city,
        time:new Date().toLocaleString()
    });

    localStorage.setItem("history",JSON.stringify(history));
}

/* =====================
   SHOW HISTORY
===================== */
function loadHistory(){

    let history=
    JSON.parse(localStorage.getItem("history")) || [];

    let output="";

    history.reverse().forEach(item=>{
        output+=`
        <div class="historyCard">
        📍 ${item.city}<br>
        🕒 ${item.time}
        </div>`;
    });

    if(document.getElementById("history"))
        document.getElementById("history").innerHTML=output;
}

loadHistory();
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("history")) {
        loadHistory();
    }
});