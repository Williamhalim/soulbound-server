// Parse query param code starts here
const params = new URLSearchParams(window.location.search);
const rawData = params.get("data");

if (rawData) {
  try {
    const parsed = JSON.parse(decodeURIComponent(rawData));
    document.getElementById("gameData").textContent = JSON.stringify(parsed, null, 2);
  } catch (err) {
    document.getElementById("gameData").textContent = "❌ Failed to parse game data.";
  }
} else {
  document.getElementById("gameData").textContent = "⚠️ No data received.";
}
// Parse query param code ends here

// Slide animation code begins here
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const nextBtn = document.querySelector('.btn-next');
const backBtn = document.querySelector('.btn-back');
const submitBtn = document.querySelector('.btn-submit');

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });

  backBtn.style.display = index === 0 ? 'none' : 'inline-block';
  nextBtn.style.display = index === slides.length - 1 ? 'none' : 'inline-block';
  submitBtn.style.display = index === slides.length - 1 ? 'inline-block' : 'none';
}

function nextSlide() {
  const currentInputs = slides[currentSlide].querySelectorAll('input[type="radio"]');
  const oneChecked = Array.from(currentInputs).some(input => input.checked);
  if (!oneChecked) {
    alert("Please select an option.");
    return;
  }
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    showSlide(currentSlide);
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    showSlide(currentSlide);
  }
}

showSlide(currentSlide);
// Slide animation code ends here

// Parse quiz from JSON starts here

const quizData = [
  {
    question: "What is your favorite music genre?",
    options: ["Classical", "Rock", "Jazz"]
  },
  {
    question: "What's your favorite food?:",
    options: ["Soupy", "Stir-fry", "Spicy"]
  },
  {
    question: "Favorite time of the day?:",
    options: ["Sunrise", "Daytime", "Sunset", "Nighttime"]
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");

  quizData.forEach((q, i) => {
    const slide = slides[i];
    if (!slide) return;

    // Set question text
    const title = slide.querySelector(".question-title");
    if (title) title.textContent = `${i + 1}. ${q.question}`;

    // Remove existing labels (in case they were hardcoded)
    slide.querySelectorAll("label").forEach(label => label.remove());

    // Add choices
    q.options.forEach((option, j) => {
      const label = document.createElement("label");
      const input = document.createElement("input");

      input.type = "radio";
      input.name = `q${i + 1}`;
      input.value = option;
      if (j === 0) input.required = true;

      label.appendChild(input);
      label.append(` ${option}`);
      slide.appendChild(label);
    });
  });
});

// Parse quiz from JSON ends here