// FocusScape Prototype 03
// Tests a reduced interface with only atmosphere and intensity controls.

const playButton = document.querySelector("#playButton");
const statusText = document.querySelector("#status");

const atmosphereSelect =
    document.querySelector("#atmosphere");

const intensitySlider =
    document.querySelector("#intensity");

const intensityValue =
    document.querySelector("#intensityValue");

const setupSummary =
    document.querySelector("#setupSummary");


const atmospheres = {

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

    wind: {
        name: "Soft Wind",
        rain: 8,
        cafe: 2,
        wind: 48,
        tone: 5
    }

};


const intensityLevels = {

    1: {
        name: "Low",
        multiplier: 0.65
    },

    2: {
        name: "Medium",
        multiplier: 1
    },

    3: {
        name: "High",
        multiplier: 1.25
    }

};


let audioContext;
let masterGain;

let rainGain;
let cafeGain;
let windGain;
let toneGain;

let activeSources = [];

let isPlaying = false;


// Creates soft noise used by the café and wind layers.
function createSoftNoise(context) {

    const bufferSize =
        context.sampleRate * 4;

    const buffer =
        context.createBuffer(
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


// Returns the currently selected atmosphere.
function getAtmosphere() {

    return atmospheres[
        atmosphereSelect.value
    ];
}


// Returns the selected intensity level.
function getIntensity() {

    return intensityLevels[
        intensitySlider.value
    ];
}


// Updates the small setup summary.
function updateInterface() {

    const atmosphere =
        getAtmosphere();

    const intensity =
        getIntensity();

    intensityValue.textContent =
        intensity.name;

    setupSummary.textContent =
        `${atmosphere.name} · ${intensity.name} intensity`;
}


// Changes a volume smoothly.
function smoothVolume(gainNode, value) {

    gainNode.gain.setTargetAtTime(
        value,
        audioContext.currentTime,
        0.15
    );
}


// Calculates volume using both atmosphere and intensity.
function getVolume(sound, baseAmount) {

    const atmosphere =
        getAtmosphere();

    const intensity =
        getIntensity();

    return (
        atmosphere[sound] /
        100 *
        baseAmount *
        intensity.multiplier
    );
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
        getVolume("rain", 0.10);


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
        getVolume("cafe", 0.07);


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
        getVolume("wind", 0.11);


    windSource
        .connect(windFilter)
        .connect(windGain)
        .connect(masterGain);



    // SOFT TONE

    const tone1 =
        audioContext.createOscillator();

    const tone2 =
        audioContext.createOscillator();

    tone1.type = "sine";
    tone2.type = "sine";

    tone1.frequency.value =
        174.61;

    tone2.frequency.value =
        261.63;


    toneGain =
        audioContext.createGain();

    toneGain.gain.value =
        getVolume("tone", 0.025);


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


// Updates all four sounds when a control changes.
function updateAudio() {

    if (!isPlaying) {
        return;
    }

    smoothVolume(
        rainGain,
        getVolume("rain", 0.10)
    );

    smoothVolume(
        cafeGain,
        getVolume("cafe", 0.07)
    );

    smoothVolume(
        windGain,
        getVolume("wind", 0.11)
    );

    smoothVolume(
        toneGain,
        getVolume("tone", 0.025)
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


// Atmosphere selection.
atmosphereSelect.addEventListener(
    "change",
    () => {

        updateInterface();
        updateAudio();
    }
);


// Intensity control.
intensitySlider.addEventListener(
    "input",
    () => {

        updateInterface();
        updateAudio();
    }
);


// Start and stop the focus session.
playButton.addEventListener(
    "click",
    () => {

        if (!isPlaying) {

            createSoundscape();

            isPlaying = true;

            playButton.textContent =
                "Stop Focus";

            statusText.textContent =
                "Focus mode active";

        } else {

            stopSoundscape();

            isPlaying = false;

            playButton.textContent =
                "Start Focus";

            statusText.textContent =
                "Ready to focus";
        }

    }
);


updateInterface();