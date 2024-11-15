const draw = ({ keyOctaveAmplitudes, videoElement, overlay }) => {
  const {
    clientWidth: width,
    clientHeight: height,
    offsetLeft: left,
  } = videoElement;
  overlay.setAttribute('width', width);
  overlay.setAttribute('height', height);
  const svgNS = 'http://www.w3.org/2000/svg';
  const yOffset = 120;
  const adjustedHeight = height - yOffset;
  // Keep a reference to the SVG element
  let svg = overlay.querySelector('svg');
  if (!svg) {
    svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', adjustedHeight);
    svg.setAttribute('y', yOffset);
    svg.setAttribute('x', left);
    svg.setAttribute('transform', 'translate(0, 50)');
    svg.setAttribute('overflow', 'visible');
    svg.setAttribute('id', 'audioForma-visual');
    overlay.appendChild(svg);
  }
  // Clear only the visualization elements, not the path and points
  const visualElements = svg.querySelectorAll('line, rect');
  visualElements.forEach((el) => el.remove());

  const constrainingDimension = Math.min(width, adjustedHeight);
  const amplitudeScale = d3
    .scaleLinear()
    .domain([0, 10000])
    .range([1, constrainingDimension / 10]);
  amplitudeScale.clamp();

  const radius = constrainingDimension / 15;

  const getYMove = (adjustedHeight, octaveIndex) => {
    return adjustedHeight / 3 + octaveIndex * 10;
  };

  const getCoords = (noteOctave) => {
    const note = noteOctave.includes('#')
      ? noteOctave.slice(0, 2)
      : noteOctave.slice(0, 1);
    const octave = Number(noteOctave.split('').pop());
    const octaveIndex = octaves.indexOf(octave);
    const degrees = noteAngles[note] - 90;

    const xMove = width / 2;
    const yMove = getYMove(adjustedHeight, octaveIndex);

    const angle = (degrees / 360) * 2 * Math.PI;
    const x = Math.cos(angle) * (radius * 5) + xMove;
    const y = Math.sin(angle) * (radius * 5) + yMove;
    return [x, y, degrees];
  };

  if (keyOctaveAmplitudes) {
    const amplitudesSorted = Object.entries(keyOctaveAmplitudes).sort(
      (a, b) => b[1] - a[1],
    );
    if (amplitudesSorted.length > 0) {
      const strongestNote = amplitudesSorted[0];
      const [x, y, degrees] = getCoords(strongestNote[0] ?? '');

      const lastCoords = strongestNoteCoords[strongestNoteCoords.length - 1];
      const isSame = x === lastCoords[0] && y === lastCoords[1];

      // Use D3 to generate a smooth path
      const lineGenerator = d3
        .line()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(
          strongestNote[1] > buffer * 0.75
            ? d3.curveLinearClosed
            : d3.curveBasisClosed,
        );

      if (x && y && !isSame) {
        // Add the new coordinates to the path data array
        pathData.push([x, y]);
        // Limit the path data to the last 20 points
        pathData.splice(0, pathData.length - 20);
        requestAnimationFrame(renderPath);

        function renderPath() {
          const svgNS = 'http://www.w3.org/2000/svg';
          let path = svg.querySelector('.soundPath');

          if (!path) {
            path = document.createElementNS(svgNS, 'path');
            path.setAttribute('class', 'soundPath');
            path.setAttribute('stroke-width', 2);
            path.setAttribute('fill-opacity', 0.5);
            svg.appendChild(path);
          }

          const color = d3.hsl(degrees, 0.7, 0.5);

          // Use D3.js's transition system to smoothly interpolate the path data
          d3.select(path)
            .transition()
            .duration(100)
            .attrTween('d', function () {
              return d3.interpolate(
                path.getAttribute('d') || '',
                lineGenerator(pathData),
              );
            })
            .attrTween('fill', () => {
              return d3.interpolate(
                path.getAttribute('fill') || '#ff5200',
                color,
              );
            })
            .attrTween('stroke', () => {
              return d3.interpolate(
                path.getAttribute('fill') || '#ff5200',
                color,
              );
            })
            .on('end', () => {
              // Schedule the next render on the next animation frame
              requestAnimationFrame(renderPath);
            });
        }

        // Update points
        const points = Array.from(svg.querySelectorAll('.soundPoint'));

        // Remove excess points
        while (points.length > pathData.length) {
          points.pop().remove();
        }

        // Update or create points
        pathData.forEach(([px, py], i) => {
          let point = points[i];
          if (!point) {
            point = document.createElementNS(svgNS, 'circle');
            point.setAttribute('fill', 'white');
            point.setAttribute('r', 2);
            point.setAttribute('class', 'soundPoint');
            svg.appendChild(point);
          }

          point.style.transition = 'cx 100ms ease-out, cy 100ms ease-out';
          point.setAttribute('cx', px);
          point.setAttribute('cy', py);
        });
      }
      octaves.forEach((octave) => {
        const octaveIndex = octaves.indexOf(octave);
        const translateValue = `${width / 2}, ${getYMove(
          adjustedHeight,
          octaveIndex,
        )}`;
        const probablyPercussion = octave > 6;
        const noteNameValues = Object.values(noteNames);
        noteNameValues.forEach((note, index) => {
          const degrees = noteAngles[note] - 90;
          const angle = (degrees / 360) * 2 * Math.PI;
          const x = Math.cos(angle) * (radius * 6);
          const y = Math.sin(angle) * (radius * 6);

          const amplitude = keyOctaveAmplitudes[`${note}${octave}`] || 0;

          const color = d3.hsl(degrees, 0.7, 0.5);
          const rotateValue = noteAngles[note];
          if (probablyPercussion) {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', x - Math.min(amplitude, 100));
            line.setAttribute('x2', x + Math.min(amplitude, 100));
            line.setAttribute('y1', y);
            line.setAttribute('y2', y);
            line.setAttribute('stroke-width', 2);
            line.setAttribute('stroke', 'white');
            line.setAttribute('opacity', 0.6);
            line.setAttribute(
              'transform',
              `
                                translate(${translateValue})
                                rotate(${rotateValue} ${x} ${y})
                              `,
            );
            svg.append(line);
          } else {
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', x - Math.min(amplitudeScale(amplitude), 50));
            rect.setAttribute('y', y);
            rect.setAttribute(
              'width',
              Math.min(amplitudeScale(amplitude) * 2, 100),
            );
            rect.setAttribute('height', 2 * (10 - octave));
            rect.setAttribute('fill', color.toString());
            rect.setAttribute('opacity', 0.9);
            rect.setAttribute('rx', Math.min(4, amplitudeScale(amplitude) / 2));
            rect.setAttribute(
              'transform',
              `
              translate(${translateValue})
              rotate(${rotateValue} ${x} ${y})
            `,
            );
            svg.append(rect);
          }
        });
      });
    }
  }

  overlay.appendChild(svg);
};
