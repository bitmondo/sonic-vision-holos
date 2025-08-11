 let video, osc, socket;
let previousFrame;

// Variables para mostrar datos en pantalla
let currentFreq = 0;
let currentWave = 'sine';
let currentAmp = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Cámara
  video = createCapture(VIDEO);
  video.size(160, 120);
  video.hide();

  // Oscilador
  osc = new p5.Oscillator('sine');
  osc.start();
  osc.amp(0);

  // WebSocket
  socket = io();

  // Recibir datos de otros usuarios
  socket.on('videoData', data => {
    let remoteOsc = new p5.Oscillator(data.wave);
    remoteOsc.freq(data.freq);
    remoteOsc.start();
    remoteOsc.amp(data.amp * 0.5, 0.2);
    setTimeout(() => remoteOsc.stop(), 300);

    // Log de datos remotos
    console.log(`Remoto: ${data.freq}Hz, onda ${data.wave}, amp ${data.amp}`);
  });
}

function draw() {
  image(video, 0, 0, width, height);

  video.loadPixels();
  let brilloTotal = 0;
  let rTotal = 0, gTotal = 0, bTotal = 0;
  let movimientoTotal = 0;

  // Procesar píxeles
  for (let i = 0; i < video.pixels.length; i += 4) {
    let r = video.pixels[i];
    let g = video.pixels[i + 1];
    let b = video.pixels[i + 2];
    let brillo = (r + g + b) / 3;

    brilloTotal += brillo;
    rTotal += r;
    gTotal += g;
    bTotal += b;

    // Detectar movimiento
    if (previousFrame) {
      let diff = abs(r - previousFrame[i]) +
                 abs(g - previousFrame[i + 1]) +
                 abs(b - previousFrame[i + 2]);
      movimientoTotal += diff;
    }
  }

  previousFrame = video.pixels.slice();

  let brilloPromedio = brilloTotal / (video.width * video.height);
  let rProm = rTotal / (video.width * video.height);
  let gProm = gTotal / (video.width * video.height);
  let bProm = bTotal / (video.width * video.height);

  // Brillo → frecuencia
  let freq = map(brilloPromedio, 0, 255, 100, 1000);

  // Color dominante → tipo de onda
  let waveType = 'sine';
  if (rProm > gProm && rProm > bProm) waveType = 'square';
  else if (gProm > rProm && gProm > bProm) waveType = 'triangle';
  else if (bProm > rProm && bProm > gProm) waveType = 'sawtooth';

  // Movimiento → volumen
  let movimientoPromedio = movimientoTotal / (video.width * video.height);
  let amp = constrain(map(movimientoPromedio, 0, 100, 0.05, 0.5), 0.05, 0.5);

  // Sonido local
  osc.setType(waveType);
  osc.freq(freq);
  osc.amp(amp, 0.1);

  // Guardar para HUD
  currentFreq = freq;
  currentWave = waveType;
  currentAmp = amp;

  // Enviar datos al servidor
  socket.emit('videoData', { freq, wave: waveType, amp });

  // --- HUD ---
  fill(0, 150);
  rect(10, 10, 220, 90, 10);

  fill(255);
  noStroke();
  textSize(16);
  text(`Frecuencia: ${nf(currentFreq, 1, 2)} Hz`, 20, 35);
  text(`Onda: ${currentWave}`, 20, 55);
  text(`Volumen: ${nf(currentAmp, 1, 2)}`, 20, 75);
}

function touchStarted() {
  userStartAudio();
}

