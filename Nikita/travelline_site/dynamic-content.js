let vacanciesScrollTween = null;
let workScrollTween = null;
let galleryColorTrigger = null;

// Force uploaded brand logos of any natural size to fit the strip nicely.
// Injected once, before any render*() runs. Kept here (not in style.min.css)
// because style.min.css is the untouched vendor bundle.
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
    initAdvantagesTitleAnimation();

    renderTeam(data.team);
    initTeamVkLogoHover();

    renderTimeline(data.timeline);

    renderBrands(data.brands);

    renderDirections(data.directions);

    renderVacancies(data.vacancies);

    renderGallery(data.gallery);

    renderWork(data.work);

    renderBenefits(data.benefits);

    renderForm(data.contactForm);
    
    initVacanciesScroll();

    initGalleryAndWorkScroll();

    refreshScrollTriggersAfterImagesLoad(document.querySelector('.gallery'), initGalleryAndWorkScroll);

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

function renderTimeline(platform) {
  const wrapper = document.querySelector('.platform-chart__wrapper');

  if (!wrapper || !Array.isArray(platform)) {
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

  [...platform]
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

  div.innerHTML = `
  <div class="platform-chart__col-item icon-block icon-block--${card.type || ''}">
  <div class="icon-block__icon">

    <img src="${card.mark || ''}" alt="${card.title || ''}" width="auto" height="auto" decoding="async" loading="lazy">

    <div class="icon-block__description">
      <b>${card.title || ''} <span>${card.strategy || ''}</span></b>
      <small>${card.subtitle || ''}</small>
      <p>${card.text || ''}</p>
    </div>
  </div>

  <p class="icon-block__text">${card.title || ''}</p>
  <p class="icon-block__year">${card.year || ''}</p>
  </div>
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

function createBrandItem(brand) {
  const item = document.createElement('li');
  item.className = 'brands__item';

  item.innerHTML = `
    <img src="${brand.src || ''}" alt="${brand.name || 'Brand'}">
  `;

  return item;
}

function renderDirections(directions) {
  const container = document.querySelector('.directions__list');
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
  title.textContent = direction.title;

  divTitle.appendChild(title);

  const divTechs = document.createElement('div');
  divTechs.className = 'accordion__title-stak-list bages-list';

  direction.technologies.forEach((technology) => {
    const divTech = document.createElement('div');
    divTech.className = 'bages-list__item';

    divTech.innerHTML = `
    <img src="${technology.icon || ''}"
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
      vacanciesScrollTween.kill();
      vacanciesScrollTween = null;
    }

    ScrollTrigger.getAll().forEach((trigger) => {
      if (
        trigger.vars.id === 'vacancies-scroll' ||
        trigger.trigger === wrapper ||
        trigger.pin === wrapper
      ) {
        trigger.kill(true);
      }
    });

    gsap.killTweensOf(list);
    gsap.set(list, { clearProps: 'transform' });

    if (window.innerWidth < 1326) {
      ScrollTrigger.refresh();
      return;
    }

    const scrollDistance = list.scrollWidth - wrapper.offsetWidth;

    if (scrollDistance <= 0) {
      ScrollTrigger.refresh();
      return;
    }

    vacanciesScrollTween = gsap.to(list, {
      x: () => -(list.scrollWidth - wrapper.offsetWidth + 160),
      ease: 'none',
      scrollTrigger: {
        id: 'vacancies-scroll',
        trigger: wrapper,
        start: 'top 30%',
        end: () => '+=' + (list.scrollWidth - wrapper.offsetWidth),
        scrub: true,
        pin: true,
        invalidateOnRefresh: true,
        refreshPriority: 3,
      },
    });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
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

  const src = item.src || '';
  const media = item.type === 'video'
    ? `<video class="card card--rounded video-src" autoplay loop muted playsinline preload="auto" src="${src}" data-src="${src}"></video>`
    : `<img src="${src}" alt="" class="card card--rounded">`;

  div.innerHTML = `
  ${media}

  <p class="gallery__item-text">— ${item.caption || ''}</p>
  `;

  return div;
}

function renderWork(work) {
  const container = document.querySelector('.work__section--scroll');
  container.innerHTML = '';
  work.forEach((card) => {
    container.appendChild(createWorkCard(card))
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
    ${card.caption || ''}
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
  article.className = `bonus__item bonus__item--${index + 1} card card--half - rounded card--default `;

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

  if (!container || !form) {
    return;
  }

  container.innerHTML = `
  <h2 class="contact-form__heading heading heading--type-section heading--color-add">
    ${form.title || ''}
  </h2>

  <p class="contact-form__description-text">
    ${form.description || ''}
  </p>

  <div class="contact-form__description-img card card--half-rounded">
    <video class="video-src" autoplay loop muted playsinline width="595" height="355" preload="auto"
      src="upload/iblock/424/51ma8fp34r61mqgkgx0y1g5b452uwr2v.mp4"
      data-src="upload/iblock/424/51ma8fp34r61mqgkgx0y1g5b452uwr2v.mp4"></video>
  </div>
  `;

  const button = document.querySelector('.form__submit');
  if (button) {
    button.textContent = 'Отправить';
  }
}
