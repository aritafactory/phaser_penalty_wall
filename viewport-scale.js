(function initializeViewportScaling(globalScope) {
  const DESIGN_WIDTH = 1920;
  const DESIGN_HEIGHT = 1080;
  const ORIENTATION_EVENT = 'gameorientationblockchange';
  let orientationBlocked = false;

  function isMobileDevice() {
    if (globalScope.navigator?.userAgentData?.mobile) return true;
    if (/Android|webOS|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(globalScope.navigator?.userAgent || '')) return true;
    return Boolean(globalScope.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches);
  }

  function shouldBlockPortrait(viewportWidth, viewportHeight, mobile = isMobileDevice()) {
    return Boolean(mobile && Number(viewportHeight) > Number(viewportWidth));
  }

  function calculateViewportScale(viewportWidth, viewportHeight) {
    const width = Math.max(1, Number(viewportWidth) || DESIGN_WIDTH);
    const height = Math.max(1, Number(viewportHeight) || DESIGN_HEIGHT);
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);

    return {
      scale,
      offsetX: (width - DESIGN_WIDTH * scale) / 2,
      offsetY: (height - DESIGN_HEIGHT * scale) / 2,
      designWidth: DESIGN_WIDTH,
      designHeight: DESIGN_HEIGHT,
    };
  }

  function applyViewportScale() {
    const viewport = globalScope.visualViewport;
    const width = viewport?.width || globalScope.innerWidth || DESIGN_WIDTH;
    const height = viewport?.height || globalScope.innerHeight || DESIGN_HEIGHT;
    const metrics = calculateViewportScale(width, height);
    const rootStyle = globalScope.document?.documentElement?.style;
    if (!rootStyle) return metrics;
    rootStyle.setProperty('--overlay-width', `${width / metrics.scale}px`);
    rootStyle.setProperty('--overlay-height', `${height / metrics.scale}px`);
    rootStyle.setProperty('--overlay-left', `${-metrics.offsetX / metrics.scale}px`);
    rootStyle.setProperty('--overlay-top', `${-metrics.offsetY / metrics.scale}px`);

    rootStyle.setProperty('--viewport-scale', String(metrics.scale));
    rootStyle.setProperty('--viewport-offset-x', `${metrics.offsetX}px`);
    rootStyle.setProperty('--viewport-offset-y', `${metrics.offsetY}px`);
    rootStyle.setProperty('--design-width', `${DESIGN_WIDTH}px`);
    rootStyle.setProperty('--design-height', `${DESIGN_HEIGHT}px`);
    return metrics;
  }

  function updateOrientationBlock() {
    const viewport = globalScope.visualViewport;
    const width = viewport?.width || globalScope.innerWidth || DESIGN_WIDTH;
    const height = viewport?.height || globalScope.innerHeight || DESIGN_HEIGHT;
    const blocked = shouldBlockPortrait(width, height);
    const changed = blocked !== orientationBlocked;
    orientationBlocked = blocked;
    globalScope.document?.documentElement?.classList?.toggle('portrait-device-blocked', blocked);
    globalScope.document?.getElementById?.('rotateDeviceOverlay')?.toggleAttribute('hidden', !blocked);

    if (changed) {
      globalScope.dispatchEvent?.(new globalScope.CustomEvent(ORIENTATION_EVENT, {
        detail: { blocked },
      }));
    }
    return blocked;
  }

  function createOrientationOverlay() {
    if (!globalScope.document?.body || globalScope.document.getElementById('rotateDeviceOverlay')) return;
    const overlay = globalScope.document.createElement('div');
    overlay.id = 'rotateDeviceOverlay';
    overlay.className = 'rotate-device-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'rotateDeviceTitle');
    overlay.innerHTML = '<div class="rotate-device-content"><div class="rotate-device-icon" aria-hidden="true"><span>↻</span></div><h1 id="rotateDeviceTitle">Rotate your device</h1><p>This game is best played in landscape orientation.</p></div>';
    globalScope.document.body.appendChild(overlay);
    updateOrientationBlock();
  }

  function blockGameInputWhilePortrait(event) {
    if (!orientationBlocked) return;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
  }

  const api = {
    DESIGN_WIDTH,
    DESIGN_HEIGHT,
    ORIENTATION_EVENT,
    calculateViewportScale,
    applyViewportScale,
    isMobileDevice,
    shouldBlockPortrait,
    updateOrientationBlock,
    isOrientationBlocked: () => orientationBlocked,
  };
  globalScope.viewportScaling = api;

  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (globalScope.document) {
    let animationFrame = 0;
    const scheduleScale = () => {
      globalScope.cancelAnimationFrame?.(animationFrame);
      const update = () => {
        applyViewportScale();
        updateOrientationBlock();
      };
      animationFrame = globalScope.requestAnimationFrame?.(update) || 0;
      if (!animationFrame) update();
    };
    applyViewportScale();
    if (globalScope.document.body) createOrientationOverlay();
    else globalScope.document.addEventListener?.('DOMContentLoaded', createOrientationOverlay, { once: true });
    globalScope.addEventListener?.('resize', scheduleScale, { passive: true });
    globalScope.addEventListener?.('orientationchange', scheduleScale, { passive: true });
    globalScope.visualViewport?.addEventListener?.('resize', scheduleScale, { passive: true });
    ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click', 'keydown'].forEach((eventName) => {
      globalScope.addEventListener?.(eventName, blockGameInputWhilePortrait, { capture: true, passive: false });
    });
  }
}(typeof window !== 'undefined' ? window : globalThis));
