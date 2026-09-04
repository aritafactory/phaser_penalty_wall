(function initializeViewportScaling(globalScope) {
  const DESIGN_WIDTH = 1920;
  const DESIGN_HEIGHT = 1080;

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

    rootStyle.setProperty('--viewport-scale', String(metrics.scale));
    rootStyle.setProperty('--viewport-offset-x', `${metrics.offsetX}px`);
    rootStyle.setProperty('--viewport-offset-y', `${metrics.offsetY}px`);
    rootStyle.setProperty('--design-width', `${DESIGN_WIDTH}px`);
    rootStyle.setProperty('--design-height', `${DESIGN_HEIGHT}px`);
    return metrics;
  }

  const api = { DESIGN_WIDTH, DESIGN_HEIGHT, calculateViewportScale, applyViewportScale };
  globalScope.viewportScaling = api;

  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (globalScope.document) {
    let animationFrame = 0;
    const scheduleScale = () => {
      globalScope.cancelAnimationFrame?.(animationFrame);
      animationFrame = globalScope.requestAnimationFrame?.(applyViewportScale) || 0;
      if (!animationFrame) applyViewportScale();
    };
    applyViewportScale();
    globalScope.addEventListener?.('resize', scheduleScale, { passive: true });
    globalScope.addEventListener?.('orientationchange', scheduleScale, { passive: true });
    globalScope.visualViewport?.addEventListener?.('resize', scheduleScale, { passive: true });
  }
}(typeof window !== 'undefined' ? window : globalThis));

