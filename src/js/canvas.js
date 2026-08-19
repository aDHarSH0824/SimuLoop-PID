export const VisualViewMode = {
  MOTOR_DISK: 'MOTOR_DISK',
  ROBOTIC_STAGE: 'ROBOTIC_STAGE'
};

export class HardwareCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas with ID '${canvasId}' not found.`);
    }
    this.ctx = this.canvas.getContext('2d');
    this.viewMode = VisualViewMode.MOTOR_DISK;
    this.particles = [];

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  setViewMode(mode) {
    if (Object.values(VisualViewMode).includes(mode)) {
      this.viewMode = mode;
    }
  }

  addDisturbanceSparks(x, y) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color: Math.random() > 0.5 ? '#ff4d4d' : '#ffb700'
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles() {
    this.ctx.save();
    this.particles.forEach(p => {
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  render(state, targetSetpoint, simMode) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (this.viewMode === VisualViewMode.MOTOR_DISK) {
      this.drawMotorDisk(state, targetSetpoint, simMode);
    } else {
      this.drawRoboticStage(state, targetSetpoint, simMode);
    }

    this.updateParticles();
    this.drawParticles();
  }

  drawMotorDisk(state, targetSetpoint, simMode) {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const outerRadius = Math.min(this.width, this.height) * 0.35;
    const innerRadius = outerRadius * 0.75;

    const angleRad = (state.angleDeg * Math.PI) / 180.0;
    const targetRad = simMode === 'POSITION' ? (targetSetpoint * Math.PI) / 180.0 : 0;

    if (simMode === 'POSITION') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(targetRad);

      ctx.strokeStyle = '#ff4d4d';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -outerRadius - 15);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ff4d4d';
      ctx.shadowColor = '#ff4d4d';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -outerRadius - 15);
      ctx.lineTo(-8, -outerRadius - 28);
      ctx.lineTo(8, -outerRadius - 28);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = state.hasDisturbance ? 25 : 10;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius + 8, 0, Math.PI * 2);
    ctx.stroke();

    const grad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.5, '#334155');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    const ticks = 36;
    for (let i = 0; i < ticks; i++) {
      const a = (i * Math.PI * 2) / ticks;
      const isMajor = i % 9 === 0;
      const tickLength = isMajor ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (outerRadius - tickLength), Math.sin(a) * (outerRadius - tickLength));
      ctx.lineTo(Math.cos(a) * outerRadius, Math.sin(a) * outerRadius);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);

    if (Math.abs(state.rpm) > 200) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius - 10, 0, Math.PI * 1.5);
      ctx.stroke();
    }

    const rotorGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, innerRadius);
    rotorGrad.addColorStop(0, '#00f0ff');
    rotorGrad.addColorStop(0.4, '#0284c7');
    rotorGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = rotorGrad;
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(0, -innerRadius + 5);
    ctx.lineTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (state.noiseEnabled) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius + 20 + Math.random() * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (state.hasDisturbance) {
      this.addDisturbanceSparks(cx + outerRadius * Math.cos(angleRad), cy + outerRadius * Math.sin(angleRad));

      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(cx + outerRadius + 50, cy - 20);
      ctx.lineTo(cx + outerRadius + 10, cy - 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + outerRadius + 10, cy - 20);
      ctx.lineTo(cx + outerRadius + 22, cy - 28);
      ctx.lineTo(cx + outerRadius + 22, cy - 12);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('⚡ LOAD IMPACT', cx + outerRadius + 15, cy - 35);
      ctx.restore();
    }

    ctx.save();
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Position: ${state.angleDeg.toFixed(1)}°`, 15, 25);
    ctx.fillText(`Speed: ${state.rpm.toFixed(0)} RPM`, 15, 45);
    ctx.restore();
  }

  drawRoboticStage(state, targetSetpoint, simMode) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cy = h / 2;

    const trackPadding = 50;
    const trackWidth = w - trackPadding * 2;
    const carriageWidth = 70;
    const carriageHeight = 45;

    let normPos = 0;
    let normTarget = 0;

    if (simMode === 'POSITION') {
      const minAng = 0;
      const maxAng = 360;
      normPos = Math.min(Math.max((state.angleDeg - minAng) / (maxAng - minAng), 0), 1);
      normTarget = Math.min(Math.max((targetSetpoint - minAng) / (maxAng - minAng), 0), 1);
    } else {
      const maxRpm = 1500;
      normPos = Math.min(Math.max((state.rpm + maxRpm) / (2 * maxRpm), 0), 1);
      normTarget = Math.min(Math.max((targetSetpoint + maxRpm) / (2 * maxRpm), 0), 1);
    }

    const carriageX = trackPadding + normPos * (trackWidth - carriageWidth);
    const targetX = trackPadding + normTarget * (trackWidth - carriageWidth) + carriageWidth / 2;

    ctx.save();
    ctx.strokeStyle = '#ff4d4d';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(targetX, cy - 65);
    ctx.lineTo(targetX, cy + 65);
    ctx.stroke();

    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`TARGET: ${targetSetpoint.toFixed(1)}`, targetX - 35, cy - 72);
    ctx.restore();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(trackPadding, cy - 12, trackWidth, 24);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(trackPadding, cy - 12, trackWidth, 24);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    for (let x = trackPadding + 10; x <= trackPadding + trackWidth - 10; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 8);
      ctx.lineTo(x, cy + 8);
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;

    const carriageGrad = ctx.createLinearGradient(carriageX, cy - carriageHeight / 2, carriageX, cy + carriageHeight / 2);
    carriageGrad.addColorStop(0, '#0284c7');
    carriageGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = carriageGrad;
    ctx.fillRect(carriageX, cy - carriageHeight / 2, carriageWidth, carriageHeight);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(carriageX, cy - carriageHeight / 2, carriageWidth, carriageHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(carriageX + 15, cy - carriageHeight / 2 - 10, carriageWidth - 30, 10);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(carriageX + 15, cy - carriageHeight / 2 - 10, carriageWidth - 30, 10);

    ctx.restore();

    if (state.hasDisturbance) {
      this.addDisturbanceSparks(carriageX + carriageWidth / 2, cy);

      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('⚡ FRICTION / LOAD IMPACT', carriageX - 40, cy + 45);
      ctx.restore();
    }

    ctx.save();
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Morphle RoboTome Precision Stage Visualizer', 15, 25);
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Stage Offset: ${(normPos * 100).toFixed(1)}% | Velocity: ${state.rpm.toFixed(0)} RPM`, 15, 45);
    ctx.restore();
  }
}
