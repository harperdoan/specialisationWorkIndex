// FocusScape Prototype 01
// Creates soft generated ambience using the Web Audio API.

const playButton = document.querySelector("#playButton");
const statusText = document.querySelector("#status");

const sliders = {
    rain: document.querySelector("#rain"),
    cafe: document.querySelector("#cafe"),
    wind: document.querySelector("#wind"),
    tone: document.querySelector("#tone")
};

const values = {
    rain: document.querySelector("#rainValue"),
    cafe: document.querySelector("#cafeValue"),
    wind: document.querySelector("#windValue"),
    tone: document.querySelector("#toneValue")
};

let audioContext;
let masterGain;

let rainGain;
let cafeGain;
let windGain;
let toneGain;

let activeSources = [];
let isPlaying = false;


// Creates softer brown-style noise instead of harsh white noise.
function createSoftNoise(context) {
    const bufferSize = context.sampleRate * 4;
    const buffer = context.createBuffer(
        1,
        bufferSize,
        context.sampleRate
    );

    const data = buffer.getChannelData(0);

    let last = 0;

    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
    }

    const source = context.createBufferSource();

    source.buffer = buffer;
    source.loop = true;

    return source;
}


function smoothVolume(gainNode, value) {
    gainNode.gain.setTargetAtTime(
        value,
        audioContext.currentTime,
        0.15
    );
}


function createSoundscape() {
    audioContext = new AudioContext();

    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(audioContext.destination);


    // RAIN
    const rainSource = audioContext.createBufferSource();

    const rainBuffer = audioContext.createBuffer(
        1,
        audioContext.sampleRate * 3,
        audioContext.sampleRate
    );

    const rainData = rainBuffer.getChannelData(0);

    // Brighter random noise gives the rain layer more texture.
    for (let i = 0; i < rainData.length; i++) {
        rainData[i] = Math.random() * 2 - 1;
    }

    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainHighPass = audioContext.createBiquadFilter();
    rainHighPass.type = "highpass";
    rainHighPass.frequency.value = 700;

    const rainLowPass = audioContext.createBiquadFilter();
    rainLowPass.type = "lowpass";
    rainLowPass.frequency.value = 6500;

    rainGain = audioContext.createGain();
    rainGain.gain.value =
        sliders.rain.value / 100 * 0.10;

    rainSource
        .connect(rainHighPass)
        .connect(rainLowPass)
        .connect(rainGain)
        .connect(masterGain);


    // CAFÉ AMBIENCE
    const cafeSource = createSoftNoise(audioContext);

    const cafeFilter = audioContext.createBiquadFilter();
    cafeFilter.type = "bandpass";
    cafeFilter.frequency.value = 500;
    cafeFilter.Q.value = 0.4;

    cafeGain = audioContext.createGain();
    cafeGain.gain.value =
        sliders.cafe.value / 100 * 0.07;

    cafeSource
        .connect(cafeFilter)
        .connect(cafeGain)
        .connect(masterGain);


    // WIND
    const windSource = createSoftNoise(audioContext);

    const windFilter = audioContext.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 350;

    windGain = audioContext.createGain();
    windGain.gain.value =
        sliders.wind.value / 100 * 0.11;

    windSource
        .connect(windFilter)
        .connect(windGain)
        .connect(masterGain);


    // SOFT AMBIENT TONES
    const tone1 = audioContext.createOscillator();
    const tone2 = audioContext.createOscillator();

    tone1.type = "sine";
    tone2.type = "sine";

    tone1.frequency.value = 174.61;
    tone2.frequency.value = 261.63;

    toneGain = audioContext.createGain();
    toneGain.gain.value =
        sliders.tone.value / 100 * 0.025;

    tone1.connect(toneGain);
    tone2.connect(toneGain);

    toneGain.connect(masterGain);


    rainSource.start();
    cafeSource.start();
    windSource.start();
    tone1.start();
    tone2.start();

    activeSources = [
        rainSource,
        cafeSource,
        windSource,
        tone1,
        tone2
    ];
}


function stopSoundscape() {
    activeSources.forEach((source) => {
        try {
            source.stop();
        } catch (error) {
            // Ignore already stopped sources.
        }
    });

    activeSources = [];

    if (audioContext) {
        audioContext.close();
    }
}


playButton.addEventListener("click", () => {

    if (!isPlaying) {

        createSoundscape();

        isPlaying = true;

        playButton.textContent = "Stop Soundscape";
        statusText.textContent = "Soundscape playing";

    } else {

        stopSoundscape();

        isPlaying = false;

        playButton.textContent = "Start Soundscape";
        statusText.textContent = "Ready to focus";
    }
});


Object.keys(sliders).forEach((name) => {

    sliders[name].addEventListener("input", () => {

        values[name].textContent =
            `${sliders[name].value}%`;

        if (!isPlaying) return;

        const level = sliders[name].value / 100;

        if (name === "rain") {
            smoothVolume(rainGain, level * 0.10);
        }

        if (name === "cafe") {
            smoothVolume(cafeGain, level * 0.07);
        }

        if (name === "wind") {
            smoothVolume(windGain, level * 0.11);
        }

        if (name === "tone") {
            smoothVolume(toneGain, level * 0.025);
        }

    });

});