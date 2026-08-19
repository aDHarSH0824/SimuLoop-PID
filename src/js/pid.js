export class PIDController {
  constructor(options = {}) {
    this.kp = options.kp ?? 2.5;
    this.ki = options.ki ?? 0.8;
    this.kd = options.kd ?? 0.15;

    this.minOutput = options.minOutput ?? -24.0;
    this.maxOutput = options.maxOutput ?? 24.0;

    this.derivativeFilterTau = options.derivativeFilterTau ?? 0.02;
    this.derivativeOnMeasurement = options.derivativeOnMeasurement ?? true;

    this.integral = 0.0;
    this.prevError = 0.0;
    this.prevMeasurement = 0.0;
    this.prevFilteredDerivative = 0.0;

    this.pTerm = 0.0;
    this.iTerm = 0.0;
    this.dTerm = 0.0;
    this.output = 0.0;
  }

  setGains(kp, ki, kd) {
    this.kp = Math.max(0, kp);
    this.ki = Math.max(0, ki);
    this.kd = Math.max(0, kd);
  }

  setLimits(minOutput, maxOutput) {
    this.minOutput = minOutput;
    this.maxOutput = maxOutput;
  }

  reset() {
    this.integral = 0.0;
    this.prevError = 0.0;
    this.prevMeasurement = 0.0;
    this.prevFilteredDerivative = 0.0;
    this.pTerm = 0.0;
    this.iTerm = 0.0;
    this.dTerm = 0.0;
    this.output = 0.0;
  }

  compute(setpoint, measurement, dt) {
    if (dt <= 0) return this.output;

    const error = setpoint - measurement;
    this.pTerm = this.kp * error;

    let rawDerivative = 0.0;
    if (this.derivativeOnMeasurement) {
      rawDerivative = -(measurement - this.prevMeasurement) / dt;
    } else {
      rawDerivative = (error - this.prevError) / dt;
    }

    const alpha = this.derivativeFilterTau / (this.derivativeFilterTau + dt);
    const filteredDerivative = alpha * this.prevFilteredDerivative + (1 - alpha) * rawDerivative;
    this.prevFilteredDerivative = filteredDerivative;
    this.dTerm = this.kd * filteredDerivative;

    const potentialIntegral = this.integral + error * dt;
    const potentialITerm = this.ki * potentialIntegral;
    const unsaturatedOutput = this.pTerm + potentialITerm + this.dTerm;

    if (unsaturatedOutput > this.maxOutput) {
      if (error < 0) {
        this.integral = potentialIntegral;
      }
    } else if (unsaturatedOutput < this.minOutput) {
      if (error > 0) {
        this.integral = potentialIntegral;
      }
    } else {
      this.integral = potentialIntegral;
    }

    this.iTerm = this.ki * this.integral;
    const totalOutput = this.pTerm + this.iTerm + this.dTerm;
    this.output = Math.min(Math.max(totalOutput, this.minOutput), this.maxOutput);

    this.prevError = error;
    this.prevMeasurement = measurement;

    return this.output;
  }
}
