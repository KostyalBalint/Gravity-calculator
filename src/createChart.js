
import Chart from 'chart.js';

export function initChart(data){
  console.log(data);
  var ctx = document.getElementById('gravity-chart').getContext('2d');
  var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: data.labels,
        datasets: [{
            label: 'Gravitational field strength',
            borderColor: 'rgb(255, 99, 132)',
            data: data.data,
        }]
    },

    // Configuration options go here
    options: {}
});
}
