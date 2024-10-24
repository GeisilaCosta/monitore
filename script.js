const apiKey = 'fcfd12329f77599c436a33ce81107093'; // sua chave da API OpenWeatherMap
let city = 'Porto Alegre'; // Cidade padrão, caso o usuário não insira nada

// Função para buscar dados reais da API OpenWeatherMap
async function getWaterLevelData() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === '200') {
            // Extraindo dados de precipitação (chuva)
            const waterLevels = data.list.map(entry => ({
                date: entry.dt_txt,
                waterLevel: entry.rain ? entry.rain['3h'] || 0 : 0 // Precipitação nas últimas 3 horas
            }));

            return waterLevels;
        } else {
            console.error('Erro ao buscar dados: Cidade não encontrada');
            alert('Cidade não encontrada, tente novamente.');
            return [];
        }
    } catch (error) {
        console.error('Erro ao buscar dados da API:', error);
    }
}

// Função para inicializar o gráfico de níveis de água
async function initWaterLevelChart() {
    const waterLevelData = await getWaterLevelData();

    const labels = waterLevelData.map(entry => entry.date);
    const levels = waterLevelData.map(entry => entry.waterLevel);

    const ctx = document.getElementById('waterLevelChart').getContext('2d');

    const data = {
        labels: labels,
        datasets: [{
            label: `Nível de Água (mm) em ${city}`,
            data: levels,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            borderWidth: 2
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nível de Água (mm)'
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
    };

    new Chart(ctx, config);
}

// Função para inicializar o mapa com Leaflet.js + OpenStreetMap
let map = L.map('map').setView([-30.0346, -51.2177], 12); // Porto Alegre como padrão

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Função para buscar a cidade usando OpenStreetMap Nominatim API
function searchCity() {
    const cityInput = document.getElementById('cityInput').value || city;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${cityInput}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;

                // Atualiza o mapa para focar na nova cidade
                map.setView([lat, lon], 12);

                // Adiciona um marcador na cidade pesquisada
                L.marker([lat, lon]).addTo(map)
                    .bindPopup(`Cidade: ${cityInput}`)
                    .openPopup();
            } else {
                alert('Cidade não encontrada.');
            }
        })
        .catch(error => {
            console.error('Erro ao buscar a cidade:', error);
        });
}

// Captura a cidade digitada e carrega os dados
document.getElementById('searchButton').addEventListener('click', function () {
    searchCity(); // Busca e atualiza o mapa
    initWaterLevelChart(); // Atualiza o gráfico
});

// Inicializa o gráfico ao carregar a página
window.onload = function() {
    initWaterLevelChart(); // Carrega o gráfico com a cidade padrão
    searchCity(); // Inicializa o mapa com a cidade padrão
};

