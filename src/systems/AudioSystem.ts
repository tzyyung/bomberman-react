/**
 * 音頻系統
 * 負責音效和背景音樂管理
 */

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private music: HTMLAudioElement | null = null;
  private volume: number = 0.5;

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.loadSounds();
    } catch (error) {
      console.warn('音頻初始化失敗:', error);
    }
  }

  private async loadSounds(): Promise<void> {
    // 創建簡單的音效（實際項目中會載入真實音頻文件）
    const soundTypes = [
      'bomb_place',
      'bomb_explode',
      'player_death',
      'powerup_collect',
      'game_over',
      'menu_select',
      'menu_confirm',
    ];

    for (const soundType of soundTypes) {
      try {
        const buffer = await this.createTone(soundType);
        this.sounds.set(soundType, buffer);
      } catch (error) {
        console.warn(`載入音效 ${soundType} 失敗:`, error);
      }
    }
  }

  private async createTone(soundType: string): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('音頻上下文未初始化');

    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    let frequency = 440;

    let duration = 0.5;
    
    switch (soundType) {
      case 'bomb_place':
        frequency = 200;
        duration = 0.2;
        break;
      case 'bomb_explode':
        frequency = 100;
        duration = 0.8;
        break;
      case 'player_death':
        frequency = 150;
        duration = 1.0;
        break;
      case 'powerup_collect':
        frequency = 800;
        duration = 0.3;
        break;
      case 'game_over':
        frequency = 300;
        duration = 2.0;
        break;
      case 'menu_select':
        frequency = 600;
        duration = 0.1;
        break;
      case 'menu_confirm':
        frequency = 400;
        duration = 0.3;
        break;
    }
    
    // 使用 duration 變量來計算緩衝區長度
    // const bufferLength = this.audioContext!.sampleRate * duration;

    for (let i = 0; i < data.length; i++) {
      const t = i / this.audioContext.sampleRate;
      const envelope = Math.exp(-t * 3); // 指數衰減
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return buffer;
  }

  public playSound(soundName: string): void {
    if (!this.audioContext || !this.sounds.has(soundName)) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = this.sounds.get(soundName)!;
      gainNode.gain.value = this.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn(`播放音效 ${soundName} 失敗:`, error);
    }
  }

  public playMusic(musicName: string): void {
    this.stopMusic();
    
    // 創建簡單的背景音樂（實際項目中會載入真實音樂文件）
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 10); // 播放10秒
  }

  public stopMusic(): void {
    if (this.music) {
      this.music.pause();
      this.music = null;
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.volume;
  }

  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

