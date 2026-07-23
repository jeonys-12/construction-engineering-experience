const departure = document.querySelector("#departure");
const arrival = document.querySelector("#arrival");
const result = document.querySelector("#result");
const dateInputs = [departure, arrival];

const normalizeDateInput = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const parseDateInput = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000) return null;

  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
};

dateInputs.forEach((input) => {
  input.addEventListener("input", () => {
    input.value = normalizeDateInput(input.value);
    input.removeAttribute("aria-invalid");
  });

  input.addEventListener("blur", () => {
    if (input.value && !parseDateInput(input.value)) {
      input.setAttribute("aria-invalid", "true");
    }
  });
});

const formatDate = (date) => new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
}).format(date);

document.querySelector("#calculate").addEventListener("click", () => {
  if (!departure.value || !arrival.value) {
    result.textContent = "출국일과 입국일을 모두 입력해 주세요.";
    return;
  }
  const start = parseDateInput(departure.value);
  const end = parseDateInput(arrival.value);
  if (!start || !end) {
    if (!start) departure.setAttribute("aria-invalid", "true");
    if (!end) arrival.setAttribute("aria-invalid", "true");
    result.textContent = "날짜를 YYYY-MM-DD 형식으로 정확히 입력해 주세요. 예: 2026-12-12";
    return;
  }
  departure.removeAttribute("aria-invalid");
  arrival.removeAttribute("aria-invalid");
  if (end <= start) {
    result.textContent = "입국일은 출국일보다 늦어야 합니다.";
    return;
  }
  start.setUTCDate(start.getUTCDate() + 1);
  end.setUTCDate(end.getUTCDate() - 1);
  if (end < start) {
    result.textContent = "출국과 입국 사이에 신고할 국외경력일이 없습니다.";
    return;
  }
  const days = Math.floor((end - start) / 86400000) + 1;
  result.innerHTML = `신고기간은 <strong>${formatDate(start)} ~ ${formatDate(end)}</strong>이며, 총 ${days.toLocaleString("ko-KR")}일입니다.`;
});

const boxes = [...document.querySelectorAll("[data-check]")];
const progress = document.querySelector("#progress");
const ring = document.querySelector("#progressRing");
const title = document.querySelector("#progressTitle");
const text = document.querySelector("#progressText");
const storageKey = "overseas-career-checklist-v1";

const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
boxes.forEach((box) => { box.checked = Boolean(saved[box.dataset.check]); });

function updateProgress() {
  const checked = boxes.filter((box) => box.checked).length;
  const percent = Math.round((checked / boxes.length) * 100);
  progress.textContent = `${percent}%`;
  ring.style.setProperty("--progress", `${percent * 3.6}deg`);
  if (percent === 100) {
    title.textContent = "제출 준비가 완료됐습니다";
    text.textContent = "작성본과 증빙을 담당자에게 안전하게 전달해 주세요.";
  } else if (percent >= 50) {
    title.textContent = "절반 이상 준비됐습니다";
    text.textContent = `남은 ${boxes.length - checked}개 항목을 확인해 주세요.`;
  } else {
    title.textContent = checked ? "차근차근 준비 중입니다" : "준비를 시작해 주세요";
    text.textContent = checked ? `남은 ${boxes.length - checked}개 항목이 있습니다.` : "항목을 하나씩 확인하면 누락을 줄일 수 있습니다.";
  }
}

boxes.forEach((box) => box.addEventListener("change", () => {
  const state = Object.fromEntries(boxes.map((item) => [item.dataset.check, item.checked]));
  localStorage.setItem(storageKey, JSON.stringify(state));
  updateProgress();
}));

document.querySelector("#resetChecklist").addEventListener("click", () => {
  boxes.forEach((box) => { box.checked = false; });
  localStorage.removeItem(storageKey);
  updateProgress();
});

updateProgress();
