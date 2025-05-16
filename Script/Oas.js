let isRequestInProgress = false;
let lastRequestTime = 0;
const COOLDOWN_MS = 5000;
let triggerTimeoutId = null;

async function sendToCustomAPI(promptText, regNo) {
  try {
    const response = await fetch("https://api.checkscript.site/api/v3/modal/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "registration-number": regNo
      },
      body: JSON.stringify({ prompt: promptText })
    });
    if (response.status === 429) return "";
    const data = await response.json();
    return data?.answer  ?.trim() || "";
  } catch {
    return "";
  }
}

function showRegMismatchNotification(questionRow) {
  const questionDivs = questionRow.querySelectorAll("div");
  const lastQuestionDiv = questionDivs[questionDivs.length - 1];
  const originalText = lastQuestionDiv.innerText;
  const originalColor = questionRow.style.backgroundColor;

  questionRow.style.backgroundColor = "#ffeeee";
  lastQuestionDiv.innerText = originalText + " - Contact for API";

  setTimeout(() => {
    questionRow.style.backgroundColor = originalColor;
    lastQuestionDiv.innerText = originalText;
  }, 1000);
}

async function executeAnswerFlow() {
  if (isRequestInProgress) return;
  const now = Date.now();
  if (now - lastRequestTime < COOLDOWN_MS) return;
  isRequestInProgress = true;
  lastRequestTime = now;

  try {
    const questionRow = document.getElementById("QuestionRow");
    const optionCol = document.getElementById("optionCol");
    const nameLabel = document.getElementById("Name");

    if (!questionRow || !optionCol || !nameLabel) return;

    const nameText = nameLabel.textContent.trim();
    const regNo = nameText.split(",")[0].trim();

    if (!nameText.includes(regNo)) {
      showRegMismatchNotification(questionRow);
      return;
    }

    
    const questionText = Array.from(questionRow.querySelectorAll("div"))
      .map(div => div.innerText.trim())
      .filter(t => t && !t.startsWith("Q:"))
      .join(" ")
      .trim();

    const labels = optionCol.querySelectorAll("label");
    const options = Array.from(labels).map(label => label.textContent.trim());

    if (!questionText || options.length === 0) return;
    const prompt = `${questionText} ${options.join(" ")}`;
    console.log("Sending prompt to API:", prompt);

    
    const response = await sendToCustomAPI(prompt, regNo);
    console.log("Received API response:", response);

    
    const raw = response.trim();
    const aiAnswer = raw.toLowerCase().replace(/\./g, "").trim();
    console.log("Normalized AI answer:", aiAnswer);

    let matched = null;

   
    for (const label of labels) {
      const text = label.textContent.trim();
      const m = text.match(/^([A-Da-d])[\.\)]/);
      if (m && m[1].toLowerCase() === aiAnswer) {
        matched = label;
        console.log("Matched by letter prefix:", m[1]);
        break;
      }
    }

   
    if (!matched) {
      const lowerRaw = raw.toLowerCase();
      for (const label of labels) {
        const textLower = label.textContent.toLowerCase();
        if (textLower.includes(lowerRaw) || lowerRaw.includes(textLower)) {
          matched = label;
          console.log("Matched by text content:", label.textContent.trim());
          break;
        }
      }
    }

    
    if (!matched && aiAnswer.length === 1) {
      const idx = aiAnswer.charCodeAt(0) - 97; // 'a'→0
      if (idx >= 0 && idx < labels.length) {
        matched = labels[idx];
        console.log("Matched by index fallback (letter→position):", aiAnswer);
      }
    }

   
    if (matched) {
      const input = matched.querySelector('input[type="radio"]');
      if (input) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        matched.scrollIntoView({ behavior: "smooth", block: "center" });
        console.log("Option selected:", matched.textContent.trim());
      } else {
        console.error("Matched label but no radio input:", matched.outerHTML);
      }
    } else {
      console.warn("No matching option found for AI answer:", raw);
    }

  } catch (error) {
    console.error("Error in executeAnswerFlow:", error);
  } finally {
    setTimeout(() => { isRequestInProgress = false; }, COOLDOWN_MS);
  }
}

function triggerAnswerFlow() {
  if (triggerTimeoutId) clearTimeout(triggerTimeoutId);
  if (!isRequestInProgress) {
    triggerTimeoutId = setTimeout(() => {
      executeAnswerFlow();
      triggerTimeoutId = null;
    }, 300);
  }
}

function setupKeyboardTrigger() {
  let pCount = 0, last = 0;
  const WINDOW = 2000;
  document.addEventListener('keydown', e => {
    const now = Date.now();
    if (now - last > WINDOW) pCount = 0;
    last = now;
    if (e.key.toLowerCase() === 'p') {
      pCount++;
      if (pCount >= 3) {
        pCount = 0;
        triggerAnswerFlow();
      }
    }
  });
}

function setupClickTrigger() {
  const div = document.querySelector(".col-md-4.col-sm-4.col-xs-12");
  if (div) div.addEventListener("click", triggerAnswerFlow);
}

setupClickTrigger();
setupKeyboardTrigger();
