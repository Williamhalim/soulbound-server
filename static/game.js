// Parse player data code starts here
const params = new URLSearchParams(window.location.search);
const rawData = params.get("data");
const MAX_STAT = 30; // Set max stat value
let parsed = null; // Declare parsed globally so it's accessible later

if (rawData) {
  try {
    parsed = JSON.parse(decodeURIComponent(rawData));
    document.getElementById("gameData").textContent = JSON.stringify(parsed, null, 2);
  } catch (err) {
    document.getElementById("gameData").textContent = "❌ Failed to parse game data.";
  }
} else {
  document.getElementById("gameData").textContent = "⚠️ No data received.";
}
// Parse player data code ends here

let currentQuestions = [];

// Game topic logic START

document.getElementById("generateBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    const formData = new FormData(); // create form manually. Band-aid solution, ignore.

    resetSlide();   // Band-aid solution to ensure slide animation works properly everytime new set of quiz is generated.

    const archetype   = parsed?.personality?.archetype || "mysterious";
    const location    = parsed?.start?.location || "unknown";
    const role        = parsed?.start?.role || "unknown";
    const situation   = parsed?.start?.situation || "unknown";
    const timePeriod  = parsed?.start?.time_period || "unknown";

    const topic = `Moral dilemma questions for someone with a ${archetype} archetype. The background of the character is as follows- location is ${location}, the player assumes the role of ${role}, situation is- ${situation}, timePeriod is ${timePeriod}.`;

    formData.set("topic", topic);

    const quizContainer = document.getElementById("quizContainer");
    const resultContainer = document.getElementById("resultContainer");
    const quizForm = document.getElementById("quizForm");

    resultContainer.innerHTML = "";
    quizForm.innerHTML = "";
    quizForm.style.display = "none";
    quizContainer.innerHTML = "<p>Generating questions...</p>";

    const res = await fetch("/generate", {
        method: "POST",
        body: formData
    });

    const resClone = res.clone();
    let data;

    try {
        data = await res.json();
    } catch (err) {
        const raw = await resClone.text();
        quizContainer.innerHTML = `<p style="color:red;">Server did not return valid JSON.</p><pre>${raw}</pre>`;
        return;
    }

    if (data.error) {
        quizContainer.innerHTML = `<p style="color:red;">Error: ${data.error}</p><pre>${data.details || ''}</pre>`;
        return;
    }

    currentQuestions = data.questions;
    quizContainer.innerHTML = "";
    quizForm.style.display = "block";
    
    currentQuestions.forEach((q, i) => {
        const optionsHTML = q.options.map((opt, j) => `
            <label>
                <input type="radio" name="choice" value="${Object.entries(opt.value).map(([k, v]) => `${k}:${v}`).join(',')}" required>
                ${JSON.stringify(opt.label)}
            </label><br>`).join("");
    
        const slideDiv = document.createElement("div");
        slideDiv.className = "slide";
        slideDiv.style.display = i === 0 ? "block" : "none"; // Band-aid solution to ensure visibility for first question. Ignore
    
        slideDiv.innerHTML = `
            <div class="question-title">Q${i + 1}: ${q.question}</div>
            ${optionsHTML}
        `;
    
        quizForm.appendChild(slideDiv);
    });
    showSlide(currentSlide);

    quizForm.addEventListener("submit", (e) => {
        e.preventDefault();
        let score = 0;
        const results = [];

        currentQuestions.forEach((q, i) => {
            const selected = quizForm.querySelector(`input[name="q${i}"]:checked`);
            const userAnswer = selected ? selected.value : "";
            const isCorrect = userAnswer === q.answer;

            results.push({
                question: q.question,
                correct: q.answer,
                selected: userAnswer,
                isCorrect
            });

            if (isCorrect) score++;
        });
        document.getElementById("btn-next").style.display = "none";
        window.location.href = "endgame.html"; // or any other page
    });
});

// Automatically load questions at load page
window.addEventListener("DOMContentLoaded", (e) => {
  document.getElementById("generateBtn").click();
});

// Game topic logic END

// Initial stat values (0–10 scale)
const stats = {
  bravery: 7,
  curiosity: 3,
  empathy: 8,
  logic: 6
};

// Render gameData and progress bars
function renderGameData() {
    const selectedData = {
    timePeriod: parsed?.start?.time_period,
    role: parsed?.start?.role,
    location: parsed?.start?.location,
    situation: parsed?.start?.situation
  };

  document.getElementById("gameData").textContent = JSON.stringify(selectedData, null, 2);
}

function renderProgressBars() {
  const container = document.getElementById("progressBars");
  container.innerHTML = ''; // Clear existing bars
  for (const key in stats) {
    const percent = Math.min(100, Math.max(0, (stats[key] / MAX_STAT) * 100)); // 0–100%
    container.innerHTML += `
      <div class="progress-bar-container">
        <div class="progress-label" id="label-${key}">${key.charAt(0).toUpperCase() + key.slice(1)} (${stats[key]}/${MAX_STAT})</div>
        <div class="progress">
          <div class="progress-fill" id="bar-${key}" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }
}

// Update bars after change
function updateProgressBars() {
  for (const key in stats) {
    const percent = Math.min(100, Math.max(0, (stats[key] / MAX_STAT) * 100));

    const bar = document.getElementById(`bar-${key}`);
    if (bar) {
      bar.style.width = `${percent}%`;
    }

    const label = document.getElementById(`label-${key}`);
    if (label) {
      label.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)} (${stats[key]}/${MAX_STAT})`;
    }
  }

  renderGameData();
}

// Handle quiz submission
document.getElementById("btn-next").addEventListener("click", function (e)  {
  e.preventDefault();
  const choice = document.querySelector('input[name="choice"]:checked');
  if (!choice) {
    alert("Please select a choice!");
    return;
  }

  // Handle multiple updates like "curiosity:1,bravery:-1"
  const updates = choice.value.split(",");
  updates.forEach(update => {
    const [stat, changeStr] = update.split(":");
    const change = parseInt(changeStr);
    if (stat in stats) {
      stats[stat] = Math.max(0, Math.min(MAX_STAT, stats[stat] + change)); // Clamp between 0 and MAX_STAT
    }
  });

  updateProgressBars();

  // Deselect all inputs with name="choice"
  const choices = document.querySelectorAll('input[name="choice"]');
  choices.forEach(input => input.checked = false);
});

// Initial render
renderGameData();
renderProgressBars();

// Questions slide animation script START

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const nextBtn = document.querySelector('.btn-next');
const backBtn = document.querySelector('.btn-back');
const submitBtn = document.querySelector('.btn-submit');

function showSlide(index) {
  const slides = document.querySelectorAll('.slide'); // ⬅️ MOVE THIS HERE
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });

  console.log("index: " + index + ", slide length: " + slides.length);
  if (index == slides.length - 1) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'inline-block';
  } else {
    nextBtn.style.display = 'inline-block';
    submitBtn.style.display = 'none';
  }
}

function nextSlide() {
  const slides = document.querySelectorAll('.slide'); // ⬅️ SAME HERE
  if (currentSlide < slides.length - 1) {
    slides[currentSlide].style.display = "none";
    currentSlide++;
    slides[currentSlide].style.display = "block";
  } else if (currentSlide == slides.length - 1){
    currentSlide++;
  }
  showSlide(currentSlide);
}

// function prevSlide() {
//   if (currentSlide > 0) {
//     currentSlide--;
//     showSlide(currentSlide);
//   }
// }

function resetSlide(){
  currentSlide = 0;
}
// Questions slide animation script END