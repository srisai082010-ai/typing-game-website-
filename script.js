const wordLists = {
    easy: [
      "This is the easy mode of the game.",
    "You should be able to get a good WPM and accuracy score.",
    "If you dont get it, it's fine, just practice a couple of times and soon you will be able to conquer the harder levels on this game."
    ],
medium: [ 
       "Peter Picky putting enormous amounts of code to make the best game ever.",
    "Then, Peter Picky ran the enormous amount of code he wrote that took him an infinity to write.",
    "When he ran the enormous amounts of code, humongous coding errors showed up on the terminal.",
    "Peter Picky was super duper devastated.",
    "He worked on it day and night nonstop to finish the code.",
    "Finally, he couldn't take it more and crashed more than ISHOWSPEED ever did on his streams and decimated his entire room."

    ],
hard: [
     "In the quiet labyrinth of an ancient library, flickering candlelight illuminated dusty manuscripts filled with arcane symbols, forgotten language, and intricate mathematical theorems.",
    "As the relentless thunderstorm battered the stained-glass windows outside, a solitary scholar meticulously transcribed each cryptic paragraph, careful not to misplace a single semicolon or quotation mark.",
    "Suddenly, a mysterious draft extinguished the flame, plunging the cavernous room into absolute darkness and leaving only the rhythmic ticking of an ornate grandfather clock."
]
};

const timerEl = document.getElementById("timer");
const wpmEl= document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const bestEl = document.getElementById("best");
const wordsEl = document.getElementById("words");
const inputEl = document.getElementById("typing-input");
const durationEl = document.getElementById("duration");
const difficultyEl = document.getElementById("difficulty");
const resultsEl = document.getElementById("results");

let targetText = "";
let duration = 30;
let startedAt = null;
let interval = null;
let finished = null;

 let totalCorrect = 0;
let totalTyped = 0;
let lastSentenceIndex = -1;

// Get personal best for the selected mode
function getBestKey() {
  return `typerush-best-${durationEl.value}-${difficultyEl.value}`;
}

function getBest() {
  try {
    return Number(localStorage.getItem(getBestKey())) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(getBestKey(), String(score));
  } catch {
    // Game still works without local storage.
  }
}

// Select a random sentence
function generateText() {
  const list = wordLists[difficultyEl.value];

  let random = Math.floor(Math.random() * list.length);

  // Avoid repeating the same sentence immediately
  if (list.length > 1) {
    while (random === lastSentenceIndex) {
      random = Math.floor(Math.random() * list.length);
    }
  }

  lastSentenceIndex = random;
  return list[random];
}

// Display the sentence with colored characters
function renderWords() {
  wordsEl.replaceChildren();

  const typed = inputEl.value;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < targetText.length; i++) {
    const span = document.createElement("span");
    span.textContent = targetText[i];

    if (i < typed.length) {
      span.className =
        typed[i] === targetText[i]
          ? "correct"
          : "incorrect";
    } else if (i === typed.length && !finished) {
      span.className = "current";
    }

    fragment.appendChild(span);
  }

  wordsEl.appendChild(fragment);
}

// Calculate WPM and accuracy
function getStats() {
  const typed = inputEl.value;
  let currentCorrect = 0;

  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === targetText[i]) {
      currentCorrect++;
    }
  }

  const correct = totalCorrect + currentCorrect;
  const typedCount = totalTyped + typed.length;

  const elapsed = startedAt
    ? Math.min(duration, (Date.now() - startedAt) / 1000)
    : 0;

  const minutes = elapsed / 60;

  const wpm = minutes > 0
    ? Math.round((correct / 5) / minutes)
    : 0;

  const accuracy = typedCount > 0
    ? Math.round((correct / typedCount) * 100)
    : 100;

  return { wpm, accuracy };
}

function updateStats() {
  const stats = getStats();

  wpmEl.textContent = stats.wpm;
  accuracyEl.textContent = stats.accuracy + "%";
}

// Move to the next sentence
function nextSentence() {
  const typed = inputEl.value;

  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === targetText[i]) {
      totalCorrect++;
    }
  }

  totalTyped += typed.length;

  targetText = generateText();
  inputEl.value = "";

  renderWords();
  updateStats();
}

// Finish the test
function finishGame() {
  if (finished) return;

  finished = true;
  clearInterval(interval);
  interval = null;

  inputEl.disabled = true;
  timerEl.textContent = "0";

  const stats = getStats();

  wpmEl.textContent = stats.wpm;
  accuracyEl.textContent = stats.accuracy + "%";

  document.getElementById("final-wpm").textContent =
    stats.wpm;

  document.getElementById("final-accuracy").textContent =
    stats.accuracy + "%";

  const recordMessage =
    document.getElementById("record-message");

  const previousBest = getBest();

  if (stats.wpm > previousBest) {
    saveBest(stats.wpm);
    bestEl.textContent = stats.wpm;
    recordMessage.textContent = "🏆 New personal best!";
  } else {
    recordMessage.textContent = "Keep practicing!";
  }

  resultsEl.hidden = false;
  renderWords();
}

// Start countdown
function startTimer() {
  if (startedAt !== null) return;

  startedAt = Date.now();

  interval = setInterval(() => {
    const elapsed = (Date.now() - startedAt) / 1000;
    const timeLeft = Math.max(
      0,
      Math.ceil(duration - elapsed)
    );

    timerEl.textContent = timeLeft;

    updateStats();

    if (elapsed >= duration) {
      finishGame();
    }
  }, 100);
}

// Reset everything
function resetGame() {
  clearInterval(interval);

  interval = null;
  startedAt = null;
  finished = false;

  duration = Number(durationEl.value);

  totalCorrect = 0;
  totalTyped = 0;
  lastSentenceIndex = -1;

  targetText = generateText();

  inputEl.value = "";
  inputEl.disabled = false;

  timerEl.textContent = duration;
  wpmEl.textContent = "0";
  accuracyEl.textContent = "100%";
  bestEl.textContent = getBest();

  resultsEl.hidden = true;

  renderWords();
}

// Detect typing
inputEl.addEventListener("input", () => {
  if (finished) return;

  if (inputEl.value.length > 0) {
    startTimer();
  }

  // Prevent typing beyond the current sentence
  if (inputEl.value.length > targetText.length) {
    inputEl.value = inputEl.value.slice(
      0,
      targetText.length
    );
  }

  if (inputEl.value.length === targetText.length) {
    nextSentence();
  } else {
    renderWords();
    updateStats();
  }
});

// Restart button
document.getElementById("restart").addEventListener(
  "click",
  () => {
    resetGame();
    inputEl.focus();
  }
);

// Change time or difficulty
durationEl.addEventListener("change", resetGame);
difficultyEl.addEventListener("change", resetGame);

// Initialize game
resetGame();