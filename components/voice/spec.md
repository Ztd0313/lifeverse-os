# Voice 语音组件规格说明

> 组件路径：`components/voice/`
> 负责人：David Kim（技术总监）、Marcus Lee（UX 设计师）
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 用途

语音组件为 LifeVerse 提供语音输入与语音输出能力，集成 Web Speech API，支持语音识别（Speech-to-Text）、语音合成（Text-to-Speech）以及录音波形可视化。组件让用户可以通过语音与 Agent 对话，同时 Agent 的发言也可以语音播报，打造多模态交互体验。

典型使用场景：
- 议会大厅中用户语音输入议题
- Agent 发言的语音播报
- Inner World 中用户口述情绪记录
- Reunion 中与 AI 亲人的语音对话
- 移动端语音快捷输入

---

## 2. Props 定义（TypeScript 接口）

```typescript
/**
 * 语音组件 Props
 */
export interface VoiceProps {
  /** 组件模式 */
  mode: VoiceMode;
  /** 语音识别配置 */
  recognitionConfig?: VoiceRecognitionConfig;
  /** 语音合成配置 */
  synthesisConfig?: VoiceSynthesisConfig;
  /** 是否显示波形可视化 */
  showWaveform?: boolean;
  /** 波形可视化类型 */
  waveformType?: WaveformType;
  /** 是否自动开始 */
  autoStart?: boolean;
  /** 最大录音时长，单位 s，默认 60 */
  maxDuration?: number;
  /** 语言代码，默认 zh-CN */
  lang?: string;
  /** 自定义类名 */
  className?: string;
  /** 识别结果回调（实时） */
  onRecognize?: (transcript: string, isFinal: boolean) => void;
  /** 识别完成回调 */
  onRecognizeComplete?: (transcript: string) => void;
  /** 合成开始回调 */
  onSynthesisStart?: () => void;
  /** 合成结束回调 */
  onSynthesisEnd?: () => void;
  /** 录音开始回调 */
  onRecordStart?: () => void;
  /** 录音结束回调 */
  onRecordEnd?: (audioBlob: Blob) => void;
  /** 错误回调 */
  onError?: (error: VoiceError) => void;
}

/**
 * 语音组件模式
 */
export type VoiceMode =
  | 'input'     // 语音输入模式（STT）
  | 'output'    // 语音输出模式（TTS）
  | 'dialogue'  // 对话模式（双向）
  | 'recorder'; // 纯录音模式

/**
 * 语音识别配置
 */
export interface VoiceRecognitionConfig {
  /** 是否连续识别 */
  continuous?: boolean;
  /** 是否返回中间结果 */
  interimResults?: boolean;
  /** 最大替代结果数 */
  maxAlternatives?: number;
  /** 识别语言 */
  lang?: string;
}

/**
 * 语音合成配置
 */
export interface VoiceSynthesisConfig {
  /** 语音速率 0.1-10，默认 1 */
  rate?: number;
  /** 音调 0-2，默认 1 */
  pitch?: number;
  /** 音量 0-1，默认 1 */
  volume?: number;
  /** 语音名称（指定发音人） */
  voice?: SpeechSynthesisVoice;
  /** Agent ID（用于匹配 Agent 专属音色） */
  agentId?: string;
}

/**
 * 波形可视化类型
 */
export type WaveformType =
  | 'bars'      // 条形波形
  | 'wave'      // 曲线波形
  | 'circle'    // 圆形波形
  | 'particle'; // 粒子波形

/**
 * 语音错误类型
 */
export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
}

export type VoiceErrorCode =
  | 'not-supported'      // 浏览器不支持
  | 'permission-denied'  // 麦克风权限被拒绝
  | 'no-speech'          // 未检测到语音
  | 'audio-capture'      // 音频采集错误
  | 'network'            // 网络错误
  | 'aborted'            // 用户中止
  | 'synthesis-failed';  // 合成失败
```

---

## 3. Web Speech API 集成

### 3.1 语音识别（Speech-to-Text）

```typescript
class VoiceRecognizer {
  private recognition: SpeechRecognition | null = null;
  private config: VoiceRecognitionConfig;

  constructor(config: VoiceRecognitionConfig = {}) {
    this.config = {
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
      lang: 'zh-CN',
      ...config,
    };
    this.init();
  }

  /** 初始化语音识别 */
  private init() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('浏览器不支持语音识别');
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous!;
    this.recognition.interimResults = this.config.interimResults!;
    this.recognition.maxAlternatives = this.config.maxAlternatives!;
    this.recognition.lang = this.config.lang!;
  }

  /** 开始识别 */
  start(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: VoiceError) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) return;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript;
      onResult(transcript, last.isFinal);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError({
        code: event.error as VoiceErrorCode,
        message: this.getErrorMessage(event.error),
      });
    };

    this.recognition.onend = onEnd;

    try {
      this.recognition.start();
    } catch (e) {
      // 已在识别中，忽略
    }
  }

  /** 停止识别 */
  stop() {
    this.recognition?.stop();
  }

  /** 中止识别 */
  abort() {
    this.recognition?.abort();
  }

  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许',
      'no-speech': '未检测到语音，请重试',
      'audio-capture': '音频采集失败，请检查麦克风',
      'network': '网络错误，语音识别需要网络连接',
      'aborted': '语音识别已中止',
    };
    return messages[code] || '语音识别发生未知错误';
  }
}
```

### 3.2 语音合成（Text-to-Speech）

```typescript
class VoiceSynthesizer {
  private utterance: SpeechSynthesisUtterance | null = null;
  private config: VoiceSynthesisConfig;

  constructor(config: VoiceSynthesisConfig = {}) {
    this.config = {
      rate: 1,
      pitch: 1,
      volume: 1,
      ...config,
    };
  }

  /** 获取可用的语音列表 */
  getVoices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis.getVoices();
  }

  /** 根据 Agent ID 匹配专属音色 */
  getAgentVoice(agentId: string): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();
    const agentVoiceMap: Record<string, string> = {
      'agent-philosopher': 'zh-CN male',   // 哲学家：成熟男声
      'agent-strategist': 'zh-CN male',    // 战略家：沉稳男声
      'agent-empath': 'zh-CN female',      // 共情者：温柔女声
      'agent-pragmatist': 'zh-CN male',    // 实用主义者：干练男声
      'agent-dreamer': 'zh-CN female',     // 梦想家：活泼女声
      'agent-guardian': 'zh-CN female',    // 守护者：慈祥女声
      'agent-chairman': 'zh-CN male',      // 主席：庄重男声
    };
    const target = agentVoiceMap[agentId];
    if (!target) return undefined;
    const [lang, gender] = target.split(' ');
    return voices.find((v) => v.lang === lang);
  }

  /** 朗读文本 */
  speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: VoiceError) => void
  ) {
    // 停止当前朗读
    this.stop();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = this.config.rate!;
    this.utterance.pitch = this.config.pitch!;
    this.utterance.volume = this.config.volume!;
    this.utterance.lang = 'zh-CN';

    // 匹配 Agent 音色
    if (this.config.agentId) {
      const voice = this.getAgentVoice(this.config.agentId);
      if (voice) this.utterance.voice = voice;
    } else if (this.config.voice) {
      this.utterance.voice = this.config.voice;
    }

    this.utterance.onstart = onStart ?? null;
    this.utterance.onend = onEnd ?? null;
    this.utterance.onerror = (e) => {
      onError?.({
        code: 'synthesis-failed',
        message: '语音合成失败',
      });
    };

    window.speechSynthesis.speak(this.utterance);
  }

  /** 暂停朗读 */
  pause() {
    window.speechSynthesis.pause();
  }

  /** 继续朗读 */
  resume() {
    window.speechSynthesis.resume();
  }

  /** 停止朗读 */
  stop() {
    window.speechSynthesis.cancel();
  }
}
```

### 3.3 录音功能（MediaRecorder API）

```typescript
class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  /** 开始录音 */
  async start(
    onAudioData?: (dataArray: Uint8Array) => void,
    onError?: (error: VoiceError) => void
  ) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.chunks = [];

      // 设置音频分析（用于波形可视化）
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // 波形数据回调
      if (onAudioData) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const update = () => {
          if (this.analyser && this.mediaRecorder?.state === 'recording') {
            this.analyser.getByteFrequencyData(dataArray);
            onAudioData(dataArray);
            requestAnimationFrame(update);
          }
        };
        update();
      }

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder.start();
    } catch (e) {
      onError?.({
        code: 'permission-denied',
        message: '麦克风权限被拒绝',
      });
    }
  }

  /** 停止录音 */
  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return;
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  /** 清理资源 */
  private cleanup() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
  }
}
```

---

## 4. 波形可视化

### 4.1 bars（条形波形）

```
  █     ███
  ██   ████   ██
  ████████████████
```

- 使用 Canvas 绘制
- 频率数据映射为竖条高度
- 条数固定为 32 或 64
- 颜色从底部到顶部渐变

### 4.2 wave（曲线波形）

```
  ╱╲    ╱╲╱╲
 ╱  ╲  ╱    ╲
─    ╲╱      ─
```

- 使用 Canvas 绘制时域波形
- 平滑的贝塞尔曲线
- 适合输出模式（播放中）

### 4.3 circle（圆形波形）

```
    ╱─╲
  ╱     ╲
 │  ●●●  │
  ╲     ╱
    ╲─╱
```

- 围绕中心点的环形频谱
- 适合录音按钮周围
- 视觉冲击力强

### 4.4 particle（粒子波形）

- 粒子随音频强度扩散
- 与全局 Particle 组件风格统一
- 适合 Agent 发言时

### 4.5 Canvas 渲染实现

```typescript
function drawWaveform(
  canvas: HTMLCanvasElement,
  dataArray: Uint8Array,
  type: WaveformType
) {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  switch (type) {
    case 'bars':
      drawBars(ctx, dataArray, width, height);
      break;
    case 'wave':
      drawWave(ctx, dataArray, width, height);
      break;
    case 'circle':
      drawCircle(ctx, dataArray, width, height);
      break;
    case 'particle':
      drawParticles(ctx, dataArray, width, height);
      break;
  }
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number
) {
  const barCount = 32;
  const barWidth = width / barCount;
  const step = Math.floor(data.length / barCount);
  for (let i = 0; i < barCount; i++) {
    const value = data[i * step] / 255;
    const barHeight = value * height;
    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = gradient;
    ctx.fillRect(i * barWidth + 2, height - barHeight, barWidth - 4, barHeight);
  }
}
```

---

## 5. 交互设计

### 5.1 语音输入交互
- 点击麦克风按钮开始录音
- 录音中按钮变为停止状态，周围显示波形
- 实时显示识别文本（interimResults）
- 识别完成后文本填入输入框
- 点击停止按钮结束录音

### 5.2 语音输出交互
- Agent 发言时自动播报（可配置关闭）
- 播报中显示波形动画
- 提供暂停/继续/停止控制
- 可调节播报速度

### 5.3 权限处理
- 首次使用时请求麦克风权限
- 权限被拒绝时显示友好提示
- 提供跳转到浏览器设置的指引
- 降级为纯文本输入

---

## 6. Agent 专属音色

| Agent | 音色描述 | rate | pitch | 性别 |
|-------|----------|------|-------|------|
| 哲学家 | 成熟沉稳 | 0.9 | 0.8 | 男 |
| 战略家 | 干练果断 | 1.0 | 0.9 | 男 |
| 共情者 | 温柔细腻 | 0.95 | 1.1 | 女 |
| 实用主义者 | 平实理性 | 1.0 | 1.0 | 男 |
| 梦想家 | 活泼明快 | 1.1 | 1.2 | 女 |
| 守护者 | 慈祥温暖 | 0.85 | 1.0 | 女 |
| 主席 | 庄重权威 | 0.9 | 0.85 | 男 |

---

## 7. 浏览器兼容性

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| 语音识别 (STT) | 支持 | 不支持 | 支持（14.1+） | 支持 |
| 语音合成 (TTS) | 支持 | 支持 | 支持 | 支持 |
| MediaRecorder | 支持 | 支持 | 支持（14.1+） | 支持 |
| AudioContext | 支持 | 支持 | 支持 | 支持 |

降级策略：
- 不支持 STT 时：隐藏语音输入按钮，仅保留文本输入
- 不支持 TTS 时：仅显示文字，不播报
- 不支持 MediaRecorder 时：使用 SpeechRecognition 直接识别，不保存录音

---

## 8. 响应式设计

| 断点 | 麦克风按钮 | 波形尺寸 |
|------|-----------|----------|
| `< 640px` | 48×48px，固定底部 | 宽度 100%，高度 60px |
| `640-1024px` | 40×40px | 宽度 300px，高度 80px |
| `> 1024px` | 40×40px | 宽度 400px，高度 100px |

---

## 9. 性能优化

- 波形可视化使用 `requestAnimationFrame`，组件卸载时取消
- AudioContext 在不使用时关闭，释放资源
- MediaStream tracks 在录音结束后立即停止
- 语音合成长文本分段朗读，避免一次性合成过长文本
- 使用 `useRef` 存储 API 实例，避免重渲染

---

## 10. 无障碍设计

- 麦克风按钮提供 `aria-label="语音输入"`
- 识别结果实时更新到 `aria-live="polite"` 区域
- 语音输出提供文字字幕（同步显示）
- 所有语音功能都有文本替代方案
- 不依赖音频作为唯一信息传递方式

---

## 11. 依赖关系

- 外部依赖：无（纯 Web API）
- 内部依赖：可选 `particle`（粒子波形模式）
- 兼容 SSR（服务端渲染时不初始化 Web Speech API）

---

## 12. 验收标准

- [ ] 语音识别正确识别中文
- [ ] 语音合成可播报中文文本
- [ ] 录音功能可保存音频
- [ ] 4 种波形可视化正确渲染
- [ ] Agent 专属音色匹配正确
- [ ] 麦克风权限处理友好
- [ ] 不支持的浏览器正确降级
- [ ] 组件卸载时清理所有资源
- [ ] 移动端 Safari 兼容
- [ ] SSR 环境下不报错
