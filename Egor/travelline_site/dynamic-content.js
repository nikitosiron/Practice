
let vacanciesScrollTween = null;
let workScrollTween = null;
let galleryColorTrigger = null;
const dynamicContentBaseUrl = new URL('.', document.currentScript?.src || window.location.href);

function injectDynamicStyles() {
  if (document.getElementById('dynamic-content-styles')) return;
  const style = document.createElement('style');
  style.id = 'dynamic-content-styles';
  style.textContent = `
    .platform__brands .brands__item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 160px;
      height: 70px;
    }
    .platform__brands .brands__item img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
    }
  `;
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    injectDynamicStyles();

    const data = await loadSiteData();

    renderHero(data.hero);

    renderTeam(data.team);

    renderTimeline(data.timeline);

    renderBrands(data.brands);

    renderDirections(data.directions);

    renderVacancies(data.vacancies);

    renderGallery(data.gallery);

    renderWork(data.work);

    renderBenefits(data.benefits);

    renderForm(data.form);

    reinitPageScripts(document);
    scheduleVacanciesScrollReinit();
    window.addEventListener('resize', () => {
      initIconBlocks(document);
      updatePlatformTimelineLayout();
    });

  } catch (error) {
    console.error('Ошибка загрузки динамического контента:', error);
  }
});

async function loadSiteData() {
  const response = await fetch(new URL('api/data.json', dynamicContentBaseUrl).href);

  if (!response.ok) {
    throw new Error('Не удалось загрузить данные сайта');
  }

  return response.json();
}

function refreshScrollTriggers() {
  if (!window.ScrollTrigger) {
    return;
  }

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

function refreshScrollTriggersAfterImagesLoad(root, onReady) {
  if (!root || !window.ScrollTrigger) {
    return;
  }

  const unloadedImages = Array.from(root.querySelectorAll('img')).filter((image) => !image.complete);

  if (!unloadedImages.length) {
    if (typeof onReady === 'function') {
      onReady();
    } else {
      refreshScrollTriggers();
    }
    return;
  }

  let pendingImages = unloadedImages.length;
  const refreshWhenReady = () => {
    pendingImages -= 1;

    if (pendingImages === 0) {
      if (typeof onReady === 'function') {
        onReady();
      } else {
        refreshScrollTriggers();
      }
    }
  };

  unloadedImages.forEach((image) => {
    image.addEventListener('load', refreshWhenReady, { once: true });
    image.addEventListener('error', refreshWhenReady, { once: true });
  });

  refreshScrollTriggers();
}

function renderHero(hero) {
  const titleElement = document.querySelector('.hero__title');
  const statsList = document.querySelector('.advantages__list');
  const statsTitle = document.querySelector('.advantages__title');

  if (!hero || !titleElement) {
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

  if (!statsList || !statsTitle || !Array.isArray(hero.stats)) {
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

function initAdvantagesTitleAnimation() {
  if (!window.gsap || !window.ScrollTrigger || window.innerWidth < 992) {
    return;
  }

  ScrollTrigger.getAll().forEach((trigger) => {
    if (trigger.vars.id === 'advantages-title' || trigger.trigger?.classList?.contains('advantages__item')) {
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

function renderTeam(team) {
  const container = document.querySelector('.team__list');

  if (!container || !Array.isArray(team)) {
    return;
  }

  container.innerHTML = '';

  team.forEach((member) => {
    if (member.active) {
      container.appendChild(createTeamCard(member));
    }
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

function initTeamVkLogoHover(root = document) {
  getElements(root, '.team__slider').forEach((slider) => {
    if (slider.dataset.vkHoverInited) {
      return;
    }

    slider.dataset.vkHoverInited = 'true';

    slider.addEventListener('mouseover', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const relatedTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      const card = target?.closest('.team__item-card');
      const vkLogo = card?.querySelector('.team__item-vk-logo');

      if (!card || !slider.contains(card) || (relatedTarget && card.contains(relatedTarget)) || !vkLogo) {
        return;
      }

      vkLogo.classList.add('active');
      vkLogo.classList.remove('inactive');
    });

    slider.addEventListener('mouseout', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const relatedTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      const card = target?.closest('.team__item-card');
      const vkLogo = card?.querySelector('.team__item-vk-logo');

      if (!card || !slider.contains(card) || (relatedTarget && card.contains(relatedTarget)) || !vkLogo) {
        return;
      }

      vkLogo.classList.add('inactive');
      vkLogo.classList.remove('active');
    });
  });
}

function initTeamSlider() {
  const slider = document.querySelector('.team__slider');

  if (!slider || !window.Swiper) {
    return;
  }

  if (slider.swiper) {
    slider.swiper.destroy(true, true);
  }

  const shouldLoop = slider.querySelectorAll('.swiper-slide').length > 1;

  new Swiper(slider, {
    loop: shouldLoop,
    autoplay: shouldLoop ? {
      delay: 0,
      disableOnInteraction: false
    } : false,
    speed: 6000,
    slidesPerView: 'auto',
    spaceBetween: 20,
    observer: true
  });
}

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

  const groupedByYear = [...timeline]
  .sort((a, b) => Number(a.year) - Number(b.year) || Number(a.id) - Number(b.id))
  .reduce((groups, card) => {
    const year = card.year || '';

    if (!groups.has(year)) {
      groups.set(year, []);
    }

    groups.get(year).push(card);

    return groups;
  }, new Map());

  groupedByYear.forEach((cards, year) => {
    const div = document.createElement('div');
    const columnIndex = wrapper.children.length + 1;

    div.className = 'platform-chart__col';
    div.dataset.dynamicYear = year;
    div.style.height = `${getTimelineColumnHeight(cards.length, columnIndex)}px`;

    const chartTitle = document.createElement('p');
    chartTitle.className = 'platform-chart__col-title';
    chartTitle.textContent = year;

    const items = document.createElement('div');
    items.className = 'platform-chart__col-items';

    cards.forEach((card) => {
      items.appendChild(createTimelineCard(card));
    });

    div.appendChild(chartTitle);
    div.appendChild(items);
    wrapper.appendChild(div);
  });

  requestAnimationFrame(updatePlatformTimelineLayout);

  document.fonts?.ready?.then(updatePlatformTimelineLayout);
}

function updatePlatformTimelineLayout() {
  adjustTimelineDynamicColumnHeights();
  adjustPlatformTimelineOffset();
  refreshScrollTriggers();
}

function adjustTimelineDynamicColumnHeights() {
  const wrapper = document.querySelector('.platform-chart__wrapper');

  if (!wrapper) {
    return;
  }

  if (window.innerWidth < 1326) {
    wrapper.querySelectorAll('.platform-chart__col[data-dynamic-year]').forEach((column) => {
      column.style.height = '';
    });

    return;
  }

  const lineOffset = window.innerWidth <= 1600 ? 64 : 80;
  const columns = Array.from(wrapper.children);

  wrapper.querySelectorAll('.platform-chart__col[data-dynamic-year]').forEach((column) => {
    const items = column.querySelector('.platform-chart__col-items');

    if (!items) {
      return;
    }

    const columnIndex = columns.indexOf(column) + 1;
    const profileHeight = getTimelineColumnProfileHeight(columnIndex);
    const itemsCount = items.children.length;

    if (itemsCount <= 1) {
      column.style.height = `${profileHeight}px`;
      return;
    }

    column.style.height = 'auto';

    const stackHeight = Math.ceil(items.getBoundingClientRect().height + lineOffset);
    column.style.height = `${Math.max(profileHeight, stackHeight)}px`;
  });
}

function adjustPlatformTimelineOffset() {
  const chart = document.querySelector('.platform-chart');
  const wrapper = document.querySelector('.platform-chart__wrapper');
  const heading = document.querySelector('.platform__heading');

  if (!chart || !wrapper || !heading) {
    return;
  }

  chart.style.marginTop = '';

  if (window.innerWidth < 1326) {
    return;
  }

  const headingRect = heading.getBoundingClientRect();
  const columns = wrapper.querySelectorAll('.platform-chart__col');
  let offset = 0;

  columns.forEach((column) => {
    const columnRect = column.getBoundingClientRect();
    const overlapsHorizontally = columnRect.left < headingRect.right + 32 && columnRect.right > headingRect.left - 32;

    if (overlapsHorizontally && columnRect.top < headingRect.bottom + 32) {
      offset = Math.max(offset, headingRect.bottom + 32 - columnRect.top);
    }
  });

  if (offset > 0) {
    chart.style.marginTop = `${Math.ceil(offset)}px`;
  }
}

function getTimelineColumnHeight(itemsCount, columnIndex) {
  const profileHeight = getTimelineColumnProfileHeight(columnIndex);

  if (itemsCount <= 1) {
    return profileHeight;
  }

  const itemHeight = window.innerWidth <= 1600 ? 150 : 170;
  const gap = window.innerWidth <= 1600 ? 22 : 30;
  const lineOffset = window.innerWidth <= 1600 ? 64 : 80;
  const stackHeight = itemsCount * itemHeight + Math.max(0, itemsCount - 1) * gap + lineOffset;

  return Math.max(profileHeight, stackHeight);
}

function getTimelineColumnProfileHeight(columnIndex) {
  const desktopHeights = [137, 329, 256, 332, 292, 433, 511, 605, 457, 360, 605, 501];
  const laptopHeights = [126, 288, 198, 241, 191, 395, 438, 473, 355, 266, 480, 379];
  const heights = window.innerWidth <= 1600 ? laptopHeights : desktopHeights;

  return heights[(columnIndex - 1) % heights.length];
}

function createTimelineCard(card) {
  const div = document.createElement('div');
  div.className = `platform-chart__col-item icon-block icon-block--${card.type || ''}`;

  div.innerHTML = `
  <div class="icon-block__icon">

    <img class="icon-block__img" src="${card.mark || ''}" alt="${card.title || ''}" width="auto" height="auto" decoding="async" loading="lazy">

    <div class="icon-block__description">
      <b>${card.title || ''} <span>${card.strategy || ''}</span></b>
      <small>${card.subtitle || ''}</small>
      <p>${card.text || ''}</p>
    </div>
  </div>

  <p class="icon-block__text">${card.title || ''}</p>
  <p class="icon-block__year">${card.year || ''}</p>
`;
  return div;
}

function renderBrands(brands) {
  const container = document.querySelector('.platform__brands.brands.swiper');

  if (!container || !Array.isArray(brands)) {
    return;
  }

  if (container.swiper) {
    container.swiper.destroy(true, true);
  }

  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'swiper-wrapper';

  for (let i = 0; i < 4; i++) {
    const list = document.createElement('ul');
    list.className = 'brands__list swiper-slide';

    brands.forEach((brand) => {
      list.appendChild(createBrandItem(brand));
    });

    wrapper.appendChild(list);
  }

  container.appendChild(wrapper);

  if (window.Swiper) {
    new Swiper(container, {
      loop: true,
      autoplay: {
        delay: 0,
        disableOnInteraction: false
      },
      speed: 60000,
      slidesPerView: 'auto',
      spaceBetween: 60,
      observer: true,
      allowTouchMove: false,
      simulateTouch: false
    });
  }
}

function createBrandItem(brand) {
  const item = document.createElement('li');
  item.className = 'brands__item';

  item.innerHTML = `
    <img src="${brand.image || ''}" alt="${brand.name || 'Brand'}">
  `;

  return item;
}

function renderDirections(directions) {
  const container = document.querySelector('.directions__list');

  if (!container || !Array.isArray(directions)) {
    return;
  }

  container.innerHTML = '';

  directions.forEach((direction) => {
    container.appendChild(createDirectionItem(direction));
  });
}

function createDirectionItem(direction) {
  const article = document.createElement('article');
  article.className = 'directions__item accordion';

  const divTitle = document.createElement('div');
  divTitle.className = 'accordion__title';

  const title = document.createElement('span');
  title.textContent = direction.title || direction.name || '';

  divTitle.appendChild(title);

  const divTechs = document.createElement('div');
  divTechs.className = 'accordion__title-stak-list bages-list';

  const technologies = Array.isArray(direction.technologies) ? direction.technologies : [];

  technologies.forEach((technology) => {
    const divTech = document.createElement('div');
    divTech.className = 'bages-list__item';

    divTech.innerHTML = `
    <img src="${technology.image || ''}"
      alt="${technology.name || ''}">
    ${technology.name || ''}
    `;

    divTechs.appendChild(divTech);
  });

  const divToggle = document.createElement('div');
  divToggle.className = 'accordion__toggle';
  divToggle.innerHTML = `
  <svg width="24" height="14" viewBox="0 0 24 14" fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="2" cy="2" r="2" fill="#507BCE" />
    <circle cx="7" cy="7" r="2" fill="#507BCE" />
    <circle cx="12" cy="12" r="2" fill="#507BCE" />
    <circle cx="17" cy="7" r="2" fill="#507BCE" />
    <circle cx="22" cy="2" r="2" fill="#507BCE" />
  </svg>
  `;

  divTitle.appendChild(divTechs);
  divTitle.appendChild(divToggle);

  const divDescription = document.createElement('div');
  divDescription.className = 'accordion__body';

  divDescription.innerHTML = `
  <div class="accordion__content ustyle">
    <p>
      ${direction.description}
    </p>
  </div>
  `;

  article.appendChild(divTitle);
  article.appendChild(divDescription);

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

  const moreVacancies = document.createElement('article');
  moreVacancies.className = 'vacancies__item vacancies__item--type-more card card--half-rounded';

  moreVacancies.innerHTML = `
  <h3 class="vacancies__item-title card__title heading heading--type-card">
    Еще больше вакансий
    на HeadHunter

    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="24"
      viewBox="0 0 14 24"
      fill="none"
    >
      <circle cx="2" cy="22" r="2" transform="rotate(-90 2 22)" fill="white" />
      <circle cx="7" cy="17" r="2" transform="rotate(-90 7 17)" fill="white" />
      <circle cx="12" cy="12" r="2" transform="rotate(-90 12 12)" fill="white" />
      <circle cx="7" cy="7" r="2" transform="rotate(-90 7 7)" fill="white" />
      <circle cx="2" cy="2" r="2" transform="rotate(-90 2 2)" fill="white" />
    </svg>
  </h3>

  <a
    href="https://yoshkar-ola.hh.ru/search/vacancy?from=employerPage&hhtmFrom=employer&professional_role=156&professional_role=160&professional_role=10&professional_role=12&professional_role=150&professional_role=25&professional_role=165&professional_role=34&professional_role=36&professional_role=73&professional_role=155&professional_role=96&professional_role=164&professional_role=104&professional_role=157&professional_role=107&professional_role=112&professional_role=113&professional_role=148&professional_role=114&professional_role=116&professional_role=121&professional_role=124&professional_role=125&professional_role=126&search_field=name&search_field=company_name&search_field=description&enable_snippets=false&employer_id=1136961"
    class="vacancies__item-lik"
    target="_blank"
  ></a>

  `;

  container.appendChild(moreVacancies);
}

function createVacancyCard(vacancy) {
  const article = document.createElement('article');
  article.className = 'vacancies__item card card--half-rounded';

  article.innerHTML = `
    <h3 class="vacancies__item-title card__title heading heading--type-card" >
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

function initVacanciesScroll() {
  if (!window.gsap || !window.ScrollTrigger) {
    return;
  }

  requestAnimationFrame(() => {
    const wrapper = document.querySelector('.vacancies__container');
    const list = document.querySelector('.vacancies__list');

    if (!wrapper || !list) {
      return;
    }

    if (vacanciesScrollTween) {
      vacanciesScrollTween.kill(true);
      vacanciesScrollTween = null;
    }

    ScrollTrigger.getAll().forEach((trigger) => {
      const animationTargets = trigger.animation?.targets?.() || [];
      const triggerElement = typeof trigger.vars?.trigger === 'string' ? null : trigger.vars?.trigger;
      const belongsToVacancies =
        trigger.trigger?.closest?.('.vacancies') ||
        trigger.pin?.closest?.('.vacancies') ||
        triggerElement?.closest?.('.vacancies');

      if (
        belongsToVacancies ||
        trigger.vars?.id === 'vacancies-scroll' ||
        trigger.trigger === wrapper ||
        trigger.pin === wrapper ||
        trigger.vars?.trigger === wrapper ||
        trigger.vars?.trigger === '.vacancies__container' ||
        animationTargets.includes(list)
      ) {
        trigger.kill(true);
      }
    });

    gsap.killTweensOf(list);
    gsap.set(list, { clearProps: 'transform' });

    if (window.innerWidth < 992) {
      ScrollTrigger.refresh();
      return;
    }

    const measurements = measureVacanciesScroll(list, wrapper);

    if (measurements.xDistance <= 0) {
      ScrollTrigger.refresh();
      return;
    }

    let xDistance = measurements.xDistance;
    let pinDistance = measurements.pinDistance;

    vacanciesScrollTween = ScrollTrigger.create({
      id: 'vacancies-scroll',
      trigger: wrapper,
      start: 'top 30%',
      end: () => '+=' + pinDistance,
      scrub: true,
      pin: true,
      invalidateOnRefresh: true,
      refreshPriority: 3,
      onRefreshInit: () => {
        gsap.set(list, { clearProps: 'transform' });

        const nextMeasurements = measureVacanciesScroll(list, wrapper);
        xDistance = nextMeasurements.xDistance;
        pinDistance = nextMeasurements.pinDistance;
      },
      onUpdate: (self) => {
        gsap.set(list, { x: -xDistance * self.progress });
      }
    });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
}

function measureVacanciesScroll(list, wrapper) {
  const contentWidth = getVacanciesContentWidth(list);
  const visibleWidth = getVacanciesVisibleWidth(list, wrapper);
  const xDistance = Math.max(0, Math.ceil(contentWidth - visibleWidth + 160));

  return {
    xDistance,
    pinDistance: Math.max(xDistance, Math.ceil(contentWidth))
  };
}

function getVacanciesContentWidth(list) {
  const items = Array.from(list.children);

  if (!items.length) {
    return 0;
  }

  const listRect = list.getBoundingClientRect();
  const lastItemRect = items[items.length - 1].getBoundingClientRect();

  return Math.max(list.scrollWidth, lastItemRect.right - listRect.left);
}

function getVacanciesVisibleWidth(list, wrapper) {
  const listRect = list.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  const visibleRight = Math.min(window.innerWidth, wrapperRect.right);

  return Math.max(0, visibleRight - listRect.left);
}

function getVacanciesScrollDistance(list, wrapper) {
  return measureVacanciesScroll(list, wrapper).xDistance;
}

function scheduleVacanciesScrollReinit() {
  requestAnimationFrame(() => {
    initVacanciesScroll();
  });

  setTimeout(() => {
    initVacanciesScroll();
  }, 100);

  setTimeout(() => {
    initVacanciesScroll();
  }, 500);

  if (document.readyState === 'complete') {
    setTimeout(initVacanciesScroll, 0);
  } else {
    window.addEventListener('load', initVacanciesScroll, { once: true });
  }

  document.fonts?.ready?.then(() => {
    initVacanciesScroll();
  });
}

function initGalleryAndWorkScroll() {
  if (!window.gsap || !window.ScrollTrigger) {
    return;
  }

  requestAnimationFrame(() => {
    const gallery = document.querySelector('.gallery');
    const work = document.querySelector('.work');
    const workScrollSection = document.querySelector('.work__section--scroll');
    const workText = document.querySelector('.work__container--text');

    if (galleryColorTrigger) {
      galleryColorTrigger.kill(true);
      galleryColorTrigger = null;
    }

    if (workScrollTween) {
      workScrollTween.kill();
      workScrollTween = null;
    }

    ScrollTrigger.getAll().forEach((trigger) => {
      if (
        trigger.vars.id === 'gallery-color' ||
        trigger.vars.id === 'work-scroll' ||
        trigger.trigger === gallery ||
        trigger.trigger === work ||
        trigger.pin === work
      ) {
        trigger.kill(true);
      }
    });

    if (work) {
      gsap.killTweensOf(work);
      gsap.set(work, { clearProps: 'transform' });
    }

    document.body.classList.remove('page--dark-bg');

    if (window.innerWidth < 992 || !gallery || !work || !workScrollSection || !workText) {
      ScrollTrigger.refresh();
      return;
    }

    galleryColorTrigger = ScrollTrigger.create({
      id: 'gallery-color',
      trigger: gallery,
      start: () => window.innerWidth >= 1600 ? 'top 160px' : 'top 120px',
      end: 'bottom 50%',
      refreshPriority: 2,
      onEnter: () => {
        document.body.classList.add('page--dark-bg');
      },
      onEnterBack: () => {
        document.body.classList.add('page--dark-bg');
      },
      onLeave: () => {
        document.body.classList.remove('page--dark-bg');
      },
      onLeaveBack: () => {
        document.body.classList.remove('page--dark-bg');
      }
    });

    workScrollTween = gsap.to(work, {
      x: () => -(window.innerWidth / 2 + workScrollSection.scrollWidth - workText.scrollWidth / 2 - 80),
      ease: 'none',
      scrollTrigger: {
        id: 'work-scroll',
        trigger: work,
        start: 'top 15%',
        end: () => '+=' + workScrollSection.scrollWidth / 2,
        scrub: true,
        pin: true,
        invalidateOnRefresh: true,
        refreshPriority: 1
      }
    });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
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

  div.innerHTML = `
  <img src="${item.image || ''}" alt="" class="card card--rounded">

  <p class="gallery__item-text">— ${item.text || ''}
  </p>
  `;

  return div;
}

function renderWork(work) {
  const container = document.querySelector('.work__section--scroll');

  if (!container || !Array.isArray(work)) {
    return;
  }

  container.innerHTML = '';

  work.forEach((card) => {
    container.appendChild(createWorkCard(card));
  });

  const lastDiv = document.createElement('div');
  lastDiv.className = 'work__container work__container--text';
  lastDiv.innerHTML = `
  <p>
    Если твоя команда в другом городе, мы поддерживаем и оплачиваем поездки, чтобы вы могли
    встретиться и пообщаться лично 
  </p>
  `;
  container.appendChild(lastDiv);
}

function createWorkCard(card) {
  const div = document.createElement('div');
  div.className = 'work__container work__container--type-card';
  div.innerHTML = `
  <div class="card card--center card--half-rounded">
    <img src="${card.image}"
      alt="TL-Ofice">
  </div>

  <p class="work__card-text">
    <span class="work__card-text-line"></span>
    ${card.text || ''}
  </p>
  `;

  return div;
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

function renderForm(form) {
  const container = document.querySelector('.contact-form__description');

  if (!container || !Array.isArray(form) || !form[0]) {
    return;
  }
  
  container.innerHTML = `
  <h2 class="contact-form__heading heading heading--type-section heading--color-add">
    ${form[0].title || ''} 
  </h2>

  <p class="contact-form__description-text">
    ${form[0].subtitle || ''}
  </p>

  <div class="contact-form__description-img card card--half-rounded">
    <video class="video-src" autoplay loop muted playsinline width="595" height="355" preload="auto"
      src="upload/iblock/424/51ma8fp34r61mqgkgx0y1g5b452uwr2v.mp4"
      data-src="upload/iblock/424/51ma8fp34r61mqgkgx0y1g5b452uwr2v.mp4"></video>
  </div>
  `;

  const button = document.querySelector('.form__submit');

  if (button) {
    button.textContent = form[0].button;
  }
}

function getElements(root, selector) {
  const elements = [];

  if (root instanceof Element && root.matches(selector)) {
    elements.push(root);
  }

  elements.push(...root.querySelectorAll(selector));

  return elements;
}

function initVideos(root = document) {
  getElements(root, '.video-src').forEach((video) => {
    if (video.dataset.src) {
      video.src = video.dataset.src;
    }
  });
}

function initAccordions(root = document) {
  getElements(root, '.accordion').forEach((accordion) => {
    if (accordion.dataset.accordionInited) {
      return;
    }

    accordion.dataset.accordionInited = 'true';

    accordion.addEventListener('mouseenter', () => {
      if (window.innerWidth < 1326) {
        return;
      }

      document.querySelectorAll('.accordion').forEach((item) => {
        item.querySelector('.accordion__title span:not(.accordion__toggle)')?.classList.add('opacity');
      });

      accordion.querySelector('.accordion__title span:not(.accordion__toggle)')?.classList.remove('opacity');
    });

    accordion.addEventListener('mouseleave', () => {
      if (window.innerWidth < 1326) {
        return;
      }

      document.querySelectorAll('.accordion').forEach((item) => {
        item.querySelector('.accordion__title span:not(.accordion__toggle)')?.classList.remove('opacity');
      });
    });

    accordion.addEventListener('click', () => {
      if (window.innerWidth >= 992) {
        const isOpen = accordion.classList.contains('accordion--open');

        document.querySelectorAll('.accordion').forEach((item) => {
          item.classList.remove('accordion--open');
        });

        if (!isOpen) {
          accordion.classList.add('accordion--open');
        }
      } else {
        accordion.classList.toggle('accordion--open');
      }

      setTimeout(refreshScrollTriggers, 700);
    });
  });
}

function initIconBlocks(root = document) {
  if (window.innerWidth < 1326) {
    return;
  }

  getElements(root, '.icon-block').forEach((block) => {
    if (block.dataset.iconBlockInited) {
      return;
    }

    const icon = block.querySelector('.icon-block__icon');

    if (!icon) {
      return;
    }

    block.dataset.iconBlockInited = 'true';

    icon.addEventListener('mouseenter', () => {
      if (window.innerWidth < 1326) {
        return;
      }

      const description = block.querySelector('.icon-block__description');

      if (!description) {
        return;
      }

      block.closest('.platform')?.classList.add('animation-end');

      const distanceToRight = window.innerWidth - block.getBoundingClientRect().right;
      const titleHeight = block.querySelector('.icon-block__description b')?.offsetHeight || 0;
      const smallHeight = block.querySelector('.icon-block__description small')?.offsetHeight || 0;
      const textHeight = block.querySelector('.icon-block__description p')?.offsetHeight || 0;

      description.style.height = `${titleHeight + smallHeight + textHeight + 84}px`;

      if (distanceToRight < 500) {
        block.classList.add('open-left');
        block.classList.remove('open-right');
      } else {
        block.classList.add('open-right');
        block.classList.remove('open-left');
      }
    });

    icon.addEventListener('mouseleave', () => {
      const description = block.querySelector('.icon-block__description');

      block.classList.remove('open-left', 'open-right');
      description?.removeAttribute('style');
    });
  });
}

function initVacancyMetric(root = document) {
  getElements(root, '.vacancies__item-lik').forEach((link) => {
    if (link.dataset.metricInited) {
      return;
    }

    link.dataset.metricInited = 'true';

    link.addEventListener('click', () => {
      window.ym?.(99071910, 'reachGoal', 'vacancy_ click');
    });
  });
}

function updateSwipers() {
  const teamSlider = document.querySelector('.team__slider');
  const brandsSlider = document.querySelector('.brands');

  if (teamSlider?.swiper) {
    teamSlider.swiper.update();
  }

  if (brandsSlider?.swiper) {
    brandsSlider.swiper.update();
  }
}

function initBenefitsAnimation() {
  if (!window.gsap || !window.ScrollTrigger) {
    return;
  }

  const title = document.querySelector('.bonus__title');
  const items = document.querySelectorAll('.bonus__item');

  ScrollTrigger.getAll().forEach((trigger) => {
    const triggerSelector = trigger.vars?.trigger;
    const triggerElement = typeof triggerSelector === 'string' ? null : triggerSelector;
    const isBonusTrigger =
      trigger.vars?.id === 'bonus-animation' ||
      trigger.trigger?.closest?.('.bonus') ||
      triggerElement?.closest?.('.bonus') ||
      (typeof triggerSelector === 'string' && triggerSelector.includes('bonus__'));

    if (isBonusTrigger) {
      trigger.kill(true);
    }
  });

  gsap.killTweensOf('.bonus__title');
  gsap.killTweensOf('.bonus__item');
  gsap.set('.bonus__title, .bonus__item', { clearProps: 'opacity,visibility' });

  if (window.innerWidth < 992) {
    ScrollTrigger.refresh();
    return;
  }

  const itemRanges = [
    ['top 70%', 'top 60%'],
    ['top 60%', 'top 50%'],
    ['top 45%', 'top 20%'],
    ['top 80%', 'top 60%'],
    ['top 70%', 'top 60%'],
    ['top 60%', 'top 50%'],
    ['top 90%', 'top 70%'],
    ['top 70%', 'top 60%']
  ];

  items.forEach((item, index) => {
    const [start, end] = itemRanges[index] || ['top 80%', 'top 60%'];

    gsap.fromTo(item, { autoAlpha: 0 }, {
      autoAlpha: 1,
      scrollTrigger: {
        id: 'bonus-animation',
        trigger: item,
        start,
        end,
        scrub: true
      }
    });
  });

  if (title) {
    gsap.fromTo(title, { autoAlpha: 0 }, {
      autoAlpha: 1,
      scrollTrigger: {
        id: 'bonus-animation',
        trigger: title,
        start: 'top 90%',
        end: 'bottom 60%',
        scrub: true
      }
    });
  }

  ScrollTrigger.refresh();
}

function reinitPageScripts(root = document) {
  initVideos(root);
  initAccordions(root);
  initTeamSlider();
  initTeamVkLogoHover(root);
  initIconBlocks(root);
  initVacancyMetric(root);
  updateSwipers();
  updatePlatformTimelineLayout();

  initAdvantagesTitleAnimation();
  initVacanciesScroll();
  initGalleryAndWorkScroll();
  initBenefitsAnimation();
  refreshScrollTriggersAfterImagesLoad(document.querySelector('.gallery'), initGalleryAndWorkScroll);

  refreshScrollTriggers();
}

window.reinitPageScripts = reinitPageScripts;
