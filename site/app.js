const WORKER_URL = 'https://cinco-api.leigh-herbert.workers.dev';

const PLACEHOLDER_DATA = {
  "subTitle": "The best drinking day of the week",
  "location": "Worldwide",
  "drinkHtmlPayload": "Anything your heart desires, there are no rules today! <hr> We recommend an ice cold <b>Bud Light</b> - it's an excellent vintage this year.",
  "eventHtmlPayload": "<i>No special event data was found for this day.</i><hr>But that's just a great excuse to make some traditions of your own. <b>Cheers!</b>",
  "moreInfoHtmlPayload": "Some large observational studies have suggested that <b>moderate drinkers</b> might outlive both heavy drinkers and non-drinkers.<hr>Archaeological evidence suggests beer production dates back over <b>13,000 years</b>. In ancient Mesopotamia, beer was a daily staple and even used as wages.<hr><b>Winston Churchill</b> reportedly drank throughout the day while leading WWII"
};

function getWeekdayName(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long' });
}

// Determine date: ?date= param or today
function getDate() {
  const param = new URLSearchParams(window.location.search).get('date');
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) return param;
  return new Date().toISOString().slice(0, 10);
}

function formatDateDisplay(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
}

async function loadDate(date) {
  let data = null;

  try {
    const response = await fetch(`${WORKER_URL}?date=${date}`);
    const json = await response.json();
    if (json && !json.error && json.eventName) {
      data = json;
    }
  } catch (e) {
    // API unavailable — fall through to placeholder
  }

  if (!data) {
    const weekday = getWeekdayName(date);
    data = {
      ...PLACEHOLDER_DATA,
      eventName: weekday,
      eventShortName: weekday.toUpperCase()
    };
  }

  // Header
  document.querySelector('.date-display').textContent = formatDateDisplay(date);
  document.querySelector('.location-badge').textContent = data.eventShortName || '';

  // Card 01
  document.getElementById('card-celebrating').innerHTML =
    `<h1>${data.eventName}</h1>` +
    `<h2>${data.subTitle}</h2>` +
    `<h2><em>${data.location}</em></h2>` +
    '<hr>' +
    `${data.eventHtmlPayload}`;

  // Cards 02–03
  document.getElementById('card-drinking').innerHTML = data.drinkHtmlPayload;
  document.getElementById('card-how').innerHTML = data.moreInfoHtmlPayload;

  // Open all links in new tab
  document.querySelectorAll('.card-body a').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });

  // Reset scroll to first card
  document.getElementById('cards').scrollTo({ left: 0, behavior: 'smooth' });

  updateTodayJumps(date);
}

loadDate(getDate());

// Date navigation
function shiftDate(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function navigateToDate(isoDate) {
  const url = new URL(window.location.href);
  url.searchParams.set('date', isoDate);
  history.pushState({}, '', url.toString());
  loadDate(isoDate);
}

document.getElementById('prev-day').addEventListener('click', () => {
  navigateToDate(shiftDate(getDate(), -1));
});

document.getElementById('next-day').addEventListener('click', () => {
  navigateToDate(shiftDate(getDate(), 1));
});

document.getElementById('jump-prev').addEventListener('click', () => {
  navigateToDate(new Date().toISOString().slice(0, 10));
});

document.getElementById('jump-next').addEventListener('click', () => {
  navigateToDate(new Date().toISOString().slice(0, 10));
});

function updateTodayJumps(date) {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('jump-prev').classList.toggle('hidden', date <= today);
  document.getElementById('jump-next').classList.toggle('hidden', date >= today);
}

window.addEventListener('popstate', () => {
  loadDate(getDate());
});

// Dot navigation
const container = document.getElementById('cards');
const dots = document.querySelectorAll('.dot');

function updateDots() {
  const scrollLeft = container.scrollLeft;
  const cardWidth = container.querySelector('.card').offsetWidth;
  const gap = parseFloat(getComputedStyle(container).gap) || 16;
  const index = Math.round(scrollLeft / (cardWidth + gap));

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

container.addEventListener('scroll', updateDots, { passive: true });

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    const cardWidth = container.querySelector('.card').offsetWidth;
    const gap = parseFloat(getComputedStyle(container).gap) || 16;
    container.scrollTo({
      left: i * (cardWidth + gap),
      behavior: 'smooth'
    });
  });
});
