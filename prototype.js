// FocusScape Prototype 06
// Uses Math.random() and gives visible feedback about each change.

const playButton =
    document.querySelector("#playButton");

const generateButton =
    document.querySelector("#generateButton");

const statusText =
    document.querySelector("#status");

const variationTitle =
    document.querySelector("#variationTitle");

const feedbackList =
    document.querySelector("#feedbackList");

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

let isPlaying = false;
let variationNumber = 1;


let mix = {
    rain: 30,
    cafe: 22,
    wind: 18,
    tone: 16
};


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


function randomRange(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


function smoothVolume(gainNode, value) {

    gainNode.gain.setTargetAtTime(
        value,
        audioContext.currentTime,
        0.5
    );
}


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


// Creates feedback by comparing old and new values.
function showFeedback(previousMix) {

    feedbackList.innerHTML = "";

    const labels = {
        rain: "Rain",
        cafe: "Café",
        wind: "Wind",
        tone: "Tone"
    };


    Object.keys(mix).forEach((name) => {

        const difference =
            mix[name] - previousMix[name];

        const item =
            document.createElement("p");


        if (difference > 0) {

            item.textContent =
                `${labels[name]} increased by ${difference}%`;

        } else if (difference < 0) {

            item.textContent =
                `${labels[name]} decreased by ${Math.abs(difference)}%`;

        } else {

            item.textContent =
                `${labels[name]} stayed the same`;
        }


        feedbackList.appendChild(item);

    });
}


function generateVariation() {

    const previousMix = {
        ...mix
    };


    mix.rain =
        randomRange(22, 38);

    mix.cafe =
        randomRange(15, 30);

    mix.wind =
        randomRange(12, 25);

    mix.tone =
        randomRange(12, 22);


    variationNumber += 1;


    variationTitle.textContent =
        `Variation ${variationNumber}`;


    updateDisplay();

    showFeedback(previousMix);


    if (isPlaying) {

        smoothVolume(
            rainGain,
            mix.rain / 100 * 0.045
        );

        smoothVolume(
            cafeGain,
            mix.cafe / 100 * 0.075
        );

        smoothVolume(
            windGain,
            mix.wind / 100 * 0.065
        );

        smoothVolume(
            toneGain,
            mix.tone / 100 * 0.055
        );
    }
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
        0.75;

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
        1300;


    const rainLowPass =
        audioContext.createBiquadFilter();

    rainLowPass.type =
        "lowpass";

    rainLowPass.frequency.value =
        4200;


    rainGain =
        audioContext.createGain();

    rainGain.gain.value =
        mix.rain / 100 * 0.045;


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
        700;

    cafeFilter.Q.value =
        0.45;


    cafeGain =
        audioContext.createGain();

    cafeGain.gain.value =
        mix.cafe / 100 * 0.075;


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
        420;


    windGain =
        audioContext.createGain();

    windGain.gain.value =
        mix.wind / 100 * 0.065;


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
        mix.tone / 100 * 0.055;


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
            // Source may already be stopped.
        }

    });

    activeSources = [];


    if (audioContext) {
        audioContext.close();
    }
}


generateButton.addEventListener(
    "click",
    () => {

        generateVariation();

    }
);


playButton.addEventListener(
    "click",
    () => {

        if (!isPlaying) {

            createSoundscape();

            isPlaying = true;

            statusText.textContent =
                "Soundscape playing";

            playButton.textContent =
                "Stop Soundscape";

        } else {

            stopSoundscape();

            isPlaying = false;

            statusText.textContent =
                "Ready to focus";

            playButton.textContent =
                "Start Soundscape";
        }

    }
);


updateDisplay();