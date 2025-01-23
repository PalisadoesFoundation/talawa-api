export function setupHeaderAnimations() {
  const steps = ['full', 'mobile', 'desktop', 'laptop', 'mobile2', 'full2'];
  const intervals = [1250, 1500, 1500, 1500, 1500, 1250];

  let i = 0;
  const timeouts = [];

  const logo = document.querySelector('.LogoAnimation');
  if (!logo) {
    console.error('Logo element with class "LogoAnimation" not found.');
    return; // Exit the function if the logo is not found
  }

  function animateStep() {
    const prev = steps[i];
    logo.classList.remove(prev);
    i = (i + 1) % steps.length;
    const current = steps[i];
    const timeout = intervals[i];
    logo.classList.add(current);

    timeouts.push(setTimeout(animateStep, timeout));
  }

  function onStartAnimation() {
    logo.classList.remove('init');
    animateStep();
  }

  function onVisibilityChange() {
    if (document.hidden) {
      timeouts.forEach(function (timeout) {
        clearTimeout(timeout);
      });
      timeouts.length = 0;
    } else {
      onStartAnimation();
    }
  }

  if (!document.hidden) {
    timeouts.push(setTimeout(onStartAnimation, 2000));
  }

  document.addEventListener('visibilitychange', onVisibilityChange, false);

  return function cleanup() {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
