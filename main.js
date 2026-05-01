//API KEY (OpenWeatherMap-Free)
const API_KEY = 'bd5e378503939ddaee76f12ad7a97608';

let currentUnit = 'C';
let currentData  = null;
let forecastData = null;



function getWeatherEmoji(code) {
  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 400) return '🌦️';
  if (code >= 500 && code < 600) return '🌧️';
  if (code >= 600 && code < 700) return '❄️';
  if (code >= 700 && code < 800) return '🌫️';
  if (code === 800)              return '☀️';
  if (code === 801)              return '🌤️';
  if (code === 802)              return '⛅';
  if (code >= 803)               return '☁️';
  return '🌡️';
}

//TEMPERATURE
function toF(c) { return Math.round((c * 9 / 5) + 32); }
function formatTemp(c) {
  return currentUnit === 'C' ? `${Math.round(c)}°C` : `${toF(c)}°F`;
}

//TIME FORMAT
function formatTime(unix, offset) {
  const date = new Date((unix + offset) * 1000);
  return date.toUTCString().slice(17, 22);
}

function getCurrentDateTime() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

//SEARCH FUNCTIONS
function searchWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) { showError('Please enter a city name!'); return; }
  fetchWeather(`q=${city}`);
}

function quickSearch(city) {
  document.getElementById('cityInput').value = city;
  fetchWeather(`q=${city}`);
}

function getLocation() {
  if (!navigator.geolocation) { showError('Geolocation not supported!'); return; }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    pos => fetchWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
    ()  => { hideLoading(); showError('Location access denied!'); }
  );
}

//FETCH WEATHER
async function fetchWeather(query) {
  showLoading();
  hideError();

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?${query}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?${query}&appid=${API_KEY}&units=metric`)
    ]);

    if (!weatherRes.ok) throw new Error('City not found!');

    currentData  = await weatherRes.json();
    forecastData = await forecastRes.json();

    displayWeather();
    hideLoading();

    document.getElementById('weatherSection').style.display = 'block';
    document.getElementById('welcomeSection').style.display = 'none';

  } catch (err) {
    hideLoading();
    showError(err.message || 'City not found! Please try again.');
  }
}

//DISPLAY WEATHER
function displayWeather() {
  const d = currentData;

  document.getElementById('cityName').textContent    = d.name;
  document.getElementById('cityCountry').textContent = `// ${d.sys.country} · ${d.coord.lat.toFixed(2)}°N, ${d.coord.lon.toFixed(2)}°E`;
  document.getElementById('weatherIcon').textContent = getWeatherEmoji(d.weather[0].id);
  document.getElementById('tempBig').textContent     = formatTemp(d.main.temp);
  document.getElementById('weatherDesc').textContent = d.weather[0].description;
  document.getElementById('feelsLike').textContent   = `Feels like ${formatTemp(d.main.feels_like)}`;
  document.getElementById('humidity').textContent    = `${d.main.humidity}%`;
  document.getElementById('windSpeed').textContent   = `${(d.wind.speed * 3.6).toFixed(1)} km/h`;
  document.getElementById('visibility').textContent  = `${(d.visibility / 1000).toFixed(1)} km`;
  document.getElementById('pressure').textContent    = `${d.main.pressure} hPa`;
  document.getElementById('dateTime').textContent    = getCurrentDateTime();
  document.getElementById('sunrise').textContent     = formatTime(d.sys.sunrise, d.timezone);
  document.getElementById('sunset').textContent      = formatTime(d.sys.sunset, d.timezone);

  displayForecast();
}

//DISPLAY FORECAST
function displayForecast() {
  const days = {};
  forecastData.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!days[date]) days[date] = item;
  });

  const entries     = Object.entries(days).slice(0, 5);
  const forecastRow = document.getElementById('forecastRow');
  forecastRow.innerHTML = '';

  entries.forEach(([date, item]) => {
    const d   = new Date(date);
    const day = d.toLocaleDateString('en-US', { weekday: 'short' });
    const mon = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    forecastRow.innerHTML += `
      <div class="col">
        <div class="forecast-item">
          <div class="forecast-day">${day}<br/>${mon}</div>
          <div class="forecast-icon">${getWeatherEmoji(item.weather[0].id)}</div>
          <div class="forecast-temp">${formatTemp(item.main.temp_max)}</div>
          <div class="forecast-min">${formatTemp(item.main.temp_min)}</div>
        </div>
      </div>`;
  });
}

//UNIT SWITCH
function switchUnit(unit) {
  currentUnit = unit;
  document.getElementById('celsiusBtn').classList.toggle('active', unit === 'C');
  document.getElementById('fahrenheitBtn').classList.toggle('active', unit === 'F');
  if (currentData) displayWeather();
}

//HELPERS
function showLoading() {
  document.getElementById('loading').style.display         = 'block';
  document.getElementById('weatherSection').style.display  = 'none';
  document.getElementById('welcomeSection').style.display  = 'none';
}
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}
function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent    =  msg;
  el.style.display  = 'block';
}
function hideError() {
  document.getElementById('errorMsg').style.display = 'none';
}

//ENTER KEY
document.getElementById('cityInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') searchWeather();
});
