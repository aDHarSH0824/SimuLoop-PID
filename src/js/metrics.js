export class PerformanceAnalyzer {
  constructor() {
    this.reset();
  }

  reset() {
    this.isRecording = false;
    this.startTime = 0;
    this.initialValue = 0;
    this.targetSetpoint = 0;
    this.history = [];

    this.metrics = {
      riseTime: null,
      peakTime: null,
      peakValue: null,
      overshoot: null,
      settlingTime: null,
      steadyStateError: null,
      grade: 'N/A',
      feedback: 'Trigger a Step Response Test to record metrics.'
    };
  }

  startStepTest(startVal, targetVal, currentTime) {
    this.reset();
    this.isRecording = true;
    this.startTime = currentTime;
    this.initialValue = startVal;
    this.targetSetpoint = targetVal;
  }

  sample(currentTime, output, setpoint) {
    if (!this.isRecording) return;

    const t = currentTime - this.startTime;
    const error = Math.abs(setpoint - output);

    this.history.push({ time: t, output, error, setpoint });
    this.calculateMetrics();
  }

  stopStepTest() {
    this.isRecording = false;
    this.calculateMetrics();
  }

  calculateMetrics() {
    if (this.history.length < 5) return this.metrics;

    const stepDelta = this.targetSetpoint - this.initialValue;
    if (Math.abs(stepDelta) < 1e-4) {
      this.metrics.feedback = 'Setpoint change too small for step evaluation.';
      return this.metrics;
    }

    const isPositiveStep = stepDelta > 0;
    const target = this.targetSetpoint;

    const val10 = this.initialValue + 0.10 * stepDelta;
    const val90 = this.initialValue + 0.90 * stepDelta;

    let t10 = null;
    let t90 = null;
    let maxVal = this.history[0].output;
    let maxValTime = 0;

    for (let i = 0; i < this.history.length; i++) {
      const point = this.history[i];
      const val = point.output;

      if (isPositiveStep) {
        if (t10 === null && val >= val10) t10 = point.time;
        if (t90 === null && val >= val90) t90 = point.time;
        if (val > maxVal) {
          maxVal = val;
          maxValTime = point.time;
        }
      } else {
        if (t10 === null && val <= val10) t10 = point.time;
        if (t90 === null && val <= val90) t90 = point.time;
        if (val < maxVal) {
          maxVal = val;
          maxValTime = point.time;
        }
      }
    }

    if (t10 !== null && t90 !== null) {
      this.metrics.riseTime = t90 - t10;
    }

    this.metrics.peakValue = maxVal;
    this.metrics.peakTime = maxValTime;

    let osPercentage = 0.0;
    if (isPositiveStep) {
      if (maxVal > target) {
        osPercentage = ((maxVal - target) / Math.abs(stepDelta)) * 100.0;
      }
    } else {
      if (maxVal < target) {
        osPercentage = ((target - maxVal) / Math.abs(stepDelta)) * 100.0;
      }
    }
    this.metrics.overshoot = osPercentage;

    const band = 0.02 * Math.abs(stepDelta);
    let settlingT = null;

    for (let i = this.history.length - 1; i >= 0; i--) {
      const point = this.history[i];
      if (Math.abs(point.output - target) > band) {
        settlingT = point.time;
        break;
      }
    }
    this.metrics.settlingTime = settlingT !== null ? settlingT : 0.0;

    const recentCount = Math.max(1, Math.floor(this.history.length * 0.1));
    const recentSamples = this.history.slice(-recentCount);
    const avgRecentOutput = recentSamples.reduce((sum, s) => sum + s.output, 0) / recentCount;
    this.metrics.steadyStateError = Math.abs(target - avgRecentOutput);

    this.evaluateGrade();

    return this.metrics;
  }

  evaluateGrade() {
    const os = this.metrics.overshoot ?? 0;
    const ess = this.metrics.steadyStateError ?? 0;
    const ts = this.metrics.settlingTime ?? 99;

    if (ess > 2.0) {
      this.metrics.grade = 'C-';
      this.metrics.feedback = 'High Steady-State Error. Increase Integral Gain (Ki) to eliminate offset.';
    } else if (os > 45) {
      this.metrics.grade = 'D';
      this.metrics.feedback = 'Severe Oscillation & High Overshoot! Increase Derivative Gain (Kd) or lower Kp.';
    } else if (os > 20) {
      this.metrics.grade = 'B';
      this.metrics.feedback = 'Underdamped System. Noticeable overshoot (~' + os.toFixed(1) + '%). Add Kd for damping.';
    } else if (os < 0.1 && ts > 3.0) {
      this.metrics.grade = 'B+';
      this.metrics.feedback = 'Overdamped / Sluggish. Zero overshoot but slow response time. Increase Kp.';
    } else if (os <= 10.0 && ess < 0.5) {
      this.metrics.grade = 'A+';
      this.metrics.feedback = 'Optimal Response! Fast rise time with minimal overshoot and zero steady-state error.';
    } else {
      this.metrics.grade = 'A';
      this.metrics.feedback = 'Well-tuned system with acceptable transient response metrics.';
    }
  }
}
