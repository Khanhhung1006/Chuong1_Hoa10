class AudioEngine {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  public muted = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  public unlock() {
    if (this.unlocked) return;
    this.init();
    if (!this.ctx) return;
    
    try {
      // Play a silent buffer to unlock the context on mobile
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
      
      this.ctx.resume().then(() => {
        this.unlocked = true;
      });
    } catch (e) {
      console.warn("Audio unlock failed", e);
    }
  }

  public playClick() {
    if (!this.ctx || !this.unlocked || this.muted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  public playSuccess() {
    if (!this.ctx || !this.unlocked || this.muted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
      osc.frequency.setValueAtTime(554.37, this.ctx.currentTime + 0.1); // C#5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.2); // E5
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch(e) {}
  }

  public playError() {
    if (!this.ctx || !this.unlocked || this.muted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.setValueAtTime(250, this.ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch(e){}
  }
}

export const audio = new AudioEngine();
