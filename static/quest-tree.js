// --- Value counters for Bravery, Empathy, Curiosity, Logic
let playerStats = {
  Bravery: 0,
  Empathy: 0,
  Curiosity: 0,
  Logic: 0
};

let quests = {};
let currentQuestId = 1;
let returnToQuestId = null; // Stores quest ID to return after side quest
let storyContext = [];  // Stores the summary of the story so far
// The overall arc of the story
let thematicOverview = `
ChatGPT said:
As the Tokugawa era wanes and foreign influence seeps into the cracks of a once-isolated nation, a retired samurai lives quietly in the remote village of Ashigara. Once a loyal servant of the shogunate, he has renounced violence and taken root among humble villagers who know him only as a quiet, dependable guardian. But peace, like all things, is fleeting. When a corrupt magistrate arrives—empowered by foreign arms dealers and driven by greed—the fragile harmony of the village is shattered. Faced with this encroaching threat, the Guardian is forced to confront the vow he made to leave violence behind.

On one path, he chooses bravery, taking up his blade once more to shield the innocent from tyranny. On another, he turns to logic and strategy, seeking ways to dismantle the magistrate’s plans without bloodshed. Along the way, moments of empathy emerge—opportunities to connect, to heal, and to understand the pain of those around him—while misjudgments may lead to unnecessary loss or regret. With each encounter, the Guardian not only battles outward threats, but also the burden of his past, the weight of lost ideals, and the uncertain promise of the future.

In the final confrontation, he may triumph through sheer determination, through careful intellect, or by inspiring others to rise beside him. Whether he wins by the sword, the mind, or the heart, the story is not merely about defeating a monster—it is about reclaiming purpose in a world that has outgrown the old codes. If he fails, the village may still endure, bearing the scars of what was lost and the wisdom of what was learned. But if he succeeds, he does more than protect a place—he awakens a spirit of resilience that echoes far beyond the mountains of Ashigara.
`;

let narrationDone = false;  // To wait until the narration is loaded, before loading the choice buttons

const plotTemplates = {
  "Overcoming the Monster": {
    1: {
      title: "First Obstacle",
      context: "A corrupt magistrate, backed by foreign arms dealers, threatens a peaceful mountain village in late Edo-period Japan. A retired samurai feels the first stirrings of duty once more.",
      narration: "Narration placeholder.",
      choices: [
        { text: "Confront it.", next: 2, stat: "Bravery" },
        { text: "Find another way.", next: 3, stat: "Logic" }
      ]
    },

    2: {
      title: "Fight",
      context: "The Guardian draws his blade for the first time in years to defend his village from hired mercenaries.",
      narration: "Narration placeholder.",
      choices: [
        { text: "Press on.", next: 4 }
      ]
    },

    3: {
      title: "Flight",
      context: "The Guardian seeks a subtler way to protect the village, avoiding direct confrontation—for now.",
      narration: "Narration placeholder.",
      choices: [
        { text: "Proceed cautiously.", next: 4 }
      ]
    },

    4: {
      title: "Second Obstacle",
      context: "The magistrate escalates his efforts. Reinforcements arrive—better armed, more ruthless.",
      narration: "Narration placeholder.",
      choices: [
        { text: "Set a trap.", next: 6, stat: "Logic" },
        { text: "Charge before it strikes.", next: 5, stat: "Bravery" }
      ]
    },

    5: {
      title: "Fight Again",
      context: "The Guardian unleashes a desperate assault on the advancing forces before they reach the village.",
      narration: "Narration placeholder.",
      choices: [
        { text: "Onward to the Final Obstacle", next: 7 }
      ]
    },

    6: {
      title: "Outsmart",
      context: "Using the terrain and his cunning, the Guardian strikes not with strength, but strategy.",
      narration: "Narration placeholder.",
      choices: [
        { text: "Onward to the Final Obstacle", next: 7 }
      ]
    },

    7: {
      title: "Final Obstacle",
      context: "The magistrate reveals his trump card—a foreign war machine, a symbol of Japan’s changing times.",
      narration: "Narration placeholder.",
      choices: [
        { text: "Face them head-on.", next: 8, stat: "Bravery" },
        { text: "Appeal to their humanity.", next: 9, stat: "Logic" }
      ]
    },

    8: {
      title: "Bravery Ending",
      context: "The Guardian destroys the enemy and with it, the last remnants of the man he used to be.",
      narration: "Narration placeholder.",
      choices: []
    },

    9: {
      title: "Logic Ending",
      context: "Through words, memory, and resolve, the Guardian resolves the conflict without bloodshed.",
      narration: "Narration placeholder.",
      choices: []
    }
  }
};

let sideQuests = {
  "SQ1": {
    title: "Lost Relic",
    context: "The brunette lady knight rescued you and asked if you want to investigate an ancient relic in the forest.",
    narration: "Narration placeholder.",
    choices: [
      { text: "Yes, let's find it! [Curiosity]", next: null, stat: "Curiosity" },
      { text: "No, too risky.", next: null }
    ]
  }
};

function startSelectedPlot() {
  const selected = document.getElementById('plot-select').value;
  quests = JSON.parse(JSON.stringify(plotTemplates[selected])); // Deep copy
  currentQuestId = 1;
  resetStats();
  renderQuest();
}

async function renderQuest() {
  const quest = quests[currentQuestId];
  document.getElementById('quest-title').textContent = quest.title;
  document.getElementById('quest-context').textContent = "Quest context: " + quest.context;

  const container = document.getElementById('choices-container');
  container.innerHTML = ""; // Clear choices immediately

  // Special logic for final quest (ID 17) based on player stats
  if (currentQuestId === 17) {
    handleFinalQuest();
    return;
  }

  // Load narration and THEN render choices
  await loadNarration(quest);
  renderChoices(quest, container);
  updateStats();
}


async function renderSideQuest(quest) {
  const container = document.getElementById("choices-container");
  document.getElementById("quest-title").textContent = quest.title;
  document.getElementById("quest-context").textContent = quest.context;

  narrationDone = false;
  await loadNarration(quest);

  container.innerHTML = "";
  quest.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice.text;
    btn.onclick = () => {
      if (choice.stat) playerStats[choice.stat]++;
      alert("Side quest complete!");
      if (returnToQuestId !== null) {
        currentQuestId = returnToQuestId;
        returnToQuestId = null;
        updateStoryContext(quest, choice);
      }
    };
    container.appendChild(btn);
  });
  updateStats();
}

function renderChoices(quest, container) {
  if (!narrationDone) return;

  container.innerHTML = "";

  quest.choices.forEach((choice, index) => {
    if (choice.type === "quiz") {
      const questionEl = document.createElement("div");
      questionEl.innerHTML = `<strong>${choice.question}</strong>`;
      container.appendChild(questionEl);

      choice.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.textContent = opt.text;
        btn.onclick = () => {
          if (opt.correct) {
            alert("Correct! Side quest unlocked.");
            returnToQuestId = choice.next;
            renderSideQuest(sideQuests[choice.unlock]);
          } else {
            alert("Incorrect. The opportunity is lost.");
            currentQuestId = choice.next;
            renderQuest();
          }
        };
        container.appendChild(btn);
      });
    } else {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice.text;
      btn.onclick = () => {
        if (choice.stat) playerStats[choice.stat]++;
        currentQuestId = choice.next;
        updateStoryContext(quest, choice);
        renderQuest();
      };
      container.appendChild(btn);
    }
  });
}

function handleFinalQuest() {
  let maxStat = null;
  let maxValue = -1;
  for (const [key, val] of Object.entries(playerStats)) {
    if (val > maxValue) {
      maxValue = val;
      maxStat = key;
    }
  }

  const finalOutcome = {
    Bravery: "Your courage inspires warriors across the land.",
    Empathy: "Your kindness earns the trust of every faction.",
    Curiosity: "Your knowledge unlocks new ways to defend the land.",
    Logic: "Your strategies form the backbone of the kingdom’s army."
  };

  document.getElementById('quest-context').textContent += `\n\n${finalOutcome[maxStat]}`;
}

function updateStoryContext(quest, choice) {
  let formatted = `${quest.title || "Untitled"}- ${quest.context || ""}`;
  if (choice?.stat) {
    formatted += `- You made this choice: ${choice.text} (+${choice.stat})`;
  }
  storyContext.push(formatted);
  printStorySummary();
}

function printStorySummary(){
  const fullSummary = storyContext.join(" -> ");
  console.log(fullSummary); // Or render it to the UI
}

async function loadNarration(quest) {
  const narrationEl = document.getElementById("quest-narration");
  narrationEl.textContent = "Loading...";

  try {
    const storySummary = storyContext.join("\n");
    const result = await fetchPlotNode(quest.title, thematicOverview, quest.summary); // your function

    if (result && result.narration) {
      narrationEl.textContent = result.narration;
      quest.narration = result.narration; // store it for future use if needed
    } else {
      narrationEl.textContent = "Failed to load narration.";
    }

    narrationDone = true;
  } catch (err) {
    narrationEl.textContent = "Error loading narration.";
    console.error("Narration fetch failed:", err);
  }
}

async function fetchPlotNode(plotName, thematicOverview, storySummary) {
  const response = await fetch('/generate_node', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plot_name: plotName,
      thematic_overview: thematicOverview,
      story_summary: storySummary
    })
  });

  if (!response.ok) {
    console.error("Server error:", await response.text());
    return;
  }

  const data = await response.json();
  console.log("thematicOverview:", thematicOverview);
  return data;
}

function updateStats() {
  const statsDisplay = document.getElementById("stats-display");
  statsDisplay.innerHTML = `
    <strong>Stats:</strong><br>
    Bravery: ${playerStats.Bravery}, 
    Empathy: ${playerStats.Empathy}, 
    Curiosity: ${playerStats.Curiosity}, 
    Logic: ${playerStats.Logic}
  `;
}

function resetStats() {
  playerStats = {
    Bravery: 0,
    Empathy: 0,
    Curiosity: 0,
    Logic: 0
  };
}
