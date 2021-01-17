
import Chart from 'chart.js';

class GravityChart{
  
}

export function initChart(data){
  console.log(data);
  var ctx = document.getElementById('gravity-chart').getContext('2d');
  var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: data.labels.map(x => x.toFixed(2)),
        datasets: [{
            label: 'Gravitational field strength',
            borderColor: '#d64545',
            fill: false,
            data: data.data.map(x => x.toFixed(2)),
        }]
    },

    // Configuration options go here
    options: {
      scaleShowValues: true,
      scales: {
        xAxes: [{
          ticks: {
            autoSkip: true,
            maxRotation: 0,
          },
          scaleLabel: {
            display: true,
            labelString: 'Distance from center'
          }
        }],
        yAxes:[{
          ticks: {
            callback: (val) => { return val + ' m/s^2' }
          },
          scaleLabel: {
            display: true,
            labelString: 'Gravitational field strength'
          }
        }],
      }
    }
});
}

export function updateChart(){

}
