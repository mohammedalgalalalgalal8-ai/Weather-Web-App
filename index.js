const THEME_KEY = 'weather_theme_manual_choice';
let map = L.map('map').setView([44.34,10.99], 6);

document.addEventListener("DOMContentLoaded", async () => {
  const saved = localStorage.getItem(THEME_KEY);
  if(saved) applyTheme(saved, false);

  document.querySelectorAll(".weather-card").forEach((c,i)=>{
    setTimeout(()=>c.classList.add("show"), i*150);
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);
  L.marker([44.34,10.99]).addTo(map).bindPopup("اليمن - موقعك الحالي").openPopup();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      map.setView([lat, lon], 8);
      L.marker([lat, lon]).addTo(map).bindPopup("موقعي الحالي").openPopup();

      await fetchWeatherAll(lat, lon);
      await fetchWeathergas(lat, lon);

    }, async () => {
      const lat = 44.34, lon = 10.99;
      map.setView([lat, lon], 8);
      await fetchWeatherAll(lat, lon);
      await fetchWeathergas(lat, lon);
    });
  } else {
    const lat = 44.34, lon = 10.99;
    map.setView([lat, lon], 8);
    await fetchWeatherAll(lat, lon);
    await fetchWeathergas(lat, lon);
  }
});

function updateClock(){
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('clock').textContent = timeStr;

  const hour = now.getHours();
  if (hour >= 6 && hour < 18) applyTheme('day', false);
  else applyTheme('night', false);
}
setInterval(updateClock, 1000);
updateClock();

function applyTheme(theme, saveManual){
  document.body.setAttribute('data-theme', theme);
  const icon = document.querySelector('#themeToggle i');
  icon.className = theme === 'day' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  if(saveManual) localStorage.setItem(THEME_KEY, theme);
}

document.getElementById('themeToggle').addEventListener('click', ()=>{
  const current = document.body.getAttribute('data-theme');
  applyTheme(current === 'day' ? 'night' : 'day', true);
});

const api_key = "2c7a99263f9f64f1eef1df0e2f8933e2";

const nowTempEl = document.querySelector(".now-temp");
const nowDescEl = document.querySelector(".now-desc");
const pollutantEls = document.querySelectorAll(".pollutant-grid .item .val");
const dailyForecastEl = document.querySelector(".forecast-scroll");
const hourlyForecastEl = document.querySelectorAll(".hour-card");
const humidity=document.getElementById("humidity");
const wind= document.getElementById("wind");
const pressure=document.getElementById("pressure");
const visibility =document.getElementById("visibility");
const alert1=document.getElementById("alert1");
const alert2=document.getElementById("alert2");

const refreshBtn = document.createElement("button");
refreshBtn.className = "btn-city ms-2";
refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> تحديث';
document.querySelector(".navbar-custom .d-flex.align-items-center.gap-2").appendChild(refreshBtn);

function getIcon(icon) {
  const map = {
    "01d":"fa-sun",
    "01n":"fa-moon",
    "02d":"fa-cloud-sun",
    "02n":"fa-cloud-moon",
    "03d":"fa-cloud",
    "03n":"fa-cloud",
    "04d":"fa-cloud",
    "04n":"fa-cloud",
    "09d":"fa-cloud-showers-heavy",
    "09n":"fa-cloud-showers-heavy",
    "10d":"fa-cloud-rain",
    "10n":"fa-cloud-rain",
    "11d":"fa-bolt",
    "11n":"fa-bolt",
    "13d":"fa-snowflake",
    "13n":"fa-snowflake",
    "50d":"fa-smog",
    "50n":"fa-smog"
  };
  return map[icon] || "fa-sun";
}

async function fetchWeatherAll(lat, lon){
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}&units=metric&lang=ar`;
    const res = await axios.get(url);
    const list = res.data.list;

    if(list.length > 0){
      const current = list[0];
      humidity.innerHTML= `<div class="col-6" id="humidity"><div class="item"><i class="fa-solid fa-droplet"></i>الرطوبه ${current.main.humidity}%</div></div>`;
      wind.innerHTML=  `<div class="col-6" id="wind"><div class="item"><i class="fa-solid fa-droplet"></i>${current.wind.speed}كم/س</div></div>`;
      pressure.innerHTML=  `<div class="col-6" id="pressure"><div class="item"><i class="fa-solid fa-droplet"></i>${current.main.pressure}hPa</div></div>`;
      visibility.innerHTML=  `<div class="col-6" id="visibility"><div class="item"><i class="fa-solid fa-droplet"></i> ${(current.visibility / 1000).toFixed(1)} كم</div></div>`;

      nowTempEl.textContent = `${current.main.temp.toFixed(1)}°C`;
      nowDescEl.innerHTML = `<i class="fa-solid fa-cloud-sun"></i> ${current.weather[0].description}`;

      // التوقعات اليومية
      const days = {};
      list.forEach(item=>{
        const date = new Date(item.dt*1000);
        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'long' });
        if(!days[dayName]) days[dayName] = { temps: [], icons: [] };
        days[dayName].temps.push(item.main.temp);
        days[dayName].icons.push(item.weather[0].icon);
      });

      const weekOrder = ["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];
      dailyForecastEl.innerHTML = "";
      weekOrder.forEach(day=>{
        if(days[day]){
          const temps = days[day].temps;
          const icons = days[day].icons;
          const avgTemp = (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1);
          const iconClass = getIcon(icons[0]);
          dailyForecastEl.innerHTML += `
            <div class="day-card">
              <div>${day}</div>
              <i class="fa-solid ${iconClass} fa-2x"></i>
              <div>${avgTemp}°C</div>
            </div>`;
        }
      });

      // التوقعات الساعية
      try{
        const hourlyEls = document.querySelectorAll(".hour-card");
        const hoursToShow = [3, 6, 9, 12, 15, 18]; 
        const filtered = list.filter(item => {
          const date = new Date(item.dt * 1000);
          const h = date.getHours();
          return hoursToShow.includes(h);
        });

        filtered.slice(0, hourlyEls.length).forEach((hour, i) => {
          const date = new Date(hour.dt * 1000);
          const h = date.getHours();

          let formattedHour;
          if (h === 0) formattedHour = "12AM";
          else if (h < 12) formattedHour = `${h}AM`;
          else if (h === 12) formattedHour = "12PM";
          else formattedHour = `${h - 12}PM`;

          const temp = `${hour.main.temp.toFixed(1)}°C`;
          const iconClass = getIcon(hour.weather[0].icon);

          if (hourlyEls[i]) {
            hourlyEls[i].querySelector(".h-time").textContent = formattedHour;
            hourlyEls[i].querySelector("i").className = `fa-solid ${iconClass}`;
            hourlyEls[i].querySelector(".h-temp").textContent = temp;
          }
        });
      } catch (err) {
        console.error("⚠️ خطأ أثناء جلب بيانات التوقعات:", err);
      }

      // تنبيهات الطقس
      try {
        alert1.style.display = "none";
        alert2.style.display = "none";

        const rainForecast = list.find(item => 
          item.weather[0].main.toLowerCase().includes("rain") || 
          (item.rain && item.rain["3h"] > 0)
        );

        const strongWind = list.find(item => item.wind && item.wind.speed >= 10);
        const highTemp = list.find(item => item.main.temp >= 38);
        const lowTemp = list.find(item => item.main.temp <= 8);

        if (rainForecast) {
          alert1.className = "alert alert-warning p-2 mb-2";
          alert1.innerHTML = `<i class="fa-solid fa-cloud-showers-heavy"></i> 🌧️ أمطار متوقعة خلال الساعات القادمة`;
          alert1.style.display = "block";

          alert2.className = "alert alert-info p-2";
          alert2.innerHTML = `<i class="fa-solid fa-umbrella"></i> يُنصح بأخذ مظلة عند الخروج`;
          alert2.style.display = "block";
        } 
        else if (strongWind) {
          alert1.className = "alert alert-warning p-2 mb-2";
          alert1.innerHTML = `<i class="fa-solid fa-wind"></i> 💨 رياح قوية متوقعة اليوم`;
          alert1.style.display = "block";

          alert2.className = "alert alert-info p-2";
          alert2.innerHTML = `<i class="fa-solid fa-house"></i> يُفضل البقاء في الأماكن المغلقة`;
          alert2.style.display = "block";
        } 
        else if (highTemp) {
          alert1.className = "alert alert-warning p-2 mb-2";
          alert1.innerHTML = `<i class="fa-solid fa-temperature-high"></i> 🔥 ارتفاع كبير في درجات الحرارة`;
          alert1.style.display = "block";

          alert2.className = "alert alert-info p-2";
          alert2.innerHTML = `<i class="fa-solid fa-bottle-water"></i> يُنصح بشرب كميات كافية من الماء`;
          alert2.style.display = "block";
        }
        else if (lowTemp) {
          alert1.className = "alert alert-warning p-2 mb-2";
          alert1.innerHTML = `<i class="fa-solid fa-temperature-low"></i> 🥶 انخفاض كبير في درجات الحرارة`;
          alert1.style.display = "block";

          alert2.className = "alert alert-info p-2";
          alert2.innerHTML = `<i class="fa-solid fa-mitten"></i> يُنصح بارتداء ملابس دافئة`;
          alert2.style.display = "block";
        }
        else {
          alert1.className = "alert alert-info p-2 mb-2";
          alert1.innerHTML = `<i class="fa-solid fa-circle-check"></i> ☀️ لا توجد تنبيهات حالياً، الأجواء مستقرة`;
          alert1.style.display = "block";
          alert2.style.display = "none";
        }
      } catch (err) {
        console.error("⚠️ خطأ في تنبيهات الطقس:", err);
      }

    }
  } catch(err){
    console.error(err);
    alert("حدث خطأ أثناء جلب بيانات الطقس.");
  }
}

async function fetchWeathergas(lat, lon){
  try {
    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`;
    const res = await axios.get(url);
    const list = res.data.list;

    if(list[0].components){
      const pollutants = [
        list[0].components.so2,
        list[0].components.pm10,
        list[0].components.pm2_5,
        list[0].components.nh3,
        list[0].components.no2,
        list[0].components.no,
        list[0].components.co,
        list[0].components.o3
      ];
      pollutantEls.forEach((el,i)=>{ el.textContent = pollutants[i]?.toFixed(2) || "-" });
    }
  } catch(err){
    console.error(err);
    alert("حدث خطأ أثناء جلب بيانات الطقس.");
  }
}

// البحث
document.getElementById('btnsearch').addEventListener('click', async () => {
  const cityInput = document.getElementById('cityname');
  const city = cityInput.value.trim();

  cityInput.value = "";

  if (!city) { 
    alert("يرجى إدخال اسم المدينة"); 
    return; 
  }

  try {
    const geoRes = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${api_key}`);
    if (geoRes.data.length === 0) { 
      alert("المدينة غير موجودة"); 
      return; 
    }

    const { lat, lon } = geoRes.data[0];

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    map.setView([lat, lon], 8);
    L.marker([lat, lon]).addTo(map).bindPopup(`${city} - موقع البحث`).openPopup();

    await fetchWeatherAll(lat, lon);
    await fetchWeathergas(lat, lon);

  } catch (err) { 
    console.error(err); 
    alert("حدث خطأ أثناء البحث عن المدينة"); 
  }
});


document.getElementById('mylocation').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      map.setView([lat, lon], 8);
      L.marker([lat, lon]).addTo(map).bindPopup(`موقعي الحالي`).openPopup();

      await fetchWeatherAll(lat, lon);
      await fetchWeathergas(lat, lon);

    }, err => { alert("تعذر الحصول على موقعك"); });
  } else alert("المتصفح لا يدعم تحديد الموقع");
});

// زر تحديث
refreshBtn.addEventListener("click", async () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      await fetchWeatherAll(lat, lon);
      await fetchWeathergas(lat, lon);

      map.setView([lat, lon], 8);

      
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      L.marker([lat, lon]).addTo(map).bindPopup(`موقعي الحالي`).openPopup();

    }, () => {
      alert("لم يتم الحصول على الموقع")
      const lat = 44.34, lon = 10.99;
      fetchWeatherAll(lat, lon);
      fetchWeathergas(lat, lon);

      map.setView([lat, lon], 8);
    });
  }
});

fetchWeatherAll(44.34,10.99);
fetchWeathergas(44.34,10.99);
