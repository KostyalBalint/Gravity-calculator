
import Chart from 'chart.js';

class GravityChart{
  constructor(){
    this.ctx = document.getElementById('gravity-chart').getContext('2d');
    this.chart = new Chart(this.ctx, {
      // The type of chart we want to create
      type: 'line',

      // The data for our dataset
      data: {
        labels: [],
        datasets: [{
            label: 'Gravitational field strength',
            borderColor: '#d64545',
            fill: false,
            data: [],
        }]
      },

      // Configuration options go here
      options: {
        scaleShowValues: true,
        animation: {
            duration: 2000,
        },
        scales: {
          xAxes: [{
            ticks: {
              autoSkip: true,
              maxRotation: 0,
              stepSize: 10,
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

  updateChart(data){
    console.log(this.chart.data);
    this.chart.data.labels = data.labels.map(x => x.toFixed(2));
    this.chart.data.datasets[0].data = data.data.map(x => x.toFixed(2));
    this.chart.update();
  }
}


export default new GravityChart();
