
/**
 * Advanced Pitch Detection & Universal Audio Service
 */
export class AudioProcessor {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private buffer: Float32Array = new Float32Array(2048);
  private osc: OscillatorNode | null = null;

  async init() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crucial para navegadores móviles que bloquean audio hasta interacción
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      return true;
    } catch (e) {
      console.error('Microphone access denied', e);
      return false;
    }
  }

  stop() {
    if (this.stream) this.stream.getTracks().forEach(track => track.stop());
    if (this.audioCtx) this.audioCtx.close();
  }

  playReferenceTone(freq: number) {
    if (!this.audioCtx) return;
    this.stopReferenceTone();
    this.osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    this.osc.type = 'sine';
    this.osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.5);
    this.osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    this.osc.start();
    this.osc.stop(this.audioCtx.currentTime + 1.6);
  }

  stopReferenceTone() {
    if (this.osc) {
      try { this.osc.stop(); } catch(e) {}
      this.osc = null;
    }
  }

  getFrequency(): number {
    if (!this.analyser || !this.audioCtx) return 0;
    this.analyser.getFloatTimeDomainData(this.buffer);
    const freq = this.autoCorrelate(this.buffer, this.audioCtx.sampleRate);
    // Rango profesional de batería: 40Hz a 800Hz
    return freq > 40 && freq < 800 ? freq : 0;
  }

  private autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    let size = buffer.length;
    let rms = 0;
    for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / size);
    
    // Noise gate para evitar ruidos de fondo en vivo
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = size - 1, thres = 0.2;
    for (let i = 0; i < size / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < size / 2; i++) if (Math.abs(buffer[size - i]) < thres) { r2 = size - i; break; }

    const trimmedBuffer = buffer.slice(r1, r2);
    size = trimmedBuffer.length;
    const c = new Float32Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) c[i] = c[i] + trimmedBuffer[j] * trimmedBuffer[j + i];
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    let T0 = maxpos;
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
  }
}
