document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadSiteData();

    renderHero(data.hero);
    initAdvantagesTitleAnimation();
    renderTeam(data.team);
    initTeamVkLogoHover();
    renderVacancies(data.vacancies); 
    renderBenefits(data.benefits);
  } catch (error) {
    console.error('Ошибка загрузки динамического контента:', error);
  }
});

async function loadSiteData() {
  const response = await fetch('/api/data.json');

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