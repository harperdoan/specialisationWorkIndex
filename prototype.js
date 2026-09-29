// FocusScape Prototype 02
// Explores atmosphere presets instead of separate sound controls.

const playButton = document.querySelector("#playButton");
const statusText = document.querySelector("#status");
const presetButtons = document.querySelectorAll(".preset-button");

const meters = {
    rain: document.querySelector("#rainMeter"),
    cafe: document.querySelector("#cafeMeter"),
    wind: document.querySelector("#windMeter"),
    tone: document.querySelector("#toneMeter")
};

const values = {
    rain: document.querySelector("#rainValue"),
    cafe: document.querySelector("#cafeValue"),
    wind: document.querySelector("#windValue"),
    tone: document.querySelector("#toneValue")
};


// Each preset stores a different balance of the four sound layers.
const presets = {

    rainy: {
        name: "Rainy Study",
        rain: 55,
        cafe: 5,
        wind: 12,
        tone: 6
    },

    cafe: {
        name: "Quiet Café",
        rain: 8,
        cafe: 45,
        wind: 5,
        tone: 7
    },

    night: {
        name: "Night Focus",
        rain: 28,
        cafe: 3,
        wind: 14,
        tone: 12
    },

    wind: {
        name: "Soft Wind",
        rain: 8,
        cafe: 2,
        wind: 48,
        tone: 5
    }

};


let currentPreset = presets.rainy;

let audioContext;
let masterGain;

let rainGain;
let cafeGain;
let windGain;
let toneGain;

let activeSources = [];

let isPlaying = false;


// Creates softer noise for the café and wind layers.
function createSoftNoise(context) {

    const bufferSize =
        context.sampleRate * 4;

    const buffer = context.createBuffer(
        1,
        bufferSize,
        context.sampleRate
    );

    const data =
        buffer.getChannelData(0);

    let last = 0;

    for (let i = 0; i < bufferSize; i++) {

        const white =
            Math.random() * 2 - 1;

        last =
            (last + 0.02 * white) / 1.02;

        data[i] =
            last * 3.5;
    }

    const source =
        context.createBufferSource();

    source.buffer = buffer;
    source.loop = true;

    return source;
}


// Makes volume changes smoother.
function smoothVolume(gainNode, value) {

    gainNode.gain.setTargetAtTime(
        value,
        audioContext.currentTime,
        0.15
    );
}


// Changes the bars and percentages shown in the interface.
function updateMixDisplay(preset) {

    const sounds = [
        "rain",
        "cafe",
        "wind",
        "tone"
    ];

    sounds.forEach((sound) => {

        meters[sound].style.width =
            `${preset[sound]}%`;

        values[sound].textContent =
            `${preset[sound]}%`;

    });

}


function createSoundscape() {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    audioContext =
        new AudioContext();

    masterGain =
        audioContext.createGain();

    masterGain.gain.value = 0.8;

    masterGain.connect(
        audioContext.destination
    );


    // RAIN

    const rainSource =
        audioContext.createBufferSource();

    const rainBuffer =
        audioContext.createBuffer(
            1,
            audioContext.sampleRate * 3,
            audioContext.sampleRate
        );

    const rainData =
        rainBuffer.getChannelData(0);

    for (let i = 0; i < rainData.length; i++) {

        rainData[i] =
            Math.random() * 2 - 1;
    }

    rainSource.buffer =
        rainBuffer;

    rainSource.loop =
        true;


    const rainHighPass =
        audioContext.createBiquadFilter();

    rainHighPass.type =
        "highpass";

    rainHighPass.frequency.value =
        700;


    const rainLowPass =
        audioContext.createBiquadFilter();

    rainLowPass.type =
        "lowpass";

    rainLowPass.frequency.value =
        6500;


    rainGain =
        audioContext.createGain();

    rainGain.gain.value =
        currentPreset.rain / 100 * 0.10;


    rainSource
        .connect(rainHighPass)
        .connect(rainLowPass)
        .connect(rainGain)
        .connect(masterGain);



    // CAFÉ

    const cafeSource =
        createSoftNoise(audioContext);

    const cafeFilter =
        audioContext.createBiquadFilter();

    cafeFilter.type =
        "bandpass";

    cafeFilter.frequency.value =
        500;

    cafeFilter.Q.value =
        0.4;


    cafeGain =
        audioContext.createGain();

    cafeGain.gain.value =
        currentPreset.cafe / 100 * 0.07;


    cafeSource
        .connect(cafeFilter)
        .connect(cafeGain)
        .connect(masterGain);



    // WIND

    const windSource =
        createSoftNoise(audioContext);

    const windFilter =
        audioContext.createBiquadFilter();

    windFilter.type =
        "lowpass";

    windFilter.frequency.value =
        350;


    windGain =
        audioContext.createGain();

    windGain.gain.value =
        currentPreset.wind / 100 * 0.11;


    windSource
        .connect(windFilter)
        .connect(windGain)
        .connect(masterGain);



    // SOFT TONE

    const tone1 =
        audioContext.createOscillator();

    const tone2 =
        audioContext.createOscillator();

    tone1.type =
        "sine";

    tone2.type =
        "sine";

    tone1.frequency.value =
        174.61;

    tone2.frequency.value =
        261.63;


    toneGain =
        audioContext.createGain();

    toneGain.gain.value =
        currentPreset.tone / 100 * 0.025;


    tone1.connect(toneGain);
    tone2.connect(toneGain);

    toneGain.connect(masterGain);



    // Start all sound sources.

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


// Changes the live audio when another preset is selected.
function updateAudio(preset) {

    if (!isPlaying) {
        return;
    }

    smoothVolume(
        rainGain,
        preset.rain / 100 * 0.10
    );

    smoothVolume(
        cafeGain,
        preset.cafe / 100 * 0.07
    );

    smoothVolume(
        windGain,
        preset.wind / 100 * 0.11
    );

    smoothVolume(
        toneGain,
        preset.tone / 100 * 0.025
    );

}


function stopSoundscape() {

    activeSources.forEach((source) => {

        try {
            source.stop();
        } catch (error) {
            // Source may already be stopped.
        }

    });

    activeSources = [];

    if (audioContext) {
        audioContext.close();
    }

}


// Selects a different atmosphere preset.
presetButtons.forEach((button) => {

    button.addEventListener("click", () => {

        presetButtons.forEach((item) => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        currentPreset =
            presets[button.dataset.preset];

        statusText.textContent =
            currentPreset.name;

        updateMixDisplay(
            currentPreset
        );

        updateAudio(
            currentPreset
        );

    });

});


// Starts and stops the soundscape.
playButton.addEventListener("click", () => {

    if (!isPlaying) {

        createSoundscape();

        isPlaying = true;

        playButton.textContent =
            "Stop Soundscape";

    } else {

        stopSoundscape();

        isPlaying = false;

        playButton.textContent =
            "Start Soundscape";

    }

});


// Shows the default Rainy Study mix when the page loads.
updateMixDisplay(currentPreset);