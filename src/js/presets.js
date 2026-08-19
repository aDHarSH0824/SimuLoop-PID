export const TuningPresets = {
  CRITICALLY_DAMPED: {
    id: 'critically_damped',
    name: '🎯 Critically Damped (Optimal)',
    kp: 3.5,
    ki: 1.2,
    kd: 0.25,
    description: 'Optimal balance: fast response with minimal overshoot (< 5%) and zero steady-state error.'
  },
  UNDERDAMPED: {
    id: 'underdamped',
    name: '⚡ Underdamped (Fast / Overshoot)',
    kp: 7.0,
    ki: 2.0,
    kd: 0.05,
    description: 'High proportional gain causes rapid rise time but pronounced overshoot (~25%) and ringing.'
  },
  OVERDAMPED: {
    id: 'overdamped',
    name: '🐢 Overdamped (Slow / Smooth)',
    kp: 1.2,
    ki: 0.3,
    kd: 0.4,
    description: 'Sluggish response with zero overshoot. Ideal for fragile payloads or sensitive positioning.'
  },
  UNSTABLE: {
    id: 'unstable',
    name: '⚠️ Unstable / Oscillating',
    kp: 12.0,
    ki: 4.5,
    kd: 0.0,
    description: 'Excessive gain without derivative damping leads to continuous growing oscillation.'
  },
  ZIEGLER_NICHOLS: {
    id: 'ziegler_nichols',
    name: '📐 Ziegler-Nichols Method',
    kp: 4.8,
    ki: 2.4,
    kd: 0.6,
    description: 'Classic closed-loop frequency response tuning (Kp = 0.6 Ku, Ki = 2 Kp / Tu, Kd = Kp Tu / 8).'
  }
};
