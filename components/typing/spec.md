# Typing 打字机组件规格说明

> 组件路径：`components/typing/`
> 负责人：David Kim（技术总监）、Maya Guo（动效总监）
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 用途

打字机组件用于模拟 Agent 发言时的逐字显示效果，营造「Agent 正在实时表达」的沉浸感。组件支持可调打字速度、光标动画、暂停/继续、跳过等交互，是议会大厅对话流、Agent 详情页、命运报告摘要等场景的核心文字展示组件。

典型使用场景：
- 议会大厅对话流中 Agent 发言逐字显示
- Agent 详情页中哲学信条的打字展示
- 命运报告摘要的逐字呈现
- 首页 Hero 文案的打字效果

---

## 2. Props 定义（TypeScript 接口）

```typescript
/**
 * 打字机组件 Props
 */
export interface TypingProps {
  /** 要逐字显示的完整文本 */
  text: string;
  /** 打字速度，单位 ms/字符，默认 50 */
  speed?: number;
  /** 打字速度变化模式 */
  speedMode?: TypingSpeedMode;
  /** 是否启用光标 */
  cursor?: boolean;
  /** 光标样式 */
  cursorChar?: string;
  /** 光标闪烁速度，单位 ms，默认 530 */
  cursorBlinkSpeed?: number;
  /** 是否自动开始 */
  autoStart?: boolean;
  /** 开始延迟，单位 ms，默认 0 */
  startDelay?: number;
  /** 打字完成后是否删除并重新开始（循环） */
  loop?: boolean;
  /** 循环间隔，单位 ms，默认 2000 */
  loopInterval?: number;
  /** 是否允许跳过（点击直接显示全部） */
  skippable?: boolean;
  /** 标点符号处停顿时长，单位 ms，默认 150 */
  punctuationPause?: number;
  /** 需要停顿的标点符号 */
  pausePunctuation?: string[];
  /** 打字开始回调 */
  onStart?: () => void;
  /** 打字完成回调 */
  onComplete?: (fullText: string) => void;
  /** 每字打出回调 */
  onType?: (currentText: string, index: number) => void;
  /** 跳过回调 */
  onSkip?: (fullText: string) => void;
  /** 自定义类名 */
  className?: string;
  /** 文本样式类名 */
  textClassName?: string;
}

/**
 * 打字速度模式
 */
export type TypingSpeedMode =
  | 'constant'   // 恒定速度
  | 'human'      // 模拟人类打字（随机变化）
  | 'accelerate' // 逐渐加速
  | 'decelerate';// 逐渐减速

/**
 * 打字机状态
 */
export type TypingStatus = 'idle' | 'typing' | 'paused' | 'done';
```

---

## 3. 状态定义

| 状态 | 说明 | 触发条件 |
|------|------|----------|
| `idle` | 未开始打字 | 组件初始化 / 重置 |
| `typing` | 正在逐字显示 | autoStart 或手动 start |
| `paused` | 暂停打字 | 用户暂停 / 组件失去焦点 |
| `done` | 打字完成 | 所有字符显示完毕 |

状态转换：
```
idle ──(start)──> typing
typing ──(pause)──> paused
paused ──(resume)──> typing
typing ──(complete)──> done
done ──(reset)──> idle
done ──(loop)──> idle ──> typing
```

---

## 4. 实现方案

### 4.1 核心实现（setInterval + 速度可调）

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

export function useTyping(props: TypingProps) {
  const {
    text,
    speed = 50,
    speedMode = 'constant',
    autoStart = true,
    startDelay = 0,
    loop = false,
    loopInterval = 2000,
    punctuationPause = 150,
    pausePunctuation = ['，', '。', '！', '？', '；', ',', '.', '!', '?', ';'],
  } = props;

  const [displayText, setDisplayText] = useState('');
  const [status, setStatus] = useState<TypingStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);

  /** 计算当前字符的打字延迟 */
  const getCharDelay = useCallback(
    (index: number, char: string): number => {
      let delay = speed;

      switch (speedMode) {
        case 'human':
          // 模拟人类打字：基础速度 ± 30% 随机
          delay = speed * (0.7 + Math.random() * 0.6);
          break;
        case 'accelerate':
          // 逐渐加速：从 1.5x 到 0.5x
          delay = speed * (1.5 - (index / text.length) * 1.0);
          break;
        case 'decelerate':
          // 逐渐减速：从 0.5x 到 1.5x
          delay = speed * (0.5 + (index / text.length) * 1.0);
          break;
        case 'constant':
        default:
          delay = speed;
      }

      // 标点符号处额外停顿
      if (pausePunctuation.includes(char)) {
        delay += punctuationPause;
      }

      return Math.max(delay, 10); // 最低 10ms
    },
    [speed, speedMode, text.length, punctuationPause, pausePunctuation]
  );

  /** 打字核心逻辑 */
  const typeNext = useCallback(() => {
    if (indexRef.current >= text.length) {
      setStatus('done');
      props.onComplete?.(text);
      if (loop) {
        timerRef.current = setTimeout(() => {
          indexRef.current = 0;
          setDisplayText('');
          setCurrentIndex(0);
          setStatus('typing');
          props.onStart?.();
          typeNext();
        }, loopInterval);
      }
      return;
    }

    const char = text[indexRef.current];
    const newText = text.substring(0, indexRef.current + 1);
    setDisplayText(newText);
    setCurrentIndex(indexRef.current);
    props.onType?.(newText, indexRef.current);

    indexRef.current += 1;
    const delay = getCharDelay(indexRef.current, char);
    timerRef.current = setTimeout(typeNext, delay);
  }, [text, loop, loopInterval, getCharDelay, props]);

  /** 开始打字 */
  const start = useCallback(() => {
    if (status === 'typing') return;
    setStatus('typing');
    props.onStart?.();
    timerRef.current = setTimeout(typeNext, startDelay);
  }, [status, startDelay, typeNext, props]);

  /** 暂停 */
  const pause = useCallback(() => {
    if (status !== 'typing') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('paused');
  }, [status]);

  /** 继续 */
  const resume = useCallback(() => {
    if (status !== 'paused') return;
    setStatus('typing');
    typeNext();
  }, [status, typeNext]);

  /** 跳过：直接显示全部文本 */
  const skip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayText(text);
    setCurrentIndex(text.length);
    indexRef.current = text.length;
    setStatus('done');
    props.onSkip?.(text);
    props.onComplete?.(text);
  }, [text, props]);

  /** 重置 */
  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    indexRef.current = 0;
    setDisplayText('');
    setCurrentIndex(0);
    setStatus('idle');
  }, []);

  // 自动开始
  useEffect(() => {
    if (autoStart && status === 'idle') {
      start();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoStart, text]);

  // 文本变化时重置
  useEffect(() => {
    reset();
    if (autoStart) {
      const timer = setTimeout(start, 100);
      return () => clearTimeout(timer);
    }
  }, [text]);

  return {
    displayText,
    status,
    currentIndex,
    progress: text.length > 0 ? currentIndex / text.length : 0,
    start,
    pause,
    resume,
    skip,
    reset,
  };
}
```

### 4.2 组件渲染

```typescript
export function Typing(props: TypingProps) {
  const { displayText, status, skip } = useTyping(props);
  const { cursor = true, cursorChar = '▊', skippable = true } = props;

  return (
    <span
      className={`typing-container ${props.className ?? ''}`}
      onClick={skippable && status === 'typing' ? skip : undefined}
      role="text"
      aria-label={props.text}
    >
      <span className={props.textClassName}>{displayText}</span>
      {cursor && (
        <span
          className={`typing-cursor ${status === 'typing' ? 'blinking' : ''}`}
          aria-hidden="true"
        >
          {cursorChar}
        </span>
      )}
    </span>
  );
}
```

---

## 5. 光标动画

### 5.1 闪烁动画（CSS）

```css
.typing-cursor {
  display: inline-block;
  margin-left: 2px;
  color: #FFD700;
  font-weight: bold;
}

.typing-cursor.blinking {
  animation: cursor-blink var(--blink-speed, 530ms) infinite;
}

@keyframes cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
```

### 5.2 光标样式选项

| 样式 | cursorChar | 说明 |
|------|-----------|------|
| 竖线 | `▊` | 默认，经典终端风格 |
| 下划线 | `_` | 复古打字机风格 |
| 方块 | `█` | 现代编辑器风格 |
| 竖线细 | `│` | 简约风格 |

### 5.3 状态相关光标行为

| 状态 | 光标行为 |
|------|----------|
| `idle` | 不显示光标 |
| `typing` | 闪烁（blink 动画） |
| `paused` | 持续显示不闪烁 |
| `done` | 渐隐消失（opacity → 0，0.5s） |

---

## 6. 速度模式详解

### 6.1 constant（恒定速度）
- 每个字符间隔固定为 `speed` ms
- 适合机械感、正式场景

### 6.2 human（模拟人类）
- 每个字符间隔在 `speed * 0.7` 到 `speed * 1.3` 之间随机
- 标点处额外停顿
- 适合 Agent 发言，增加真实感

### 6.3 accelerate（逐渐加速）
- 从 `speed * 1.5` 逐渐加速到 `speed * 0.5`
- 适合长文本，避免用户等待
- 营造「越说越流畅」的感觉

### 6.4 decelerate（逐渐减速）
- 从 `speed * 0.5` 逐渐减速到 `speed * 1.5`
- 适合强调结尾内容
- 营造「渐入沉思」的感觉

---

## 7. 交互设计

### 7.1 跳过
- `skippable` 为 true 时，点击文本区域直接显示全部
- 跳过后触发 `onSkip` 回调
- 跳过时光标渐隐
- 移动端支持点击跳过

### 7.2 暂停/继续
- 组件失去焦点时自动暂停（可选）
- 重新获得焦点时自动继续
- 提供命令式 API：`pause()` / `resume()`

### 7.3 循环模式
- `loop` 为 true 时，打字完成后等待 `loopInterval` ms 再重新开始
- 适合首页 Hero 文案轮播
- 循环前清空文本，有 0.3s 间隔

---

## 8. 标点停顿规则

默认停顿标点及停顿时长：

| 标点 | 停顿时长 | 说明 |
|------|----------|------|
| `。` `.` | 150ms | 句号，较长停顿 |
| `，` `,` | 80ms | 逗号，较短停顿 |
| `！` `!` | 200ms | 感叹号，强调停顿 |
| `？` `?` | 200ms | 问号，思考停顿 |
| `；` `;` | 120ms | 分号，中等停顿 |
| `：` `:` | 100ms | 冒号，引出停顿 |
| `\n` | 300ms | 换行，段落停顿 |

可通过 `pausePunctuation` 和 `punctuationPause` 自定义。

---

## 9. 性能优化

- 使用 `setTimeout` 链式调用而非 `setInterval`，支持变速
- `indexRef` 使用 ref 而非 state，避免每次打字触发重渲染
- 仅 `displayText` 和 `status` 使用 state，最小化渲染范围
- 组件卸载时清理所有定时器
- 长文本（> 1000 字符）自动切换为批量更新（每 3 字符更新一次）

---

## 10. 响应式设计

- 文本样式继承父容器，自动适配字号
- 移动端建议 `speed` 调快至 30ms（移动端阅读耐心较低）
- 光标大小使用 `em` 单位，随字号缩放

---

## 11. 无障碍设计

- 组件设置 `aria-label` 为完整文本，屏幕阅读器可读全文
- 打字过程中 `aria-live="off"`，避免逐字播报
- 打字完成后 `aria-live="polite"` 播报完成
- 尊重 `prefers-reduced-motion`：启用时直接显示全文，无打字效果

---

## 12. 依赖关系

- 无外部依赖，纯 React Hooks 实现
- 无内部依赖，为叶子组件
- 兼容 SSR（服务端渲染时直接显示全文）

---

## 13. 验收标准

- [ ] 文本逐字显示，速度可调
- [ ] 4 种速度模式正确切换
- [ ] 光标闪烁动画正常
- [ ] 标点处正确停顿
- [ ] 点击可跳过，直接显示全文
- [ ] 暂停/继续功能正常
- [ ] 循环模式正常工作
- [ ] 组件卸载时清理定时器，无内存泄漏
- [ ] `prefers-reduced-motion` 时直接显示全文
- [ ] SSR 环境下不报错
