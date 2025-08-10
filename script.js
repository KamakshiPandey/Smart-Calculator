let darkMode = false;

function appendValue(value) {
    document.getElementById("display").value += value;
}

function calculate() {
    try {
        let result = eval(document.getElementById("display").value);
        document.getElementById("display").value = result;
        speak(`The result is ${result}`);
    } catch {
        alert("Invalid Expression");
    }
}

function clearDisplay() {
    document.getElementById("display").value = "";
}

function convertUnit(type) {
    let val = parseFloat(document.getElementById("display").value);
    if (isNaN(val)) return alert("Enter a number first!");
    let result;
    switch(type) {
        case 'cmToInch': result = val / 2.54; break;
        case 'inchToCm': result = val * 2.54; break;
        case 'kgToLb': result = val * 2.20462; break;
        case 'lbToKg': result = val / 2.20462; break;
    }
    document.getElementById("display").value = result;
    speak(`That is ${result}`);
}

function toggleTheme() {
    darkMode = !darkMode;
    document.body.classList.toggle("dark", darkMode);
}

function startListening() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported!");
        return;
    }
    let recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    recognition.onresult = function(event) {
        let spoken = event.results[0][0].transcript;
        document.getElementById("display").value = spoken.replace(/plus/gi, '+').replace(/minus/gi, '-').replace(/times/gi, '*').replace(/divide/gi, '/');
        calculate();
    };
}

function speak(message) {
    let speech = new SpeechSynthesisUtterance(message);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
}
