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

// Test quiz data
// const quizData = [
//   {
//     question: "What is your favorite music genre?",
//     options: ["Classical", "Rock", "Jazz"]
//   },
//   {
//     question: "What's your favorite food?:",
//     options: ["Soupy", "Stir-fry", "Spicy"]
//   },
//   {
//     question: "Favorite music instrument?:",
//     options: ["Piano", "Guitar", "Drums", "Violin"]
//   }
// ];

// Fetch quiz questions from Flask
fetch('/questions') // Step 1: Ask Flask for questions
  .then(response => response.json()) // Step 2: Parse JSON response
  .then(data => {
    data.forEach((question, index) => {
      const qNum = index + 1;

      // Get the title and all choice elements
      const titleEl = document.getElementById(`q${qNum}-title`);
      const options = document.querySelectorAll(`.q${qNum}-option`);
      const radios = document.getElementsByName(`q${qNum}`);

      if (titleEl && options.length && radios.length) {
        // Set question text
        titleEl.textContent = `${qNum}. ${question.question}`;

        // Set each choice's label and value
        question.choices.forEach((choice, i) => {
          options[i].textContent = choice;
          radios[i].value = choice;
        });
      }
    });
  })
  .catch(err => {
    console.error("Failed to load questions:", err);
  });



// Dynamically render each question and its options into HTML
function renderQuiz(questions) {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  questions.forEach((q, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    if (i === 0) slide.classList.add('active');  // Only first question visible initially

    const title = document.createElement('div');
    title.className = 'question-title';
    title.textContent = `${i + 1}. ${q.question}`;
    slide.appendChild(title);

    // Render each option as a radio button
    q.options.forEach((opt, j) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${i + 1}`;
      input.value = opt;
      if (j === 0) input.required = true;  // Make at least one option required
      label.appendChild(input);
      label.append(` ${opt}`);
      slide.appendChild(label);
    });

    container.appendChild(slide);
  });
}

// Parse quiz from JSON ends here