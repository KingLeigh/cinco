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

function getLocalToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

// Determine date: ?date= param or today
function getDate() {
  const param = new URLSearchParams(window.location.search).get('date');
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) return param;
  return getLocalToday();
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
    if (json && !json.error && json.eventName && json.eventName.trim()) {
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
  document.querySelector('.location-badge').textContent = data.eventShortName || data.eventName;

  // Card 01
  const card1 = `<h1>${data.eventName}</h1>` +
    (data.subTitle ? `<h2>${data.subTitle}</h2>` : '') +
    (data.location ? `<h2><em>${data.location}</em></h2>` : '') +
    '<hr>' +
    `${data.eventHtmlPayload}`;
  document.getElementById('card-celebrating').innerHTML = card1;

  // Card 02
  document.getElementById('card-drinking').innerHTML = data.drinkHtmlPayload;

  // Card 03 — hide entirely if no moreInfoHtmlPayload
  const cardHowWrapper = document.getElementById('card-how-wrapper');
  const hasMoreInfo = data.moreInfoHtmlPayload && data.moreInfoHtmlPayload.trim();
  cardHowWrapper.style.display = hasMoreInfo ? '' : 'none';
  if (hasMoreInfo) {
    document.getElementById('card-how').innerHTML = data.moreInfoHtmlPayload;
  }

  // Sync dot count to visible cards and re-attach click listeners
  const visibleCards = document.querySelectorAll('.card:not([style*="display: none"])');
  const dotsContainer = document.getElementById('dots');
  dotsContainer.innerHTML = Array.from(visibleCards).map((_, i) =>
    `<span class="dot${i === 0 ? ' active' : ''}"></span>`
  ).join('');
  setupDots();

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
  navigateToDate(getLocalToday());
});

document.getElementById('jump-next').addEventListener('click', () => {
  navigateToDate(getLocalToday());
});

function updateTodayJumps(date) {
  const today = getLocalToday();
  document.getElementById('jump-prev').classList.toggle('hidden', date <= today);
  document.getElementById('jump-next').classList.toggle('hidden', date >= today);
}

window.addEventListener('popstate', () => {
  loadDate(getDate());
});

// Dot navigation
const container = document.getElementById('cards');

function updateDots() {
  const dots = document.querySelectorAll('.dot');
  const scrollLeft = container.scrollLeft;
  const cardWidth = container.querySelector('.card').offsetWidth;
  const gap = parseFloat(getComputedStyle(container).gap) || 16;
  const index = Math.round(scrollLeft / (cardWidth + gap));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
}

function setupDots() {
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const cardWidth = container.querySelector('.card').offsetWidth;
      const gap = parseFloat(getComputedStyle(container).gap) || 16;
      container.scrollTo({ left: i * (cardWidth + gap), behavior: 'smooth' });
    });
  });
}

container.addEventListener('scroll', updateDots, { passive: true });
