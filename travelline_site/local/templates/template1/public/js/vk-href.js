const elements = document.querySelectorAll('.team__item-card');

elements.forEach((el) => {
  let vkLogo = el.querySelector('.team__item-vk-logo');
  el.addEventListener('mouseover', () => {
    vkLogo.classList.add('active');
    vkLogo.classList.remove('inactive');
  });

  el.addEventListener('mouseout', () => {
    vkLogo.classList.add('inactive');
    vkLogo.classList.remove('active');
  });
});