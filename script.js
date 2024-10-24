// Substitua 'YOUR_API_KEY' com sua chave da API OpenWeatherMap
const apiKey = 'YOUR_API_KEY';
const city = 'Porto Alegre';
const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

// Função para buscar dados da API OpenWeatherMap
async function getWaterLevelData() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Extraindo dados de precipitação (chuva)
        const waterLevels = data.list.map(entry => ({
            date: entry.dt_txt,
            waterLevel: entry.rain ? entry.rain['3h'] || 0 : 0 // Precipitação nos últimos 3 horas
        }));

        return waterLevels;
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
            label: 'Nível de Água (mm)',
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

// Função para inicializar o mapa com Google Maps API
function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -30.0346, lng: -51.2177 }, // Porto Alegre, RS
        zoom: 12
    });

    // Marcadores para áreas de risco (exemplo)
    const riskAreas = [
        { lat: -30.0346, lng: -51.2177, title: 'Área de Risco 1' },
        { lat: -29.932, lng: -51.084, title: 'Área de Risco 2' }
    ];

    riskAreas.forEach(area => {
        new google.maps.Marker({
            position: { lat: area.lat, lng: area.lng },
            map: map,
            title: area.title
        });
    });
}

// Inicializando o mapa e o gráfico ao carregar a página
window.onload = function() {
    initMap();
    initWaterLevelChart();
};
