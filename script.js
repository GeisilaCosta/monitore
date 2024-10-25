const apiKey = 'a50b3cdbf88fed061a2ebbe1b82c4935';
let defaultCity = 'Porto Alegre';
let map;
let chartInstance;

// Função para exibir mensagens de erro no front-end
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Função para exibir alertas meteorológicos
function displayWeatherAlerts(alerts) {
    const alertsContainer = document.getElementById('alerts-container');
    alertsContainer.innerHTML = '';

    if (alerts.length > 0) {
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.classList.add('alert');

            alertDiv.innerHTML = `
                <h4>${alert.event}</h4>
                <p>${alert.description}</p>
                <p><strong>Início:</strong> ${new Date(alert.start * 1000).toLocaleString('pt-BR')}</p>
                <p><strong>Fim:</strong> ${new Date(alert.end * 1000).toLocaleString('pt-BR')}</p>
            `;
            alertsContainer.appendChild(alertDiv);
        });
    } else {
        alertsContainer.innerHTML = '<p>Não há alertas meteorológicos para esta cidade.</p>';
    }
}

// Função para exibir a previsão do tempo
function displayForecast(forecastData) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';

    const uniqueDays = new Set();
    forecastData.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

        // Filtra entradas para evitar duplicação de dias
        if (!uniqueDays.has(date)) {
            uniqueDays.add(date);
            const forecastDay = document.createElement('div');
            forecastDay.classList.add('forecast-day');

            forecastDay.innerHTML = `
                <h4>${date}</h4>
                <div class="forecast-details">
                    <p>Temp: ${entry.temperature}°C</p>
                    <p>Vento: ${entry.windSpeed} m/s</p>
                    <p>Umidade: ${entry.humidity}%</p>
                    <p>Nível de água: ${entry.waterLevel} mm</p>
                </div>
            `;

            // Alterna a exibição dos detalhes ao clicar
            forecastDay.addEventListener('click', () => {
                forecastDay.classList.toggle('active');
            });

            forecastContainer.appendChild(forecastDay);
        }
    });
}

// Função para ocultar mensagens de erro
function hideError() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.style.display = 'none';
}

// Função para buscar dados da API OpenWeatherMap
async function fetchWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            const forecastData = data.list.map(entry => ({
                date: entry.dt_txt,
                waterLevel: entry.rain ? entry.rain['3h'] || 0 : 0,
                temperature: entry.main.temp,
                windSpeed: entry.wind.speed,
                humidity: entry.main.humidity
            }));

            displayForecast(forecastData);
            return forecastData;
        } else {
            showError('Erro: Cidade não encontrada.');
            return [];
        }
    } catch (error) {
        showError('Erro ao buscar dados da API.');
        return [];
    }
}

// Função para buscar alertas meteorológicos
async function fetchWeatherAlerts(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            const alertsContainer = document.getElementById('alerts-container');
            alertsContainer.innerHTML = ''; // Limpa alertas anteriores

            if (data.alerts && data.alerts.length > 0) {
                // Se houver alertas, exibe cada um deles
                data.alerts.forEach(alert => {
                    const alertDiv = document.createElement('div');
                    alertDiv.classList.add('alert');
                    alertDiv.innerHTML = `
                        <h4>${alert.event}</h4>
                        <p>${alert.description}</p>
                        <p><strong>Início:</strong> ${new Date(alert.start * 1000).toLocaleString('pt-BR')}</p>
                        <p><strong>Fim:</strong> ${new Date(alert.end * 1000).toLocaleString('pt-BR')}</p>
                    `;
                    alertsContainer.appendChild(alertDiv);
                });
            } else {
                // Se não houver alertas, exibe a mensagem
                alertsContainer.innerHTML = '<p>Não há alertas meteorológicos para esta cidade.</p>';
            }
        } else {
            // Se a resposta não for OK, exibe uma mensagem de erro
            showError('Erro ao buscar alertas meteorológicos.');
        }
    } catch (error) {
        // Exibe mensagem de erro se a requisição falhar
        showError('Erro ao buscar alertas meteorológicos.');
    }
}


// Função para atualizar o gráfico de níveis de água e outras informações
async function updateChartAndInfo(city) {
    hideError();
    const weatherData = await fetchWeatherData(city);
    await fetchWeatherAlerts(city);

    if (weatherData.length === 0) return;

    const labels = weatherData.map(entry => entry.date);
    const levels = weatherData.map(entry => entry.waterLevel);
    const temperatures = weatherData.map(entry => entry.temperature);
    const windSpeeds = weatherData.map(entry => entry.windSpeed);
    const humidityLevels = weatherData.map(entry => entry.humidity);

    const ctx = document.getElementById('waterLevelChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Nível de Água (mm) em ${city}`,
                    data: levels,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: `Temperatura (°C) em ${city}`,
                    data: temperatures,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false,
                    borderWidth: 2
                },
                {
                    label: `Velocidade do Vento (m/s) em ${city}`,
                    data: windSpeeds,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: false,
                    borderWidth: 2
                },
                {
                    label: `Humidade (%) em ${city}`,
                    data: humidityLevels,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: false,
                    borderWidth: 2
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valores'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Datas'
                    }
                }
            }
        }
    });
}

// Função para inicializar o mapa
function initMap(cityLat, cityLon, cityName) {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([cityLat, cityLon], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([cityLat, cityLon]).addTo(map)
        .bindPopup(`Cidade: ${cityName}`)
        .openPopup();
}

// Função para buscar coordenadas da cidade
async function fetchCityCoordinates(city) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${city}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.length > 0) {
            const { lat, lon } = data[0];
            return { lat: parseFloat(lat), lon: parseFloat(lon) };
        } else {
            showError('Erro: Cidade não encontrada.');
            return null;
        }
    } catch (error) {
        showError('Erro ao buscar coordenadas da cidade.');
        return null;
    }
}

// Função principal para pesquisar e carregar o mapa e gráfico
async function searchCity() {
    const cityInput = document.getElementById('cityInput').value.trim() || defaultCity;
    const coordinates = await fetchCityCoordinates(cityInput);

    if (coordinates) {
        const { lat, lon } = coordinates;
        initMap(lat, lon, cityInput);
        updateChartAndInfo(cityInput);
    }
}

// Event listener para o botão de pesquisa
document.getElementById('searchButton').addEventListener('click', searchCity);

// Inicializa a aplicação com a cidade padrão
searchCity();

