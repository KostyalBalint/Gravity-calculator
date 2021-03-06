
import Chart from 'chart.js';

class GravityChart{
  constructor(direction){
    window.chart = this;
    this.ctx = document.getElementById('gravity-chart').getContext('2d');
    this.chart = new Chart(this.ctx, {
      // The type of chart we want to create
      type: 'line',

      // The data for our dataset
      data: {
        labels: [],
        datasets: [{
            label: 'Gravitational field strength',
            borderColor: "",
            pointRadius: 0,
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
              maxTicksLimit: 15,
              maxRotation: 20,
              stepSize: 10,
              callback: (val) => { return val + ' km' }
            },
            scaleLabel: {
              display: true,
              labelString: 'Distance from center'
            }
          }],
          yAxes:[{
            ticks: {
              callback: (val) => { return val + " m/s\u00B2" }
            },
            scaleLabel: {
              display: true,
              labelString: 'Gravitational field strength'
            }
          }],
        },
        tooltips: {
          mode: 'nearest',
          intersect: false,
          caretPadding: 2,
          callbacks: {
            label: function(tooltipItem, data) {
              return "g = " + tooltipItem.yLabel + " m/s\u00B2";
            },
            title: (tooltipItem, data) => {
              return "Distance: " + tooltipItem[0].label + " km";
            },
          }
        }
      }
  });
  }

  updateChart(data, direction){
    $("#chartPoints").prop('disabled', !direction);
    this.chart.data.datasets[0].borderColor = direction ? direction.color : "";
    this.chart.data.datasets[0].label = direction ? "Gravitational field strength along the: " + direction.name : "";
    this.chart.data.labels = data ? data.labels.map(x => x.toFixed(2)) : [];
    this.chart.data.datasets[0].data = data ? data.data.map(x => x.toFixed(2)) : [];
    this.chart.update();
  }
}


export default new GravityChart();
