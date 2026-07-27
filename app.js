const DAY_MS = 86_400_000;
const STORAGE_KEY = "overseas-career-checklist-v2";
const departure = document.querySelector("#departure");
const arrival = document.querySelector("#arrival");
const result = document.querySelector("#result");
const dateInputs = [departure, arrival];

function normalizeDate(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return year >= 1000 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}

function shiftDate(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

const formatDate = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
}).format;

dateInputs.forEach((input) => {
  input.addEventListener("input", () => {
    input.value = normalizeDate(input.value);
    input.removeAttribute("aria-invalid");
  });
  input.addEventListener("blur", () => {
    input.toggleAttribute(
      "aria-invalid",
      Boolean(input.value && !parseDate(input.value)),
    );
  });
});

document.querySelector("#calculate").addEventListener("click", () => {
  const departureDate = parseDate(departure.value);
  const arrivalDate = parseDate(arrival.value);

  if (!departure.value || !arrival.value) {
    result.textContent = "출국일과 입국일을 모두 입력해 주세요.";
    return;
  }
  if (!departureDate || !arrivalDate) {
    departure.toggleAttribute("aria-invalid", !departureDate);
    arrival.toggleAttribute("aria-invalid", !arrivalDate);
    result.textContent =
      "날짜를 YYYY-MM-DD 형식으로 정확히 입력해 주세요. 예: 2026-12-12";
    return;
  }
  if (arrivalDate <= departureDate) {
    result.textContent = "입국일은 출국일보다 늦어야 합니다.";
    return;
  }

  const start = shiftDate(departureDate, 1);
  const end = shiftDate(arrivalDate, -1);
  if (end < start) {
    result.textContent = "출국과 입국 사이에 신고할 국외경력일이 없습니다.";
    return;
  }

  const days = Math.floor((end - start) / DAY_MS) + 1;
  result.innerHTML = `신고기간은 <strong>${formatDate(start)} ~ ${formatDate(end)}</strong>이며, 총 ${days.toLocaleString("ko-KR")}일입니다.`;
});

const boxes = [...document.querySelectorAll("[data-check]")];
const progress = document.querySelector("#progress");
const ring = document.querySelector("#progressRing");
const progressTitle = document.querySelector("#progressTitle");
const progressText = document.querySelector("#progressText");

function loadChecklist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

function updateProgress() {
  const checked = boxes.filter(({ checked: isChecked }) => isChecked).length;
  const remaining = boxes.length - checked;
  const percent = Math.round((checked / boxes.length) * 100);
  progress.textContent = `${percent}%`;
  ring.style.setProperty("--progress", `${percent * 3.6}deg`);

  if (percent === 100) {
    progressTitle.textContent = "제출 준비가 완료됐습니다";
    progressText.textContent =
      "작성본과 증빙을 담당자에게 안전하게 전달해 주세요.";
  } else if (percent >= 50) {
    progressTitle.textContent = "절반 이상 준비됐습니다";
    progressText.textContent = `남은 ${remaining}개 항목을 확인해 주세요.`;
  } else {
    progressTitle.textContent = checked
      ? "차근차근 준비 중입니다"
      : "준비를 시작해 주세요";
    progressText.textContent = checked
      ? `남은 ${remaining}개 항목이 있습니다.`
      : "항목을 하나씩 확인하면 누락을 줄일 수 있습니다.";
  }
}

const saved = loadChecklist();
boxes.forEach((box) => {
  box.checked = Boolean(saved[box.dataset.check]);
  box.addEventListener("change", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        Object.fromEntries(
          boxes.map((item) => [item.dataset.check, item.checked]),
        ),
      ),
    );
    updateProgress();
  });
});

document.querySelector("#resetChecklist").addEventListener("click", () => {
  boxes.forEach((box) => {
    box.checked = false;
  });
  localStorage.removeItem(STORAGE_KEY);
  updateProgress();
});

updateProgress();
