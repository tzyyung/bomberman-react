/**
 * 音頻系統 (AudioSystem)
 * 
 * 功能說明：
 * - 管理遊戲中的所有音效和背景音樂
 * - 提供音頻播放、停止和音量控制功能
 * - 支持多種音效類型（爆炸、收集道具等）
 * - 處理音頻上下文的初始化和錯誤處理
 * - 提供簡單的音效生成和播放機制
 * 
 * 主要方法：
 * - playSound: 播放音效
 * - playMusic: 播放背景音樂
 * - stopMusic: 停止背景音樂
 * - setVolume: 設置音量
 * - createTone: 創建音效
 * - loadSounds: 載入音效
 */

export class AudioSystem {
  private audioContext: AudioContext | null = null; // Web Audio API 上下文
  private sounds: Map<string, AudioBuffer> = new Map(); // 音效緩存
  private music: HTMLAudioElement | null = null; // 背景音樂元素
  private volume: number = 0.5; // 音量（0.0 - 1.0）

  /**
   * 音頻系統構造函數
   * 
   * 功能說明：
   * - 初始化音頻上下文
   * - 載入所有音效文件
   * - 設置默認音量
   */
  constructor() {
    this.initializeAudio();
  }

  /**
   * 初始化音頻系統
   * 
   * 功能說明：
   * - 創建 Web Audio API 上下文
   * - 載入所有音效文件
   * - 處理音頻初始化錯誤
   */
  private async initializeAudio(): Promise<void> {
    try {
      // 創建音頻上下文（支持 WebKit 前綴）
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // 載入所有音效
      await this.loadSounds();
    } catch (error) {
      // 音頻初始化失敗時輸出警告
      console.warn('音頻初始化失敗:', error);
    }
  }

  /**
   * 載入所有音效
   * 
   * 功能說明：
   * - 為每種音效類型創建音頻緩衝區
   * - 將音效存儲在 Map 中供後續播放
   * - 處理音效載入錯誤
   * - 支持多種遊戲音效類型
   */
  private async loadSounds(): Promise<void> {
    // 定義所有需要的音效類型
    const soundTypes = [
      'bomb_place',      // 放置炸彈音效
      'bomb_explode',    // 炸彈爆炸音效
      'player_death',    // 玩家死亡音效
      'powerup_collect', // 收集道具音效
      'game_over',       // 遊戲結束音效
      'menu_select',     // 菜單選擇音效
      'menu_confirm',    // 菜單確認音效
    ];

    // 為每種音效類型創建音頻緩衝區
    for (const soundType of soundTypes) {
      try {
        // 創建音效緩衝區
        const buffer = await this.createTone(soundType);
        // 將音效存儲在 Map 中
        this.sounds.set(soundType, buffer);
      } catch (error) {
        // 音效載入失敗時輸出警告
        console.warn(`載入音效 ${soundType} 失敗:`, error);
      }
    }
  }

  /**
   * 創建音效音調
   * 
   * 功能說明：
   * - 根據音效類型生成不同的音頻波形
   * - 使用 Web Audio API 創建音頻緩衝區
   * - 為不同音效設置不同的頻率和持續時間
   * - 生成簡單的正弦波音效
   * 
   * @param soundType 音效類型
   * @returns 音頻緩衝區
   */
  private async createTone(soundType: string): Promise<AudioBuffer> {
    // 檢查音頻上下文是否已初始化
    if (!this.audioContext) throw new Error('音頻上下文未初始化');

    // 創建音頻緩衝區（單聲道，0.5秒長度）
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
    // 獲取音頻數據數組
    const data = buffer.getChannelData(0);

    // 設置默認頻率和持續時間
    let frequency = 440; // 默認頻率（A4音符）
    let duration = 0.5;  // 默認持續時間（0.5秒）
    
    // 根據音效類型設置不同的參數
    switch (soundType) {
      case 'bomb_place':      // 放置炸彈：低頻短音
        frequency = 200;
        duration = 0.2;
        break;
      case 'bomb_explode':    // 炸彈爆炸：極低頻長音
        frequency = 100;
        duration = 0.8;
        break;
      case 'player_death':    // 玩家死亡：中低頻長音
        frequency = 150;
        duration = 1.0;
        break;
      case 'powerup_collect': // 收集道具：高頻短音
        frequency = 800;
        duration = 0.3;
        break;
      case 'game_over':       // 遊戲結束：中頻長音
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
    const bufferLength = this.audioContext!.sampleRate * duration;
    const actualBufferLength = Math.min(bufferLength, data.length);

    for (let i = 0; i < actualBufferLength; i++) {
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

