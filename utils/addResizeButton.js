const addResizeButton = (overlay) => {
  const button = document.createElement('button');
  const p = document.createElement('p');
  const display = 'show/hide';
  p.innerText = display;

  button.appendChild(p);
  button.style.pointerEvents = 'auto';
  button.setAttribute('position', 'relative');
  button.setAttribute('top', 50);
  button.setAttribute('left', 20);

  button.onclick = () => {
    const svg = document.getElementById('audioForma-visual');
    if (!minimized) {
      svg.setAttribute('height', 0);
      svg.setAttribute('width', 0);
      p.innerText = 'expand';
      minimized = true;
    } else {
      const videoElement = document.querySelector('video');
      if (videoElement) {
        const { height, width } = videoElement.getBoundingClientRect();
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        p.innerText = 'hide';
      }
      minimized = false;
    }
  };

  overlay.appendChild(button);
};
