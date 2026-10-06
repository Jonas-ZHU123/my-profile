document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const photos = slides.map((slide) => slide.querySelector('button'));
  const counter = carousel.querySelector('[data-carousel-counter]');
  const caption = carousel.querySelector('[data-carousel-caption]');
  const age = carousel.querySelector('[data-carousel-age]');
  const story = carousel.querySelector('[data-carousel-story]');
  const previousButton = carousel.querySelector('[data-carousel-previous]');
  const nextButton = carousel.querySelector('[data-carousel-next]');
  let currentIndex = 0;
  let suppressClickUntil = 0;

  if (slides.length < 3) return;

  function show(index) {
    currentIndex = (index + slides.length) % slides.length;
    const previousIndex = (currentIndex - 1 + slides.length) % slides.length;
    const nextIndex = (currentIndex + 1) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-current', slideIndex === currentIndex);
      slide.classList.toggle('is-previous', slideIndex === previousIndex);
      slide.classList.toggle('is-next', slideIndex === nextIndex);

      const visible = slideIndex === currentIndex || slideIndex === previousIndex || slideIndex === nextIndex;
      slide.setAttribute('aria-hidden', String(!visible));
      photos[slideIndex].tabIndex = visible && slideIndex !== currentIndex ? 0 : -1;
      const action = slideIndex === currentIndex ? 'Current' : slideIndex === previousIndex ? 'Show previous' : 'Show next';
      photos[slideIndex].setAttribute('aria-label', `${action} photo: ${slide.dataset.caption}`);
    });

    counter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    caption.textContent = slides[currentIndex].dataset.caption;
    if (age) age.textContent = slides[currentIndex].dataset.age;
    if (story) story.textContent = slides[currentIndex].dataset.story;
  }

  previousButton.addEventListener('click', () => show(currentIndex - 1));
  nextButton.addEventListener('click', () => show(currentIndex + 1));
  photos.forEach((photo, index) => {
    photo.addEventListener('click', (event) => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        return;
      }
      if (index === (currentIndex - 1 + slides.length) % slides.length) show(currentIndex - 1);
      if (index === (currentIndex + 1) % slides.length) show(currentIndex + 1);
    });
  });
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(currentIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(currentIndex + 1);
    }
  });
  let pointerStart = null;
  const stage = carousel.querySelector('.carousel-stage');
  stage.addEventListener('dragstart', (event) => event.preventDefault());
  stage.addEventListener('pointerdown', (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  stage.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suppressClickUntil = Date.now() + 300;
      show(currentIndex + (dx < 0 ? 1 : -1));
    }
  });
  stage.addEventListener('pointercancel', () => { pointerStart = null; });
  stage.addEventListener('pointerleave', () => { pointerStart = null; });
  show(0);
});

document.querySelectorAll('[data-cat-reveal]').forEach((button) => {
  button.addEventListener('click', () => {
    const gallery = document.getElementById(button.getAttribute('aria-controls'));
    if (!gallery) return;
    gallery.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    button.closest('[data-cat-discovery]').classList.add('is-revealed');
    button.hidden = true;
    gallery.querySelector('[data-carousel-next]').focus({ preventScroll: true });
  });
});
