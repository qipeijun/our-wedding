/** 音乐状态以媒体事件为准，自动播放受限时仍可由宾客主动开启。 */
export type MusicState =
  | 'idle' // 尚未播放，或浏览器要求用户点击后播放。
  | 'loading' // 正在请求播放或等待缓冲，可主动取消。
  | 'playing' // 音频已实际开始播放。
  | 'paused' // 已暂停；返回前台不自动恢复。
  | 'error' // 资源加载或解码失败，可点击重试。

type MusicAudio = Pick<HTMLAudioElement, 'paused' | 'error' | 'play' | 'pause' | 'load' | 'addEventListener' | 'removeEventListener'>

/** 隔离播放请求与媒体事件，防止迟到的 Promise 覆盖用户刚做出的暂停选择。 */
export function createBackgroundMusic(audio: MusicAudio, onState: (state: MusicState) => void) {
  let state: MusicState = 'idle'
  let request = 0
  let wantsPlayback = false
  let disposed = false
  // 仅首播前允许页面操作唤起；播放成功、暂停或错误后交回音符按钮控制。
  let activationAllowed = true

  function update(next: MusicState) {
    state = next
    if (next === 'playing' || next === 'paused' || next === 'error') activationAllowed = false
    if (!disposed) onState(next)
  }
  function pause() {
    request += 1
    wantsPlayback = false
    audio.pause()
    update('paused')
  }
  /** 临时隐藏只取消未完成的首播；已播放或主动控制后仍遵循暂停规则。 */
  function suspend() {
    if (!activationAllowed) { pause(); return }
    request += 1
    wantsPlayback = false
    // 先回到待首播状态，避免 pause 事件将临时隐藏误记为主动暂停。
    update('idle')
    audio.pause()
  }
  async function play() {
    if (disposed || wantsPlayback) return
    // 网络或解码失败后，只有宾客再次点击才重新加载文件。
    if (state === 'error') audio.load()
    const current = ++request
    wantsPlayback = true
    update('loading')
    try {
      await audio.play()
      if (disposed || current !== request) return
      if (!audio.paused) update('playing')
    } catch (error) {
      if (disposed || current !== request) return
      wantsPlayback = false
      if (error instanceof DOMException && error.name === 'NotAllowedError') update('idle')
      else if (error instanceof DOMException && error.name === 'AbortError') update('paused')
      else update('error')
    }
  }
  function onPlaying() {
    if (!wantsPlayback || disposed) { audio.pause(); return }
    update('playing')
  }
  function onWaiting() {
    if (wantsPlayback) update('loading')
  }
  function onPause() {
    // 忽略上一轮 pause 的迟到事件；系统中断也必须回到真实的暂停状态。
    if (!audio.paused || state === 'error') return
    if (state === 'idle' && !wantsPlayback) return
    request += 1
    wantsPlayback = false
    update('paused')
  }
  function onError() {
    request += 1
    wantsPlayback = false
    update('error')
    audio.pause()
  }
  const events = { playing: onPlaying, waiting: onWaiting, pause: onPause, error: onError, ended: onPause }
  for (const [event, listener] of Object.entries(events)) audio.addEventListener(event, listener)

  return {
    play() {
      activationAllowed = false
      return play()
    },
    /** 页面加载或真实用户手势触发首播，不覆盖主动暂停与错误重试规则。 */
    activate() {
      if (activationAllowed) return play()
    },
    pause,
    suspend,
    dispose() {
      disposed = true
      request += 1
      wantsPlayback = false
      for (const [event, listener] of Object.entries(events)) audio.removeEventListener(event, listener)
      audio.pause()
    },
  }
}
