const apiKey = 'a50b3cdbf88fed061a2ebbe1b82c4935'; // Chave da API OpenWeatherMap
let defaultCity = 'Porto Alegre'; // Cidade padrão
let map; // Variável global para o mapa
let chartInstance; // Variável global para o gráfico

// Função para exibir mensagens de erro no front-end
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
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
            return data.list.map(entry => ({
                date: entry.dt_txt,
                waterLevel: entry.rain ? entry.rain['3h'] || 0 : 0,
                temperature: entry.main.temp,
                windSpeed: entry.wind.speed,
                humidity: entry.main.humidity
            }));
        } else {
            showError('Erro: Cidade não encontrada.');
            return [];
        }
    } catch (error) {
        showError('Erro ao buscar dados da API.');
        return [];
    }
}

// Função para atualizar o gráfico de níveis de água e outras informações
async function updateChartAndInfo(city) {
    hideError(); // Oculta erros anteriores
    const weatherData = await fetchWeatherData(city);

    if (weatherData.length === 0) return; // Retorna caso não haja dados

    const labels = weatherData.map(entry => entry.date);
    const levels = weatherData.map(entry => entry.waterLevel);
    const temperatures = weatherData.map(entry => entry.temperature);
    const windSpeeds = weatherData.map(entry => entry.windSpeed);
    const humidityLevels = weatherData.map(entry => entry.humidity);

    const ctx = document.getElementById('waterLevelChart').getContext('2d');

    // Remove gráfico anterior se houver um
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Renderiza o novo gráfico
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
        updateChartAndInfo(cityInput); // Atualiza o gráfico e informações da cidade pesquisada
    }
}

// Event listener para o botão de pesquisa
document.getElementById('searchButton').addEventListener('click', searchCity);

// Inicializa a aplicação com a cidade padrão
searchCity();
