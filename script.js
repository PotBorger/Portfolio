const revealItems = document.querySelectorAll(".reveal");
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sections = [...document.querySelectorAll("main section[id]")];
const year = document.getElementById("year");
const typingRoot = document.querySelector("[data-typing-test]");
const openTypingButton = document.querySelector('[data-role="open-typing"]');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navLinks.length > 0) {
  navLinks[0].setAttribute("aria-current", "true");
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -32px 0px",
    }
  );

  revealItems.forEach((item) => {
    if (!item.classList.contains("is-visible")) {
      revealObserver.observe(item);
    }
  });

  const linkMap = new Map(
    navLinks.map((link) => [link.getAttribute("href").slice(1), link])
  );

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleSection) {
        return;
      }

      navLinks.forEach((link) => link.removeAttribute("aria-current"));
      const activeLink = linkMap.get(visibleSection.target.id);

      if (activeLink) {
        activeLink.setAttribute("aria-current", "true");
      }
    },
    {
      threshold: [0.2, 0.5, 0.75],
      rootMargin: "-30% 0px -45% 0px",
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (typingRoot) {
  initTypingTest(typingRoot, openTypingButton);
}

function initTypingTest(root, openButton) {
  const surface = root.querySelector('[data-role="surface"]');
  const input = root.querySelector('[data-role="input"]');
  const passage = root.querySelector('[data-role="passage"]');
  const caret = root.querySelector('[data-role="caret"]');
  const status = root.querySelector('[data-role="status"]');
  const hint = root.querySelector('[data-role="hint"]');
  const resetButton = root.querySelector('[data-role="reset"]');
  const wpmValue = root.querySelector('[data-role="wpm"]');
  const accuracyValue = root.querySelector('[data-role="accuracy"]');
  const timeValue = root.querySelector('[data-role="time"]');
  const errorValue = root.querySelector('[data-role="errors"]');
  const durationButtons = [
    ...root.querySelectorAll("[data-seconds]"),
  ];

  if (
    !surface ||
    !input ||
    !passage ||
    !caret ||
    !status ||
    !hint ||
    !resetButton ||
    !wpmValue ||
    !accuracyValue ||
    !timeValue ||
    !errorValue
  ) {
    return;
  }

  const SENTENCE_BANK = [
    "Clean interfaces let the hard part of the work stay in focus.",
    "I like tools that make messy systems feel calm and readable.",
    "Smooth typing feels best when the screen stays quiet and direct.",
    "A good dashboard should explain itself before anyone asks for help.",
    "Reliable software usually comes from small careful decisions repeated well.",
    "Developer tools earn trust when they remove friction without adding noise.",
    "Fast feedback turns debugging from a chore into a rhythm.",
    "Thoughtful product work lives somewhere between empathy and precision.",
    "Clear data shapes better questions before it even shapes answers.",
    "The best internal tools save hours by making intent obvious.",
    "Tiny interaction details matter more when people use them every day.",
    "Good code review is part systems thinking and part product judgment.",
    "I enjoy building interfaces that stay stable under real complexity.",
    "A measured caret and steady tempo can make typing surprisingly fun.",
    "Useful software often feels simple only after a lot of careful work.",
    "Polish is usually just a hundred small rough edges removed on purpose.",
    "Speed means more when the experience still feels calm and controlled.",
    "Readable architecture helps teams move faster with less second guessing.",
    "The strongest tools are clear enough to teach themselves over time.",
    "I care a lot about details that disappear once the product feels right.",
  ];

  const state = {
    seconds: 15,
    targetText: "",
    typedText: "",
    charEls: [],
    endMarker: null,
    sentenceDeck: [],
    sentenceCursor: 0,
    completedSentences: 0,
    startTime: 0,
    endTime: 0,
    rafId: 0,
    isRunning: false,
    isFinished: false,
    committedCorrectCount: 0,
    committedTypedCount: 0,
    currentCorrectCount: 0,
    currentErrorCount: 0,
  };

  if (openButton) {
    openButton.addEventListener("click", () => {
      revealTypingTab();
    });
  }

  durationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const seconds = Number(button.dataset.seconds);

      if (!Number.isFinite(seconds) || seconds === state.seconds) {
        return;
      }

      state.seconds = seconds;
      syncDurationButtons();
      resetTest({ freshText: true, focusSurface: true });
    });
  });

  resetButton.addEventListener("click", () => {
    resetTest({ freshText: true, focusSurface: true });
  });

  surface.addEventListener("click", () => {
    focusTypingSurface();
  });

  surface.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      resetTest({ freshText: true, focusSurface: true });
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      focusTypingSurface();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      focusTypingSurface();
      applyTypedValue(state.typedText.slice(0, -1));
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      focusTypingSurface();
      applyTypedValue(state.typedText + event.key);
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      resetTest({ freshText: true, focusSurface: true });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
    }
  });

  input.addEventListener("input", () => {
    if (state.isFinished) {
      input.value = state.typedText;
      return;
    }

    applyTypedValue(normalizeValue(input.value));
  });

  input.addEventListener("paste", (event) => {
    event.preventDefault();
  });

  input.addEventListener("focus", updateFocusState);
  input.addEventListener("blur", () => {
    window.setTimeout(updateFocusState, 0);
  });

  surface.addEventListener("focus", updateFocusState);
  surface.addEventListener("blur", () => {
    window.setTimeout(updateFocusState, 0);
  });

  window.addEventListener("resize", () => {
    requestAnimationFrame(updateCaret);
  });

  syncDurationButtons();
  resetTest({ freshText: true, focusSurface: false });

  function focusTypingSurface() {
    if (root.hidden) {
      revealTypingTab({ scroll: false });
    }

    if (state.isFinished) {
      resetTest({ freshText: true, focusSurface: false });
    }

    input.focus();
    updateFocusState();
  }

  function resetTest({ freshText = false, focusSurface = false } = {}) {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }

    state.rafId = 0;
    state.isRunning = false;
    state.isFinished = false;
    state.startTime = 0;
    state.endTime = 0;
    state.typedText = "";
    state.completedSentences = 0;
    state.committedCorrectCount = 0;
    state.committedTypedCount = 0;
    state.currentCorrectCount = 0;
    state.currentErrorCount = 0;

    root.classList.remove("is-running", "is-finished");

    if (freshText || !state.targetText) {
      resetSentenceDeck();
      state.targetText = nextSentence();
      renderPassage();
    } else {
      updateCharacterState();
    }

    input.value = "";
    updateMetrics(0);
    updateStatus();
    requestAnimationFrame(updateCaret);

    if (focusSurface) {
      surface.focus();
    }
  }

  function resetSentenceDeck() {
    state.sentenceDeck = shuffle([...SENTENCE_BANK]);
    state.sentenceCursor = 0;
  }

  function nextSentence() {
    if (state.sentenceCursor >= state.sentenceDeck.length) {
      const lastSentence =
        state.sentenceDeck[state.sentenceDeck.length - 1] ?? "";

      state.sentenceDeck = shuffle([...SENTENCE_BANK]);
      state.sentenceCursor = 0;

      if (
        state.sentenceDeck.length > 1 &&
        state.sentenceDeck[0] === lastSentence
      ) {
        const first = state.sentenceDeck.shift();

        if (first) {
          state.sentenceDeck.push(first);
        }
      }
    }

    return state.sentenceDeck[state.sentenceCursor++] ?? SENTENCE_BANK[0];
  }

  function renderPassage() {
    const fragment = document.createDocumentFragment();
    const words = state.targetText.split(" ");

    state.charEls = [];
    passage.textContent = "";

    words.forEach((word, wordIndex) => {
      const wordEl = document.createElement("span");
      wordEl.className = "type-word";

      [...word].forEach((char) => {
        const charEl = document.createElement("span");
        charEl.className = "type-char";
        charEl.textContent = char;
        wordEl.appendChild(charEl);
        state.charEls.push(charEl);
      });

      fragment.appendChild(wordEl);

      if (wordIndex < words.length - 1) {
        const spaceEl = document.createElement("span");
        spaceEl.className = "type-space";
        spaceEl.textContent = "\u00a0";
        fragment.appendChild(spaceEl);
        state.charEls.push(spaceEl);
      }
    });

    state.endMarker = document.createElement("span");
    state.endMarker.className = "type-end-marker";
    state.endMarker.textContent = "\u00a0";
    fragment.appendChild(state.endMarker);

    passage.appendChild(fragment);
    updateCharacterState();
  }

  function normalizeValue(value) {
    return value.replace(/[\n\r\t]/g, " ").slice(0, state.targetText.length);
  }

  function applyTypedValue(nextValue) {
    const typedValue = normalizeValue(nextValue);

    if (!state.isRunning && typedValue.length > 0) {
      beginRun();
    }

    state.typedText = typedValue;
    input.value = typedValue;
    updateCharacterState();
    updateMetrics(currentElapsed());
    updateStatus();

    if (typedValue === state.targetText) {
      advanceSentence();
    }
  }

  function beginRun() {
    if (state.isRunning || state.isFinished) {
      return;
    }

    state.isRunning = true;
    state.startTime = performance.now();
    state.endTime = 0;
    root.classList.add("is-running");
    root.classList.remove("is-finished");
    state.rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!state.isRunning) {
      return;
    }

    const elapsed = (now - state.startTime) / 1000;

    if (elapsed >= state.seconds) {
      finishRun("timer", state.seconds);
      return;
    }

    updateMetrics(elapsed);
    updateStatus();
    state.rafId = requestAnimationFrame(tick);
  }

  function finishRun(reason, elapsedOverride) {
    if (state.isFinished) {
      return;
    }

    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }

    state.rafId = 0;
    state.isRunning = false;
    state.isFinished = true;
    state.endTime = elapsedOverride ?? currentElapsed();

    root.classList.remove("is-running");
    root.classList.add("is-finished");

    updateMetrics(state.endTime);
    updateStatus();
    requestAnimationFrame(updateCaret);

    input.blur();

    if (reason === "timer" || reason === "complete") {
      surface.focus();
    }
  }

  function currentElapsed() {
    if (!state.startTime) {
      return 0;
    }

    if (state.endTime) {
      return state.endTime;
    }

    return (performance.now() - state.startTime) / 1000;
  }

  function updateCharacterState() {
    let correctCount = 0;
    let errorCount = 0;
    const activeIndex = Math.min(state.typedText.length, state.charEls.length - 1);

    state.charEls.forEach((charEl, index) => {
      charEl.classList.remove("is-correct", "is-incorrect", "is-current");

      const typedChar = state.typedText[index];

      if (typedChar == null) {
        return;
      }

      if (typedChar === state.targetText[index]) {
        correctCount += 1;
        charEl.classList.add("is-correct");
      } else {
        errorCount += 1;
        charEl.classList.add("is-incorrect");
      }
    });

    if (!state.isFinished && state.charEls[activeIndex]) {
      state.charEls[activeIndex].classList.add("is-current");
    }

    state.currentCorrectCount = correctCount;
    state.currentErrorCount = errorCount;

    // Measure the live character to keep the caret gliding with wrapped text.
    requestAnimationFrame(updateCaret);
  }

  function updateMetrics(elapsedSeconds) {
    const elapsed = Math.max(elapsedSeconds, 0);
    const typedCount = state.committedTypedCount + state.typedText.length;
    const correctCount = state.committedCorrectCount + state.currentCorrectCount;
    const errorCount = state.currentErrorCount;
    const accuracy = typedCount
      ? Math.round((correctCount / typedCount) * 100)
      : 100;
    const wpm =
      elapsed > 0 ? Math.round((correctCount / 5 / elapsed) * 60) : 0;
    const remaining = state.isFinished
      ? 0
      : Math.max(0, state.seconds - elapsed);

    wpmValue.textContent = String(wpm);
    accuracyValue.textContent = `${accuracy}%`;
    timeValue.textContent =
      remaining < 10 ? `${remaining.toFixed(1)}s` : `${Math.ceil(remaining)}s`;
    errorValue.textContent = String(errorCount);
  }

  function updateStatus() {
    const typedCount = state.committedTypedCount + state.typedText.length;
    const correctCount = state.committedCorrectCount + state.currentCorrectCount;
    const accuracy = typedCount
      ? Math.round((correctCount / typedCount) * 100)
      : 100;
    const wpm =
      state.endTime > 0
        ? Math.round((correctCount / 5 / state.endTime) * 60)
        : 0;
    const isFocused =
      document.activeElement === surface || document.activeElement === input;

    if (state.isFinished) {
      status.textContent = `done: ${wpm} wpm / ${accuracy}% accuracy`;
      hint.textContent = "press escape or use new run for another pass";
      return;
    }

    if (state.isRunning) {
      status.textContent = `sentence ${state.completedSentences + 1}`;
      hint.textContent = "stay loose and keep the rhythm";
      return;
    }

    status.textContent = `${state.seconds}s sentence flow`;
    hint.textContent = isFocused
      ? "start typing whenever you are ready"
      : "click here or press enter to focus";
  }

  function updateFocusState() {
    const isFocused =
      document.activeElement === surface || document.activeElement === input;

    root.classList.toggle("is-focused", isFocused);
    updateStatus();
  }

  function updateCaret() {
    const targetEl =
      state.typedText.length < state.charEls.length
        ? state.charEls[state.typedText.length]
        : state.endMarker;

    if (!targetEl) {
      return;
    }

    const passageRect = passage.getBoundingClientRect();
    const rect = targetEl.getBoundingClientRect();
    const x = rect.left - passageRect.left;
    const y = rect.top - passageRect.top;

    caret.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    caret.style.height = `${Math.max(16, Math.round(rect.height))}px`;
  }

  function syncDurationButtons() {
    durationButtons.forEach((button) => {
      const isActive = Number(button.dataset.seconds) === state.seconds;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function advanceSentence() {
    const elapsed = currentElapsed();

    if (elapsed >= state.seconds) {
      finishRun("timer", state.seconds);
      return;
    }

    state.committedCorrectCount += state.targetText.length;
    state.committedTypedCount += state.targetText.length;
    state.completedSentences += 1;
    state.typedText = "";
    input.value = "";
    state.targetText = nextSentence();
    renderPassage();
    updateMetrics(elapsed);
    updateStatus();
  }

  function revealTypingTab({ scroll = true } = {}) {
    if (root.hidden) {
      root.hidden = false;
      root.classList.add("is-visible");
    }

    if (scroll) {
      root.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    }

    window.setTimeout(() => {
      focusTypingSurface();
    }, scroll ? 180 : 0);
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const currentItem = items[index];

      items[index] = items[randomIndex];
      items[randomIndex] = currentItem;
    }

    return items;
  }
}
