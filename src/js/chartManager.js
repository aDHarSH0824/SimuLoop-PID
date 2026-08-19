import Chart from 'chart.js/auto';

export class ChartManager {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with ID '${canvasId}' not found.`);
    }

    this.maxDataPoints = options.maxDataPoints ?? 250;
    this.isPaused = false;

    this.initChart();
  }

  initChart() {
    const ctx = this.canvas.getContext('2d');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Setpoint r(t)',
            borderColor: '#ff4d4d',
            backgroundColor: 'rgba(255, 77, 77, 0.1)',
            borderWidth: 2,
            borderDash: [5, 4],
            pointRadius: 0,
            tension: 0.1,
            data: [],
            yAxisID: 'y'
          },
          {
            label: 'System Output y(t)',
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.15)',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.2,
            data: [],
            yAxisID: 'y'
          },
          {
            label: 'Error e(t)',
            borderColor: '#00ff9d',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [2, 2],
            pointRadius: 0,
            tension: 0.2,
            data: [],
            yAxisID: 'y'
          },
          {
            label: 'Control Signal u(t) [V]',
            borderColor: '#ffb700',
            backgroundColor: 'rgba(255, 183, 0, 0.05)',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.1,
            data: [],
            yAxisID: 'yControl'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { family: "'Inter', sans-serif", size: 12 },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } },
            title: { display: true, text: 'Time (seconds)', color: '#64748b', font: { size: 11 } }
          },
          y: {
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#00f0ff', font: { size: 11 } },
            title: { display: true, text: 'Output / Setpoint', color: '#00f0ff', font: { size: 11 } }
          },
          yControl: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#ffb700', font: { size: 11 } },
            title: { display: true, text: 'Control Voltage u(t) [V]', color: '#ffb700', font: { size: 11 } },
            min: -25,
            max: 25
          }
        }
      }
    });
  }

  addDataPoint(timestamp, setpoint, output, error, controlSignal) {
    if (this.isPaused) return;

    const timeLabel = (typeof timestamp === 'number') ? timestamp.toFixed(2) : timestamp;
    const labels = this.chart.data.labels;
    const datasets = this.chart.data.datasets;

    labels.push(timeLabel);
    datasets[0].data.push(setpoint);
    datasets[1].data.push(output);
    datasets[2].data.push(error);
    datasets[3].data.push(controlSignal);

    if (labels.length > this.maxDataPoints) {
      labels.shift();
      datasets.forEach(ds => ds.data.shift());
    }

    this.chart.update('none');
  }

  clear() {
    this.chart.data.labels = [];
    this.chart.data.datasets.forEach(ds => {
      ds.data = [];
    });
    this.chart.update();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  exportImage() {
    const imageURI = this.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'simuloop-oscilloscope-graph.png';
    link.href = imageURI;
    link.click();
  }
}
