const params = new URLSearchParams(window.location.search);
const rawData = params.get("data");
let gameData = null;
let thematicOverview = ``;
/*let thematicOverview = `
In a world teetering on the brink of collapse, a Dreamweaver stands as a silent guardian of memory, vision, and meaning. Set in 14th-century Moorish Andalusia, during the final flickers of Muslim rule, the story follows a court astronomer and mystic who lives within the elegant walls of the Alhambra. Surrounded by the beauty of art, science, and poetry, she is haunted not just by dreams of falling stars and vanishing cities, but by a deeper fear—that centuries of knowledge, wisdom, and culture may vanish with her generation.

As Christian forces close in and internal divisions grow sharper, she receives a vision of an ancient manuscript said to contain the essence of her civilization’s accumulated wisdom. This vision sets her on a perilous journey: not across physical landscapes, but through the hidden corridors of the palace, through courtly politics, and through the cryptic language of dreams. At every turn, she must choose between boldness and subtlety—between open defiance and secret action. While some challenges call for courage, others demand cunning and metaphor, for the world she navigates is one of veiled truths, jealous rivals, and invisible dangers.

The Dreamweaver’s arc is not one of brute strength or grand conquest, but of inner clarity and symbolic resistance. She battles not monsters of flesh, but the erasure of memory, the apathy of power, and the silence that follows cultural collapse. Her ultimate victory—whether through stealth or diplomacy—lies in preserving a spark of knowledge for a future she may never see. In doing so, she fulfills her role not just as a mystic, but as a bridge between worlds: between science and poetry, between fading history and enduring legacy.
`;*/

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

    thematicOverview = gameData.start.thematic_overview;
    console.log("🎭 Thematic Overview:", thematicOverview);

  } catch (err) {
    console.error("❌ Failed to parse game data:", err);
  }
} else {
  console.warn("⚠️ No game data received.");
}

const currentPlotName = "Overcoming the Monster";
const mermaidCode = `
graph TD
    A[Start] --> B{Obstacle 1}
    B -->|Bravery| C[Fight]
    B -->|Logic| D[Evade/Outsmart]

    C --> E{Obstacle 2}
    D --> E

    E -->|Bravery| F[Push Through]
    E -->|Logic| G[Find Solution]

    F --> H{Final Challenge}
    G --> H

    H -->|Bravery| I[Win by Strength]
    H -->|Logic| J[Win by Strategy]
    H -->|Quit| K[Give Up]
`;

const plotTemplates = 
{
  1: {
    title: "Start / Intro",
    context: "Placeholder.",
    narration: "Placeholder",
    dialogue: ["Placeholder"],
    choices: [
      { text: "Placeholder", next: 2 },
      { text: "Placeholder", next: 2 }
    ]
  },
  2: {
    title: "Call to Action",
    context: "Placeholder",
    narration: "Placeholder",
    dialogue: ["Placeholder"],
    choices: [
      { text: "Placeholder", next: 3 },
      { text: "Placeholder", next: 3 }
    ]
  },
  3: {
    title: "Dialogue: Voices of urgency",
    context: "Placeholder",
    narration: "Placeholder",
    dialogue: ["Placeholder"],
    choices: [
      { text: "Placeholder", next: 4 },
      { text: "Placeholder", next: 5 }
    ]
  },
  // please continue generating 4, 5, 6, etc until the end.
  11: {
    title: "Logic Ending",
    context: "Placeholder",
    narration: "Placeholder",
    dialogue: ["Placeholder"],
    choices: []
  },  
  12: {
    title: "Empathy Ending",
    context: "Placeholder",
    narration: "Placeholder",
    dialogue: ["Placeholder"],
    choices: []
  }
};  

async function startSelectedPlot() {
  const selected = document.getElementById('plot-select').value;
  document.getElementById("loadingMessage").style.display = "block";

  // Call the new generator function
  const generatedTree = await loadFullQuestTree(
    selected,
    thematicOverview,
    mermaidCode,
    plotTemplates
  );

  // Hide loading message
  document.getElementById("loadingMessage").style.display = "none";

  if (!generatedTree) {
    alert("Failed to generate quest. Please try again.");
    return;
  }

  // to sanitize the LLM response
  const cleanedPlot = sanitizePlotData(generatedTree, plotTemplates);

  quests = cleanedPlot;
  currentQuestId = 1;

  console.log("Generated quests:\n", JSON.stringify(quests, null, 2));

  resetStats();
  numberOfChapters = Object.keys(quests).length;
  renderQuest();
}

async function renderQuest() {
  const quest = quests[currentQuestId];
  document.getElementById('quest-title').textContent = quest.title;
  document.getElementById('quest-context').textContent = "Quest context: " + quest.context;
  document.getElementById("dialogue").innerHTML = "";
  const container = document.getElementById('choices-container');
  container.innerHTML = ""; // Clear choices immediately

  // Special logic for final quest  based on player stats
  if (currentQuestId === numberOfChapters) {
    handleFinalQuest();
    return;
  }

  // Load narration and THEN render choices
  await loadNarration(quest);

  // Render dialogue if exists
  if (quest.dialogue) {
    renderDialogue(quest.dialogue);
  }

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

function renderDialogue(dialogueArray) {
  const dialogueContainer = document.getElementById("dialogue");
  dialogueContainer.innerHTML = ""; // Clear old content

  dialogueArray.forEach(line => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${line.speaker}:</strong> ${line.text}`;
    dialogueContainer.appendChild(p);
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

async function loadFullQuestTree(plotName, thematicOverview, mermaidCode, plotTemplateFormat, maxRetries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/generate_full_plot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plot_name: plotName,
          thematic_overview: thematicOverview,
          mermaid_code: mermaidCode,
          plot_template_format: plotTemplateFormat
        })
      });

      if (!response.ok) {
        console.warn(`Attempt ${attempt}: Server responded with status ${response.status}`);
        continue;
      }

      let data;
      try {
        data = await response.json(); // JSON parsing happens here
      } catch (jsonErr) {
        console.warn(`Attempt ${attempt}: Invalid JSON received`);
        continue;
      }

      // If it gets here, JSON is valid
      return data.plot_template;

    } catch (err) {
      console.warn(`Attempt ${attempt}: Network or fetch error:`, err.message);
    }

    // Delay before retrying (except after the last attempt)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } else {
      console.error("❌ Max retries reached. Failed to load valid JSON.");
    }
  }

  return null; // If all retries failed
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

function sanitizePlotData(rawPlotData, template) {
  const sanitizedPlot = {};

  for (const key in template) {
    const templateEntry = template[key];
    const rawEntry = rawPlotData[key] || {};

    // Log missing or malformed entries
    if (!rawPlotData[key]) {
      console.warn(`⚠️ Missing plot node ${key}, using template fallback.`);
    }

    if (!Array.isArray(rawEntry.dialogue)) {
      console.warn(`⚠️ Dialogue for node ${key} is not an array, falling back to template.`);
    }

    if (!Array.isArray(rawEntry.choices)) {
      console.warn(`⚠️ Choices for node ${key} are not an array, falling back to template.`);
    }

    sanitizedPlot[key] = {
      title: rawEntry.title || templateEntry.title,
      context: rawEntry.context || templateEntry.context,
      narration: rawEntry.narration || templateEntry.narration,
      dialogue: Array.isArray(rawEntry.dialogue) ? rawEntry.dialogue : templateEntry.dialogue,
      choices: Array.isArray(rawEntry.choices)
        ? rawEntry.choices.map(choice => ({
            text: choice.text || "Choose.",
            next: typeof choice.next === "number" ? choice.next : null
          }))
        : templateEntry.choices
    };
  }

  console.log("🧹 Sanitized plot structure:", sanitizedPlot);
  return sanitizedPlot;
}
