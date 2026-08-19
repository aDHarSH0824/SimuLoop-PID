# SimuLoop-PID: Interactive Web-Based PID Controller & Motor Simulator

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-00f0ff?style=for-the-badge&logo=github)](https://aDHarSH0824.github.io/SimuLoop-PID/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/aDHarSH0824/SimuLoop-PID)

SimuLoop-PID is a real-time web-based simulation environment for studying closed-loop feedback control systems, electromechanical motor dynamics, and sub-micron positioning stages.

🌐 **Live Web Application**: [https://aDHarSH0824.github.io/SimuLoop-PID/](https://aDHarSH0824.github.io/SimuLoop-PID/)

---

## Features

- **Dual Control Modes**: Position Control ($0^\circ \text{ to } 360^\circ$) and Velocity Speed Control (RPM).
- **Discrete-Time PID Engine**: Implements Proportional, Integral (with anti-windup clamping), and Derivative terms (with low-pass filtering and derivative-on-measurement).
- **2D Hardware Animation Canvas**: HTML5 Canvas rendering of an optical encoder motor disk and a precision linear micro-stage (Morphle RoboTome context).
- **Real-Time Oscilloscope Plotting**: Multi-trace Chart.js graph plotting setpoint $r(t)$, actual output $y(t)$, error $e(t)$, and control signal voltage $u(t)$.
- **Performance Metrics**: Dynamic evaluation of Rise Time ($t_r$), % Overshoot, Settling Time ($t_s$), and Steady-State Error ($e_{ss}$).
- **Hardware Experiments**: Inject load torque disturbances, toggle sensor noise, and run step-response tests.
- **Control Systems Reference Guide**: Integrated interview guide with equations, Ziegler-Nichols tuning rules, anti-windup math, and real-world medical scanner context.

---

## Tech Stack

- **Frontend**: HTML5, CSS3 (Dark Obsidian Theme), Modern ES6 JavaScript
- **Plotting**: Chart.js v4
- **Build Tool**: Vite

---

## Getting Started

### Installation

```bash
git clone https://github.com/aDHarSH0824/SimuLoop-PID.git
cd SimuLoop-PID
npm install
```

### Development Server

```bash
npm run dev
```

Open `http://localhost:3000/` in your browser.

### Deploy to GitHub Pages

```bash
npm run deploy
```
