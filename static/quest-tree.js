const params = new URLSearchParams(window.location.search);
const rawData = params.get("data");
let gameData = null;
let thematicOverview = "";

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
let numberOfChapters = null;
// The overall arc of the story
let narrationDone = false;  // To wait until the narration is loaded, before loading the choice buttons

// Parse game data from URL
if (rawData) {
  try {
    gameData = JSON.parse(decodeURIComponent(rawData));
    console.log("✅ Game data parsed:", gameData);

    // If it includes a thematic overview, extract it
    if (gameData.thematic_overview) {
      thematicOverview = gameData.thematic_overview;
      console.log("🎭 Thematic Overview:", thematicOverview);
    }

    // You can also show it in the UI if you want:
    // document.getElementById("thematic-overview").textContent = thematicOverview;

  } catch (err) {
    console.error("❌ Failed to parse game data:", err);
  }
} else {
  console.warn("⚠️ No game data received.");
}

const plotTemplates = {
  "Overcoming the Monster": {
    1: {
      title: "Start / Intro",
      context: "Ashigara sleeps under fog and quiet. The Guardian tends the soil, unaware that change is already coming.",
      narration: "Placeholder.",
      choices: [
        { text: "Begin the day with quiet reflection.", next: 2 },
        { text: "Walk the village, sensing the mood.", next: 2 }
      ]
    },

    2: {
      title: "Call to Action",
      context: "Rumors spread of a corrupt magistrate heading toward Ashigara with foreign weapons. The Guardian senses that peace is ending.",
      narration: "Placeholder.",
      choices: [
        { text: "Investigate quietly.", next: 3 },
        { text: "Rush to prepare the village.", next: 3 }
      ]
    },

    3: {
      title: "Early Side Quest Trigger",
      context: "A frantic merchant offers a dubious shortcut to 'fix everything.' It smells like trouble, but… could it work?",
      narration: "Placeholder.",
      choices: [
        { text: "Believe him and follow the plan.", next: 4 },
        { text: "Decline or stall for time.", next: 5 }
      ]
    },

    4: {
      title: "Comedic Ending",
      context: "The merchant’s plan backfires hilariously. The Guardian ends up in a cart full of cabbages heading the wrong way. Game over… for now.",
      narration: "Placeholder.",
      choices: []
    },

    5: {
      title: "First Obstacle",
      context: "The magistrate’s scouts begin surveying the village. The Guardian must decide how to respond.",
      narration: "Placeholder.",
      choices: [
        { text: "Confront them directly.", next: 6, stat: "Bravery" },
        { text: "Track their movements from afar.", next: 7, stat: "Logic" }
      ]
    },

    6: {
      title: "Fight",
      context: "Steel clashes with steel. The Guardian defeats the scouts, but the village is now exposed.",
      narration: "Placeholder.",
      choices: [
        { text: "Check on the villagers.", next: 8 }
      ]
    },

    7: {
      title: "Flight",
      context: "The Guardian avoids contact, collecting intel on the magistrate's plans—but some see his caution as cowardice.",
      narration: "Placeholder.",
      choices: [
        { text: "Keep your distance.", next: 9 }
      ]
    },

    8: {
      title: "Side Quest Trigger",
      context: "A sick child goes missing during the chaos. The villagers plead for the Guardian’s help.",
      narration: "Placeholder.",
      choices: [
        { text: "Search immediately.", next: 10 },
        { text: "Refuse and stay on task.", next: 11 }
      ]
    },

    9: {
      title: "Failure",
      context: "While gathering information, the Guardian is discovered and ambushed, losing valuable time and resources.",
      narration: "Placeholder.",
      choices: [
        { text: "Return to the village.", next: 11 }
      ]
    },

    10: {
      title: "Side Quest 1",
      context: "The Guardian finds the child near the river’s edge and saves them. Trust grows within the village.",
      narration: "Placeholder.",
      choices: [
        { text: "Continue your mission.", next: 11 }
      ]
    },

    11: {
      title: "Victory",
      context: "With either strength or empathy, the Guardian wins the first battle—but the magistrate’s main force is drawing near.",
      narration: "Placeholder.",
      choices: [
        { text: "Advance.", next: 12 }
      ]
    },

    12: {
      title: "Random Encounter",
      context: "A disguised traveler passes through the village. Is he a spy, a friend, or just a poor soul fleeing war?",
      narration: "Placeholder.",
      choices: [
        { text: "Confront him.", next: 13 },
        { text: "Let him pass.", next: 14 }
      ]
    },

    13: {
      title: "Second Obstacle",
      context: "The traveler reveals himself as a rebel against the magistrate. He shares a secret: there's a weapons stash nearby.",
      narration: "Placeholder.",
      choices: [
        { text: "Use this knowledge for a direct strike.", next: 15, stat: "Bravery" },
        { text: "Use it to plan sabotage.", next: 16, stat: "Logic" }
      ]
    },

    14: {
      title: "Second Obstacle",
      context: "Without warning, the magistrate’s forces arrive in full. The Guardian must act fast to respond.",
      narration: "Placeholder.",
      choices: [
        { text: "Lead a brave counterattack.", next: 15, stat: "Bravery" },
        { text: "Use what you’ve learned to outmaneuver them.", next: 16, stat: "Logic" }
      ]
    },

    15: {
      title: "Fight with Willpower",
      context: "The Guardian leads the villagers in a desperate, courageous stand against overwhelming odds.",
      narration: "Placeholder.",
      choices: [
        { text: "Trigger a side quest.", next: 17 }
      ]
    },

    16: {
      title: "Fight with Rationale",
      context: "Using enemy plans and terrain, the Guardian strikes with precision—crippling the invading force.",
      narration: "Placeholder.",
      choices: [
        { text: "Uncover hidden insight.", next: 19 }
      ]
    },

    17: {
      title: "Side Quest Trigger 2",
      context: "A former enemy soldier surrenders. He begs for protection for his injured sister. Will you help?",
      narration: "Placeholder.",
      choices: [
        { text: "Shelter them.", next: 18 },
        { text: "Turn them away.", next: 18 }
      ]
    },

    18: {
      title: "Persevered to Victory",
      context: "Through compassion or battle, the Guardian secures a second win—but the final storm is coming.",
      narration: "Placeholder.",
      choices: [
        { text: "Prepare for what's next.", next: 20 }
      ]
    },

    19: {
      title: "Discovered Key Knowledge",
      context: "The Guardian uncovers a conspiracy—foreign dealers have been supplying both sides. There's a way to collapse the entire operation.",
      narration: "Placeholder.",
      choices: [
        { text: "Prepare for the climax.", next: 20 }
      ]
    },

    20: {
      title: "Climax / Rising Tension",
      context: "The magistrate himself enters Ashigara, flanked by his elite guard and a terrifying war machine. All paths now converge.",
      narration: "Placeholder.",
      choices: [
        { text: "Steel yourself.", next: 21 }
      ]
    },

    21: {
      title: "Crisis",
      context: "The Guardian must now choose how to face the final conflict—with the sword, the mind, or something deeper.",
      narration: "Placeholder.",
      choices: [
        { text: "Face him head-on.", next: 22, stat: "Bravery" },
        { text: "Outwit and disarm him.", next: 23, stat: "Logic" },
        { text: "Walk away and let history decide.", next: 24 },
        { text: "Appeal to empathy and shared pain.", next: 25 }
      ]
    },

    22: {
      title: "Victory by Determination",
      context: "Through raw strength and fierce will, the Guardian brings down the magistrate and his war machine.",
      narration: "Placeholder.",
      choices: [
        { text: "Complete the tale.", next: 26 }
      ]
    },

    23: {
      title: "Victory by Mind Power",
      context: "The Guardian orchestrates a final trap, toppling the magistrate without ever raising his blade.",
      narration: "Placeholder.",
      choices: [
        { text: "Complete the tale.", next: 27 }
      ]
    },

    24: {
      title: "Game Over – Neutral Path",
      context: "The Guardian walks into the forest, choosing exile over war. The village’s fate remains uncertain.",
      narration: "Placeholder.",
      choices: [
        { text: "Complete the tale.", next: 28 }
      ]
    },

    25: {
      title: "Victory by Harmony",
      context: "By reminding even the enemy of their humanity, the Guardian stops the conflict with nothing but words and presence.",
      narration: "Placeholder.",
      choices: [
        { text: "Complete the tale.", next: 29 }
      ]
    },

    26: {
      title: "Ending: Peace through Power",
      context: "The village survives through strength. The Guardian becomes legend, a silent warrior of old times.",
      narration: "Placeholder.",
      choices: []
    },

    27: {
      title: "Ending: Peace through Knowledge",
      context: "The Guardian's strategy brings peace. He retires a teacher, passing on his wisdom to the next generation.",
      narration: "Placeholder.",
      choices: []
    },

    28: {
      title: "Ending: Quest Failed, but Lessons Learned",
      context: "The Guardian left the path unfinished—but those who watched him remember what almost was.",
      narration: "Placeholder.",
      choices: []
    },

    29: {
      title: "Ending: Peace through Collaboration",
      context: "In the end, not power, nor plans—but empathy saved the village. A new future is born together.",
      narration: "Placeholder.",
      choices: []
    }
  }
};

function startSelectedPlot() {
  const selected = document.getElementById('plot-select').value;
  quests = JSON.parse(JSON.stringify(plotTemplates[selected])); // Deep copy
  currentQuestId = 1;
  resetStats();
  renderQuest();
  numberOfChapters = Object.keys(plotTemplates[selected]).length;
}

async function renderQuest() {
  const quest = quests[currentQuestId];
  document.getElementById('quest-title').textContent = quest.title;
  document.getElementById('quest-context').textContent = "Quest context: " + quest.context;

  const container = document.getElementById('choices-container');
  container.innerHTML = ""; // Clear choices immediately

  // Special logic for final quest  based on player stats
  if (currentQuestId === numberOfChapters) {
    handleFinalQuest();
    return;
  }

  // Load narration and THEN render choices
  await loadNarration(quest);
  renderChoices(quest, container);
  updateStats();
}

function renderChoices(quest, container) {
  if (!narrationDone) return;

  container.innerHTML = "";

  quest.choices.forEach((choice, index) => {
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
    const result = await fetchPlotNode(quest.title, thematicOverview, storySummary, quest.context); // your function

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

async function fetchPlotNode(plotName, thematicOverview, storySummary, currentContext) {
  const response = await fetch('/generate_node', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plot_name: plotName,
      thematic_overview: thematicOverview,
      story_summary: storySummary,
      current_context: currentContext
    })
  });

  if (!response.ok) {
    console.error("Server error:", await response.text());
    return;
  }

  const data = await response.json();
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
