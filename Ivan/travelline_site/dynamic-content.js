document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadSiteData();

    renderHero(data.hero);
    initAdvantagesTitleAnimation();
    renderTeam(data.team.filter(function (item) { return item.active !== false; }));
    initTeamVkLogoHover();
    renderTimeline((data.timeline || []).filter(function (item) { return item.active !== false; }));
    renderVacancies(data.vacancies.filter(function (item) { return item.active !== false; }));
    renderBenefits(data.benefits.filter(function (item) { return item.active !== false; }));
    renderGallery((data.gallery || []).filter(function (item) { return item.active !== false; }));
  } catch (error) {
    console.error('Ошибка загрузки динамического контента:', error);
  }
});

async function loadSiteData() {
  const response = await fetch('/api/data');

  if (!response.ok) {
    throw new Error('Не удалось загрузить данные сайта');
  }

  return response.json();
}

function initAdvantagesTitleAnimation() {
  if (window.innerWidth < 992) {
    return;
  }

  ScrollTrigger.getAll().forEach((trigger) => {
    if (trigger.vars.id === 'advantages-title') {
      trigger.kill();
    }
  });

  const items = document.querySelectorAll('.advantages__item');
  const parts = document.querySelectorAll('.advantages__title-part');

  items.forEach((item, index) => {
    const part = parts[index];

    if (!part) {
      return;
    }

    ScrollTrigger.create({
      id: 'advantages-title',
      trigger: item,
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onEnter: () => {
        item.classList.add('advantages__item--active');
        gsap.to(part, { autoAlpha: 1 });
      },
      onLeave: () => {
        item.classList.remove('advantages__item--active');
        gsap.to(part, { autoAlpha: 0 });
      },
      onEnterBack: () => {
        item.classList.add('advantages__item--active');
        gsap.to(part, { autoAlpha: 1 });
      },
      onLeaveBack: () => {
        item.classList.remove('advantages__item--active');
        gsap.to(part, { autoAlpha: 0 });
      }
    });
  });

  ScrollTrigger.refresh();
}

function renderHero(hero) {
  const titleElement = document.querySelector('.hero__title');
  const statsList = document.querySelector('.advantages__list');
  const statsTitle = document.querySelector('.advantages__title');

  if (!hero || !titleElement || !statsList) {
    return;
  }

  if (Array.isArray(hero.title)) {
    titleElement.innerHTML = '';
    hero.title.forEach((line, index) => {
      if (index > 0) {
        titleElement.appendChild(document.createElement('br'));
      }

      titleElement.appendChild(document.createTextNode(line));
    });
  } else if (hero.title) {
    titleElement.textContent = hero.title;
  }

  if (!Array.isArray(hero.stats)) {
    return;
  }

  statsTitle.innerHTML = '';
  statsList.innerHTML = '';

  hero.stats.forEach((stat) => {
    const itemTitle = document.createElement('span');
    const item = document.createElement('li');
    const value = document.createElement('span');

    itemTitle.className = 'advantages__title-part';
    item.className = 'advantages__item';
    value.className = 'advantages__item-title';

    value.textContent = stat.value || '';
    itemTitle.textContent = stat.value || '';

    item.appendChild(value);
    item.appendChild(document.createTextNode(stat.label || ''));

    statsTitle.appendChild(itemTitle);
    statsList.appendChild(item);
  });
}

function initTeamVkLogoHover() {
  const elements = document.querySelectorAll('.team__item-card');

  elements.forEach((el) => {
    const vkLogo = el.querySelector('.team__item-vk-logo');

    if (!vkLogo) {
      return;
    }

    el.addEventListener('mouseenter', () => {
      vkLogo.classList.add('active');
      vkLogo.classList.remove('inactive');
    });

    el.addEventListener('mouseleave', () => {
      vkLogo.classList.add('inactive');
      vkLogo.classList.remove('active');
    });
  });
}

function renderTeam(team) {
  const container = document.querySelector('.team__list');

  if (!container || !Array.isArray(team)) {
    return;
  }

  container.innerHTML = '';

  team.forEach((member) => {
    container.appendChild(createTeamCard(member));
  });
}

function createTeamCard(member) {
  const article = document.createElement('article');
  article.className = 'swiper-slide team__item';

  article.innerHTML = `
    <div class="team__item-card card card--rounded">
      <picture>
        <img
          src="${member.photo || ''}"
          class="team__item-image card__image"
          alt="${member.name || ''}"
          width="336"
          height="477"
          decoding="async"
          loading="lazy"
        >
        <a href="${member.vk || '#'}" target="_blank" rel="noopener noreferrer">
        <img
          src="upload/vk-logo.png"
          class="team__item-vk-logo"
          alt="vk-logo"
          width="50"
          height="50"
          decoding="async"
          loading="lazy"
        >
        </a>
      </picture>

      <div class="card__description">
        <h3 class="team__item-title">${member.name || ''}</h3>
        <p class="team__item-description">${member.position || ''}</p>

        <ul class="team__item-socials">
          <li>
            <a href="${member.vk || '#'}" target="_blank" rel="noopener noreferrer">VK</a>
          </li>
        </ul>
      </div>
    </div>

    <p class="team__item-text"></p>
  `;

  return article;
}

const TIMELINE_CATEGORY_TYPE = { B2B: 1, B2C: 2, B2E: 3 };

function renderTimeline(timeline) {
  const wrapper = document.querySelector('.platform-chart__wrapper');

  if (!wrapper || !Array.isArray(timeline)) {
    return;
  }

  wrapper.innerHTML = `
  <div class="platform-chart__col">
  <p class="platform-chart__col-title">2008</p>

  <div class="platform-chart__col-items">
    <div class="platform-chart__col-item icon-block icon-block--1">
      <div class="icon-block__icon">
        <svg
          class="icon-block__img"
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M21.667 18.3333L5.83371 34.1667M15.4253 13.1602L10.6339 11.5631C10.0821 11.3792 9.47428 11.4962 9.03025 11.8719L4.26832 15.9012C3.29344 16.7261 3.57041 18.296 4.76871 18.7375L9.28071 20.3998M19.4688 30.5876L21.1311 35.0995C21.5726 36.2979 23.1424 36.5748 23.9673 35.5999L27.9966 30.838C28.3724 30.394 28.4894 29.7862 28.3055 29.2344L26.7083 24.4429"
            stroke="white"
            stroke-width="3"
            stroke-linecap="round"
          />
          <path
            d="M23.364 5.89754C25.394 7.24455 27.3452 8.83259 29.1685 10.6559C31.0076 12.495 32.6073 14.4641 33.9617 16.513M32.2476 3.78463L24.0701 5.14754C23.1871 5.29471 22.3772 5.72872 21.7657 6.38245L10.7439 18.1644C7.88694 21.2183 7.96641 25.9876 10.9235 28.9447C13.8806 31.9018 18.6499 31.9812 21.7038 29.1243L33.4857 18.1025C34.1395 17.491 34.5735 16.6811 34.7206 15.7981L36.0835 7.62061C36.4596 5.36454 34.5036 3.40862 32.2476 3.78463Z"
            stroke="white"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>
        <div class="icon-block__description">
            <b>Founding <span>B2B</span></b>
            <small>Основание компании</small>
            <p></p>
        </div>
      </div>

      <p class="icon-block__text">Founding</p>

      <p class="icon-block__year">2008</p>
    </div>
  </div>
</div>
`;

  [...timeline]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .forEach((card) => {
      const div = document.createElement('div');
      div.className = 'platform-chart__col';

      const chartTitle = document.createElement('p');
      chartTitle.className = 'platform-chart__col-title';
      chartTitle.textContent = card.year || '';

      div.appendChild(chartTitle);
      div.appendChild(createTimelineCard(card));
      wrapper.appendChild(div);
    });
}

function createTimelineCard(card) {
  const div = document.createElement('div');
  div.className = 'platform-chart__col-items';

  const type = TIMELINE_CATEGORY_TYPE[card.category] || 1;

  div.innerHTML = `
  <div class="platform-chart__col-item icon-block icon-block--${type}">
  <div class="icon-block__icon">
    <div class="icon-block__description">
      <b>${card.name || ''} <span>${card.category || ''}</span></b>
      <small>${card.subtitle || ''}</small>
      <p>${card.description || ''}</p>
    </div>
  </div>

  <p class="icon-block__text">${card.name || ''}</p>
  <p class="icon-block__year">${card.year || ''}</p>
  </div>
`;
  return div;
}

function renderVacancies(vacancies) {
  const container = document.querySelector('.vacancies__list');

  if (!container || !Array.isArray(vacancies)) {
    return;
  }

  container.innerHTML = '';

  vacancies.forEach((vacancy) => {
    container.appendChild(createVacancyCard(vacancy));
  });
}

function createVacancyCard(vacancy) {
  const article = document.createElement('article');
  article.className = 'vacancies__item card card--half-rounded';

  article.innerHTML = `
    <h3 class="vacancies__item-title card__title heading heading--type-card">
      ${vacancy.title || ''}
    </h3>

    <div class="card__footer">
      <p class="vacancies__item-address card__address">
        ${vacancy.format || ''}
      </p>

      <div class="card__footer-link">
        →
      </div>
    </div>

    <a
      href="${vacancy.url || '#'}"
      class="vacancies__item-lik"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="${vacancy.title || 'Открыть вакансию'}"
    ></a>
  `;

  return article;
}

function renderBenefits(benefits) {
  const container = document.querySelector('.bonus__list');

  if (!container || !Array.isArray(benefits)) {
    return;
  }

  container.innerHTML = '';

  benefits.forEach((benefit, index) => {
    container.appendChild(createBenefitCard(benefit, index));
  });
}

function createBenefitCard(benefit, index) {
  const article = document.createElement('article');
  article.className = `bonus__item bonus__item--${index + 1} card card--half-rounded card--default`;

  article.innerHTML = `
    <h3 class="card__title bonus__item-title">
      ${benefit.title || ''}
    </h3>

    <p class="card__text bonus__item-text">
      ${benefit.description || ''}
    </p>
  `;

  return article;
}

function renderGallery(gallery) {
  const container = document.querySelector('.gallery__container');

  if (!container || !Array.isArray(gallery)) {
    return;
  }

  container.innerHTML = '';

  gallery.forEach((item) => {
    container.appendChild(createGalleryImage(item));
  });
}

function createGalleryImage(item) {
  const div = document.createElement('div');
  div.className = 'gallery__item gallery__item--type-img';

  const src = item.src || '';
  const mediaTag = item.type === 'video'
    ? `<video class="card card--rounded" src="${src}" autoplay loop muted playsinline></video>`
    : `<img src="${src}" alt="" class="card card--rounded">`;

  div.innerHTML = `
  ${mediaTag}

  <p class="gallery__item-text">— ${item.caption || ''}
  </p>
  `;

  return div;
}