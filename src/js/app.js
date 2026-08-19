import { PIDController } from './pid.js';
import { MotorSimulator, SimulationMode } from './physics.js';
import { HardwareCanvas, VisualViewMode } from './canvas.js';
import { ChartManager } from './chartManager.js';
import { PerformanceAnalyzer } from './metrics.js';
import { TuningPresets } from './presets.js';

class App {
  constructor() {
    this.simMode = SimulationMode.POSITION;
    this.targetSetpoint = 180.0;
    this.simSpeed = 1.0;
    this.currentTime = 0.0;
    this.lastTimestamp = performance.now();
    this.sampleTick = 0;

    this.initCoreSystems();
    this.initUIElements();
    this.bindEvents();
    this.applyPreset(TuningPresets.CRITICALLY_DAMPED);

    requestAnimationFrame((t) => this.loop(t));
  }

  initCoreSystems() {
    this.pid = new PIDController({
      kp: 3.5,
      ki: 1.2,
      kd: 0.25,
      minOutput: -24.0,
      maxOutput: 24.0,
      derivativeOnMeasurement: true
    });

    this.motor = new MotorSimulator({
      mode: this.simMode,
      J: 0.05,
      b: 0.15
    });

    this.canvas = new HardwareCanvas('hardware-canvas');
    this.chart = new ChartManager('oscilloscope-chart', { maxDataPoints: 250 });
    this.metrics = new PerformanceAnalyzer();
  }

  initUIElements() {
    this.btnModePosition = document.getElementById('btn-mode-position');
    this.btnModeVelocity = document.getElementById('btn-mode-velocity');

    this.btnViewDisk = document.getElementById('btn-view-disk');
    this.btnViewStage = document.getElementById('btn-view-stage');

    this.elSetpoint = document.getElementById('telemetry-setpoint');
    this.elActual = document.getElementById('telemetry-actual');
    this.elError = document.getElementById('telemetry-error');
    this.elControl = document.getElementById('telemetry-control');

    this.btnDisturbance = document.getElementById('btn-inject-disturbance');
    this.btnNoise = document.getElementById('btn-toggle-noise');
    this.txtNoiseStatus = document.getElementById('noise-status-text');
    this.btnStepTest = document.getElementById('btn-run-step-test');
    this.btnReset = document.getElementById('btn-reset-system');

    this.elGradeBadge = document.getElementById('metric-grade-badge');
    this.elRiseTime = document.getElementById('metric-rise-time');
    this.elOvershoot = document.getElementById('metric-overshoot');
    this.elSettlingTime = document.getElementById('metric-settling-time');
    this.elSteadyError = document.getElementById('metric-error');
    this.elMetricFeedback = document.getElementById('metric-feedback-text');

    this.sliderSetpoint = document.getElementById('slider-setpoint');
    this.valSetpoint = document.getElementById('val-setpoint');
    this.setpointUnitBadge = document.getElementById('setpoint-unit-badge');

    this.sliderKp = document.getElementById('slider-kp');
    this.valKp = document.getElementById('val-kp');

    this.sliderKi = document.getElementById('slider-ki');
    this.valKi = document.getElementById('val-ki');

    this.sliderKd = document.getElementById('slider-kd');
    this.valKd = document.getElementById('val-kd');

    this.sliderInertia = document.getElementById('slider-inertia');
    this.valInertia = document.getElementById('val-inertia');

    this.sliderDamping = document.getElementById('slider-damping');
    this.valDamping = document.getElementById('val-damping');

    this.sliderSimSpeed = document.getElementById('slider-sim-speed');
    this.valSimSpeed = document.getElementById('val-sim-speed');

    this.presetSelect = document.getElementById('preset-select');

    this.btnPauseChart = document.getElementById('btn-pause-chart');
    this.btnClearChart = document.getElementById('btn-clear-chart');
    this.btnExportChart = document.getElementById('btn-export-chart');
  }

  bindEvents() {
    this.btnModePosition.addEventListener('click', () => this.switchSimulationMode(SimulationMode.POSITION));
    this.btnModeVelocity.addEventListener('click', () => this.switchSimulationMode(SimulationMode.VELOCITY));

    this.btnViewDisk.addEventListener('click', () => {
      this.canvas.setViewMode(VisualViewMode.MOTOR_DISK);
      this.btnViewDisk.classList.add('active');
      this.btnViewStage.classList.remove('active');
    });
    this.btnViewStage.addEventListener('click', () => {
      this.canvas.setViewMode(VisualViewMode.ROBOTIC_STAGE);
      this.btnViewStage.classList.add('active');
      this.btnViewDisk.classList.remove('active');
    });

    this.sliderSetpoint.addEventListener('input', (e) => {
      this.targetSetpoint = parseFloat(e.target.value);
      this.valSetpoint.textContent = this.targetSetpoint.toFixed(0);
    });

    this.sliderKp.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valKp.textContent = val.toFixed(2);
      this.pid.setGains(val, this.pid.ki, this.pid.kd);
    });

    this.sliderKi.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valKi.textContent = val.toFixed(2);
      this.pid.setGains(this.pid.kp, val, this.pid.kd);
    });

    this.sliderKd.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valKd.textContent = val.toFixed(2);
      this.pid.setGains(this.pid.kp, this.pid.ki, val);
    });

    this.sliderInertia.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valInertia.textContent = val.toFixed(3);
      this.motor.setParams(val, this.motor.b);
    });

    this.sliderDamping.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valDamping.textContent = val.toFixed(2);
      this.motor.setParams(this.motor.J, val);
    });

    this.sliderSimSpeed.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.simSpeed = val;
      this.valSimSpeed.textContent = val.toFixed(1) + 'x';
    });

    this.presetSelect.addEventListener('change', (e) => {
      const presetKey = e.target.value;
      if (TuningPresets[presetKey]) {
        this.applyPreset(TuningPresets[presetKey]);
      }
    });

    this.btnDisturbance.addEventListener('click', () => {
      this.motor.injectDisturbance(5.0, 0.6);
    });

    this.btnNoise.addEventListener('click', () => {
      const newNoiseState = !this.motor.noiseEnabled;
      const mag = this.simMode === SimulationMode.POSITION ? 1.5 : 25.0;
      this.motor.setSensorNoise(newNoiseState, mag);
      this.txtNoiseStatus.textContent = newNoiseState ? 'ON' : 'OFF';
      this.btnNoise.style.borderColor = newNoiseState ? '#ffb700' : 'rgba(255, 255, 255, 0.08)';
    });

    this.btnStepTest.addEventListener('click', () => {
      this.runStepResponseTest();
    });

    this.btnReset.addEventListener('click', () => {
      this.resetSystem();
    });

    this.btnPauseChart.addEventListener('click', () => {
      const paused = this.chart.togglePause();
      this.btnPauseChart.textContent = paused ? '▶️' : '⏸️';
    });

    this.btnClearChart.addEventListener('click', () => {
      this.chart.clear();
    });

    this.btnExportChart.addEventListener('click', () => {
      this.chart.exportImage();
    });
  }

  applyPreset(preset) {
    this.sliderKp.value = preset.kp;
    this.valKp.textContent = preset.kp.toFixed(2);

    this.sliderKi.value = preset.ki;
    this.valKi.textContent = preset.ki.toFixed(2);

    this.sliderKd.value = preset.kd;
    this.valKd.textContent = preset.kd.toFixed(2);

    this.pid.setGains(preset.kp, preset.ki, preset.kd);
  }

  switchSimulationMode(mode) {
    if (this.simMode === mode) return;

    this.simMode = mode;
    this.motor.setMode(mode);
    this.pid.reset();
    this.chart.clear();

    if (mode === SimulationMode.POSITION) {
      this.btnModePosition.classList.add('active');
      this.btnModeVelocity.classList.remove('active');

      this.sliderSetpoint.min = "0";
      this.sliderSetpoint.max = "360";
      this.sliderSetpoint.step = "1";
      this.targetSetpoint = 180.0;
      this.sliderSetpoint.value = "180";
      this.valSetpoint.textContent = "180";
      this.setpointUnitBadge.textContent = "°";
    } else {
      this.btnModeVelocity.classList.add('active');
      this.btnModePosition.classList.remove('active');

      this.sliderSetpoint.min = "-1500";
      this.sliderSetpoint.max = "1500";
      this.sliderSetpoint.step = "50";
      this.targetSetpoint = 600.0;
      this.sliderSetpoint.value = "600";
      this.valSetpoint.textContent = "600";
      this.setpointUnitBadge.textContent = " RPM";
    }
  }

  runStepResponseTest() {
    const startVal = this.motor.getMeasurement().clean;
    this.metrics.startStepTest(startVal, this.targetSetpoint, this.currentTime);
    this.elMetricFeedback.textContent = 'Step test running... recording response metrics...';
  }

  resetSystem() {
    this.pid.reset();
    this.motor.reset();
    this.chart.clear();
    this.metrics.reset();
    this.updateMetricsUI();
  }

  updateMetricsUI() {
    const m = this.metrics.metrics;

    this.elGradeBadge.textContent = m.grade;
    this.elGradeBadge.style.backgroundColor = (m.grade === 'A+' || m.grade === 'A') ? '#00ff9d' : (m.grade.startsWith('B') ? '#00f0ff' : '#ff4d4d');

    this.elRiseTime.textContent = m.riseTime !== null ? `${m.riseTime.toFixed(3)}s` : '--';
    this.elOvershoot.textContent = m.overshoot !== null ? `${m.overshoot.toFixed(1)}%` : '--';
    this.elSettlingTime.textContent = m.settlingTime !== null ? `${m.settlingTime.toFixed(2)}s` : '--';
    this.elSteadyError.textContent = m.steadyStateError !== null ? m.steadyStateError.toFixed(2) : '--';
    this.elMetricFeedback.textContent = m.feedback;
  }

  loop(now) {
    let dt = (now - this.lastTimestamp) / 1000.0;
    this.lastTimestamp = now;

    if (dt > 0.1) dt = 0.1;

    const effectiveDt = dt * this.simSpeed;
    this.currentTime += effectiveDt;

    const measurement = this.motor.getMeasurement();
    const currentVal = measurement.noisy;

    const controlSignal = this.pid.compute(this.targetSetpoint, currentVal, effectiveDt);
    const nextState = this.motor.step(controlSignal, effectiveDt);

    if (this.metrics.isRecording) {
      this.metrics.sample(this.currentTime, nextState.clean, this.targetSetpoint);
      this.updateMetricsUI();
    }

    this.canvas.render(nextState, this.targetSetpoint, this.simMode);

    this.sampleTick++;
    if (this.sampleTick % 2 === 0) {
      const error = this.targetSetpoint - nextState.clean;
      this.chart.addDataPoint(this.currentTime, this.targetSetpoint, nextState.clean, error, controlSignal);
    }

    const unit = nextState.unit;
    this.elSetpoint.textContent = `${this.targetSetpoint.toFixed(1)}${unit}`;
    this.elActual.textContent = `${nextState.clean.toFixed(1)}${unit}`;
    this.elError.textContent = `${(this.targetSetpoint - nextState.clean).toFixed(1)}${unit}`;
    this.elControl.textContent = `${controlSignal.toFixed(1)} V`;

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.simuLoopApp = new App();
});
