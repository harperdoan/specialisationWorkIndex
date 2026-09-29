// FocusScape Prototype 04
// Uses Math.random() to create controlled automatic variations.

const playButton =
    document.querySelector("#playButton");

const statusText =
    document.querySelector("#status");

const variationTitle =
    document.querySelector("#variationTitle");

const variationText =
    document.querySelector("#variationText");

const rainValue =
    document.querySelector("#rainValue");

const cafeValue =
    document.querySelector("#cafeValue");

const windValue =
    document.querySelector("#windValue");

const toneValue =
    document.querySelector("#toneValue");


let audioContext;
let masterGain;

let rainGain;
let cafeGain;
let windGain;
let toneGain;

let activeSources = [];
let variationTimer;

let isPlaying = false;


let mix = {
    rain: 40,
    cafe: 15,
    wind: 15,
    tone: 8
};


// Creates softer noise for café and wind.
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


// Makes a random whole number between min and max.
function randomRange(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


// Keeps changes smooth.
function smoothVolume(gainNode, value) {

    gainNode.gain.setTargetAtTime(
        value,
        audioContext.currentTime,
        0.5
    );
}


// Updates the visible percentages.
function updateDisplay() {

    rainValue.textContent =
        `${mix.rain}%`;

    cafeValue.textContent =
        `${mix.cafe}%`;

    windValue.textContent =
        `${mix.wind}%`;

    toneValue.textContent =
        `${mix.tone}%`;
}


// Creates one controlled random variation.
function makeVariation() {

    mix.rain =
        randomRange(30, 55);

    mix.cafe =
        randomRange(5, 22);

    mix.wind =
        randomRange(8, 25);

    mix.tone =
        randomRange(4, 12);


    updateDisplay();


    if (isPlaying) {

        smoothVolume(
            rainGain,
            mix.rain / 100 * 0.10
        );

        smoothVolume(
            cafeGain,
            mix.cafe / 100 * 0.07
        );

        smoothVolume(
            windGain,
            mix.wind / 100 * 0.11
        );

        smoothVolume(
            toneGain,
            mix.tone / 100 * 0.025
        );
    }


    variationTitle.textContent =
        "Soundscape gently changed";

    variationText.textContent =
        "A new mix was generated within the allowed focus ranges.";
}


function createSoundscape() {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    audioContext =
        new AudioContext();


    masterGain =
        audioContext.createGain();

    masterGain.gain.value =
        0.8;

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
        mix.rain / 100 * 0.10;


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
        mix.cafe / 100 * 0.07;


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
        mix.wind / 100 * 0.11;


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
        mix.tone / 100 * 0.025;


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


// Starts automatic variations every 6 seconds.
// The short interval makes the behaviour easy to test in the prototype.
function startAutomaticVariation() {

    variationTimer =
        setInterval(
            makeVariation,
            6000
        );
}


function stopSoundscape() {

    clearInterval(
        variationTimer
    );

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


playButton.addEventListener(
    "click",
    () => {

        if (!isPlaying) {

            createSoundscape();

            isPlaying = true;

            statusText.textContent =
                "Automatic variation active";

            playButton.textContent =
                "Stop Soundscape";

            variationTitle.textContent =
                "Listening";

            variationText.textContent =
                "The mix will change automatically every few seconds.";

            startAutomaticVariation();

        } else {

            stopSoundscape();

            isPlaying = false;

            statusText.textContent =
                "Ready to focus";

            playButton.textContent =
                "Start Soundscape";

            variationTitle.textContent =
                "Waiting to begin";

            variationText.textContent =
                "Small changes will occur automatically while the soundscape is playing.";
        }

    }
);


updateDisplay();