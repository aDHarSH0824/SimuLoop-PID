export const SimulationMode = {
  POSITION: 'POSITION',
  VELOCITY: 'VELOCITY'
};

export class MotorSimulator {
  constructor(options = {}) {
    this.mode = options.mode ?? SimulationMode.POSITION;
    this.J = options.J ?? 0.05;
    this.b = options.b ?? 0.15;
    this.Kt = options.Kt ?? 1.2;
    this.staticFriction = options.staticFriction ?? 0.05;

    this.angle = 0.0;
    this.velocity = 0.0;
    this.acceleration = 0.0;

    this.disturbanceTorque = 0.0;
    this.disturbanceTimer = 0.0;
    this.noiseEnabled = false;
    this.noiseMagnitude = 1.5;

    this.subSteps = 10;
  }

  setMode(mode) {
    if (Object.values(SimulationMode).includes(mode)) {
      this.mode = mode;
      this.reset();
    }
  }

  setParams(inertia, damping) {
    this.J = Math.max(0.005, inertia);
    this.b = Math.max(0.01, damping);
  }

  injectDisturbance(torque = 5.0, duration = 0.5) {
    this.disturbanceTorque = torque;
    this.disturbanceTimer = duration;
  }

  setSensorNoise(enabled, magnitude = 1.5) {
    this.noiseEnabled = enabled;
    this.noiseMagnitude = magnitude;
  }

  reset() {
    this.angle = 0.0;
    this.velocity = 0.0;
    this.acceleration = 0.0;
    this.disturbanceTorque = 0.0;
    this.disturbanceTimer = 0.0;
  }

  step(u, dt) {
    if (dt <= 0) return this.getMeasurement();

    let activeDisturbance = 0.0;
    if (this.disturbanceTimer > 0) {
      activeDisturbance = this.disturbanceTorque;
      this.disturbanceTimer -= dt;
      if (this.disturbanceTimer <= 0) {
        this.disturbanceTorque = 0.0;
      }
    } else {
      activeDisturbance = this.disturbanceTorque;
    }

    const subDt = dt / this.subSteps;

    for (let step = 0; step < this.subSteps; step++) {
      const motorTorque = this.Kt * u;

      let frictionTorque = 0.0;
      if (Math.abs(this.velocity) > 1e-4) {
        frictionTorque = this.staticFriction * Math.sign(this.velocity);
      } else if (Math.abs(motorTorque) > this.staticFriction) {
        frictionTorque = this.staticFriction * Math.sign(motorTorque);
      } else {
        frictionTorque = motorTorque;
      }

      const netTorque = motorTorque - (this.b * this.velocity) - frictionTorque - activeDisturbance;
      this.acceleration = netTorque / this.J;
      this.velocity += this.acceleration * subDt;

      const degVelocity = this.velocity * (180.0 / Math.PI);
      this.angle += degVelocity * subDt;
    }

    return this.getMeasurement();
  }

  getMeasurement() {
    let cleanVal = 0.0;
    let unit = '';

    if (this.mode === SimulationMode.POSITION) {
      cleanVal = this.angle;
      unit = '°';
    } else {
      cleanVal = this.velocity * (60.0 / (2 * Math.PI));
      unit = ' RPM';
    }

    let noisyVal = cleanVal;
    if (this.noiseEnabled) {
      const u1 = Math.random() || 1e-6;
      const u2 = Math.random() || 1e-6;
      const normRand = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      noisyVal += normRand * this.noiseMagnitude;
    }

    return {
      clean: cleanVal,
      noisy: noisyVal,
      angleDeg: this.angle,
      rpm: this.velocity * (60.0 / (2 * Math.PI)),
      radPerSec: this.velocity,
      acceleration: this.acceleration,
      unit: unit,
      hasDisturbance: this.disturbanceTimer > 0 || Math.abs(this.disturbanceTorque) > 0.1
    };
  }
}
