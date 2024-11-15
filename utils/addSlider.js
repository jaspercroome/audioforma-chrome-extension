const addSlider = () => {
  const overlay = document.getElementById('audio-visualizer-overlay');
  if (overlay) {
    const slider = document.createElement('input');
    slider.style.pointerEvents = 'auto';
    slider.setAttribute('type', 'range');
    slider.setAttribute('position', 'relative');
    slider.setAttribute('top', 20);
    slider.setAttribute('left', 20);
    slider.setAttribute('width', 100);
    slider.setAttribute('default', 20);
    slider.onchange = (e) => {
      const opacity = e.target.value / 100;
      console.info(`[af] - updating opacity to ${opacity}`);
      overlay.style.background = d3.rgb(0, 0, 0, opacity);
    };
    overlay.appendChild(slider);
  }
};
