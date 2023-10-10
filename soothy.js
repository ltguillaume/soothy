console.log('https://codeberg.org/ltguillaume/soothy');

const FADE_STEPS = 100;
const FADE_LONG  = 60 * 1000 / FADE_STEPS;
const FADE_SHORT = 3 * 1000 / FADE_STEPS;

var fadeInterval, timerInterval, remaining, stopping;
var audioBuffer, audioCtx, audioGain, audioSource;

sound.value = localStorage.getItem('sound') || 'white';
timer.value = localStorage.getItem('timer') || '60';

initLang();
reset();

document.addEventListener('click', e => {
	if (!audioCtx)
		initAudio();
	switch(e.target.id) {
		case 'play':
			reset();
			if (!body.classList.contains('playing'))
				startPlayback();
			else
				stopPlayback();
	}
});
document.addEventListener('visibilitychange', saveSettings);
sound.addEventListener('change', startAudio);
timer.addEventListener('change', () => setTimerValues(timer.value));

function initLang() {
	const translations = {
		'en': {
			title: 'Soothy',
			blue:  'Blue',
			brown: 'Brown',
			fuzz:  'Fuzz',
			gray:  'Gray',
			gray2: 'Gray #2',
			pink:  'Pink',
			white: 'White',
			hour: 'hour', hours: 'hours',
			minute: 'minute', minutes: 'minutes'
		},
		'nl': {
			title: 'Soothy',
			blue:  'Blauw',
			brown: 'Bruin',
			fuzz:  'Fuzz',
			gray:  'Grijs',
			gray2: 'Grijs #2',
			pink:  'Roze',
			white: 'Wit',
			hour: 'uur', hours: 'uur',
			minute: 'minuut', minutes: 'minuten'
		},
	};

	var text = translations['en'];
	for (lang of navigator.languages) {
		if (lang in translations) {
			var text = translations[lang];
			break;
		}
	}

	document.title = text.title;
	sound.querySelectorAll('option').forEach(el => el.textContent = text[el.value]);
	timer.querySelectorAll('option').forEach(el => el.textContent =
		el.value < 60 ? `${el.value} ${el.value > 1 ? text.minutes : text.minute}` :
		`${el.value / 60} ${el.value / 60 > 1 ? text.hours : text.hour}`);
}

function initAudio() {
	audioCtx = new AudioContext();
	audioGain = new GainNode(audioCtx);
	audioGain.gain.value = 0;
}

function reset() {
	if (fadeInterval)
		clearInterval(fadeInterval);
	if (timerInterval)
		clearInterval(timerInterval);
	remaining = timer.value * 60;	// Seconds
	setTimerValues();
}

async function startPlayback() {
	stopping = false;
	if (audioCtx.state === 'suspended')
		audioCtx.resume();
	await startAudio();
	fadeInterval = setInterval(fadeIn, FADE_SHORT);
	timerInterval = setInterval(countdown, 1000);
	body.classList.add('playing');
}

function stopPlayback(interval = FADE_SHORT) {
	stopping = true;
	if (timerInterval)
		clearInterval(timerInterval);
	fadeInterval = setInterval(fadeOut, interval);
	body.classList.remove('playing');
}

function setTimerValues(newValue) {
	if (newValue)
		remaining = timer.value * 60;
	var hrs = Math.floor(remaining / 3600);
	hours.textContent = (hrs > 0 ? hrs +':' : '');
	var min = Math.floor(remaining % 3600 / 60);
	minutes.textContent = (min < 10 ? '0' : '') + min;
	var sec = Math.floor(remaining % 60);
	seconds.textContent = (sec < 10 ? ':0' : ':') + sec;
}

function fadeIn() {
	if (audioGain.gain.value >= 1 - 1 / FADE_STEPS)
		return clearInterval(fadeInterval);
	audioGain.gain.value += 1 / FADE_STEPS;
}

function countdown() {
	setTimerValues();
	if (remaining <= 0) {
		clearInterval(timerInterval);
		return stopPlayback(FADE_LONG);
	}
	remaining--;
}

function fadeOut() {
	if (audioGain.gain.value <= 1 / FADE_STEPS) {
		audioSource.stop();
		stopping = false;
		return clearInterval(fadeInterval);
	}
	audioGain.gain.value -= 1 / FADE_STEPS;
}

async function startAudio() {
	var buffer = await fetchAudio();
	if (audioSource)
		audioSource.stop();
	audioBuffer = buffer;
	audioSource = audioCtx.createBufferSource();
	audioSource.buffer = audioBuffer;
	audioSource.connect(audioGain).connect(audioCtx.destination);
	audioSource.loop = 1;
	audioSource.start();
}

async function fetchAudio() {
	try {
		var data = await fetch(`sounds/${sound.value}.wav`);
		return audioCtx.decodeAudioData(await data.arrayBuffer());
	} catch (e) {
		console.log(`Unable to fetch the audio file "sounds/${sound.value}.wav". Error: ${e.message}`);
	}
}

function saveSettings() {
	localStorage.setItem('sound', sound.value);
	localStorage.setItem('timer', timer.value);
}