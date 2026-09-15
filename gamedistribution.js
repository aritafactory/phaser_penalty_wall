(function initializeGameDistribution(windowObject, documentObject) {
  if (!windowObject || !documentObject) return;

  const meta = documentObject.querySelector('meta[name="gamedistribution-game-id"]');
  const gameId = windowObject.GD_GAME_ID || meta?.content || '';
  const previousOptions = windowObject.GD_OPTIONS || {};
  const previousOnEvent = previousOptions.onEvent;

  windowObject.GD_OPTIONS = {
    ...previousOptions,
    gameId,
    onEvent(event) {
      if (typeof previousOnEvent === 'function') previousOnEvent(event);
      windowObject.dispatchEvent(new CustomEvent('gamedistributionevent', { detail: event }));
    },
  };

  if (documentObject.getElementById('gamedistribution-jssdk')) return;
  const firstScript = documentObject.getElementsByTagName('script')[0];
  const sdkScript = documentObject.createElement('script');
  sdkScript.id = 'gamedistribution-jssdk';
  sdkScript.src = 'https://html5.api.gamedistribution.com/main.min.js';
  sdkScript.async = true;
  firstScript.parentNode.insertBefore(sdkScript, firstScript);
}(window, document));
