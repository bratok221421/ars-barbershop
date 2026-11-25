const header = document.getElementById("header");
const menuButton = document.getElementById("menuButton");
const nav = document.getElementById("nav");
const modal = document.getElementById("atmosphereModal");
const atmosphereButton = document.getElementById("openAtmosphereButton");
const interiorPlayer = modal.querySelector("video");
const interiorScreen = modal.querySelector(".interior-screen");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 80);
});

menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function startReveal() {
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

// ===== Заставка «Вас приветствует ARS BARBERSHOP» =====
const preloader = document.getElementById("preloader");
const MIN_SHOW = 2200;   // минимум, чтобы успеть прочитать приветствие
const MAX_SHOW = 7000;   // страховка: если что-то грузится слишком долго
if (!preloader) {
  document.body.classList.remove("loading");
  startReveal();
} else {
  const bar = document.getElementById("preloaderBar");
  const count = document.getElementById("preloaderCount");
  const started = performance.now();
  let loaded = document.readyState === "complete";
  let finished = false;
  let progress = 0;

  window.addEventListener("load", () => { loaded = true; });
  setTimeout(() => { loaded = true; }, MAX_SHOW);

  function finish() {
    if (finished) return;
    finished = true;
    document.body.classList.remove("loading");
    preloader.classList.add("hide");
    startReveal(); // текст на главной появляется, пока шторка уезжает
    const remove = () => preloader.remove();
    preloader.addEventListener("transitionend", (e) => { if (e.target === preloader) remove(); });
    setTimeout(remove, 1600);
  }

  function tick(now) {
    const elapsed = now - started;
    const canFinish = loaded && elapsed >= MIN_SHOW;
    const target = canFinish ? 100 : Math.min(92, 92 * (1 - Math.exp(-elapsed / 1300)));
    progress += (target - progress) * 0.14;
    if (canFinish && progress > 99.4) progress = 100;
    bar.style.transform = `scaleX(${progress / 100})`;
    count.textContent = Math.round(progress);
    if (progress >= 100) setTimeout(finish, 250);
    else requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

atmosphereButton.addEventListener("click", () => {
  modal.showModal();
  interiorPlayer.src = interiorPlayer.dataset.src;
  interiorPlayer.play().catch(() => {});
  if (document.fullscreenEnabled && !document.fullscreenElement) {
    interiorScreen.requestFullscreen().catch(() => {
      // The dialog still fills the viewport when native fullscreen is unavailable.
    });
  }
});
modal.addEventListener("close", () => {
  interiorPlayer.pause();
  interiorPlayer.removeAttribute("src");
  interiorPlayer.load();
  if (document.fullscreenElement === interiorScreen) {
    document.exitFullscreen().catch(() => {});
  }
  atmosphereButton.focus();
});
modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});

const hoursStatus = document.getElementById("hoursStatus");
const opensAt = document.getElementById("opensAt").textContent;
const closesAt = document.getElementById("closesAt").textContent;
const localClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Simferopol",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

function updateHours() {
  const time = localClock.format(new Date());
  const open = time >= opensAt && time < closesAt;
  hoursStatus.textContent = open ? "Открыты до " + closesAt : "Откроемся в " + opensAt;
  hoursStatus.parentElement.classList.toggle("closed", !open);
}

updateHours();
setInterval(updateHours, 1000);
document.addEventListener("visibilitychange", updateHours);

const bookingDialog = document.getElementById("bookingDialog");
const courseCall = document.querySelector(".course-call");
function animateCourseCall() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  courseCall.animate([{ transform:"scale(1)" }, { transform:"scale(.96)", offset:.3 }, { transform:"scale(1)" }], { duration:220, easing:"ease-out" });
  courseCall.querySelector("svg").animate([
    { transform:"rotate(0)" }, { transform:"rotate(-16deg)" },
    { transform:"rotate(10deg)" }, { transform:"rotate(0)" }
  ], { duration:280, easing:"ease-out" });
}
courseCall.addEventListener("pointerdown", (event) => {
  if (event.isPrimary && event.button === 0) animateCourseCall();
});
courseCall.addEventListener("click", (event) => {
  if (event.detail === 0) animateCourseCall();
});
const bookingFrame = bookingDialog.querySelector("iframe");
const mobileBooking = document.querySelector(".mobile-booking");
const bookingHero = document.querySelector(".hero");
function updateMobileBooking() {
  mobileBooking.hidden = bookingHero.getBoundingClientRect().bottom > 0;
}
new IntersectionObserver(updateMobileBooking).observe(bookingHero);
window.addEventListener("pageshow", updateMobileBooking);

const bookingStart = bookingDialog.querySelector(".booking-start");

function showBookingFrame(url) {
  bookingStart.hidden = true;
  bookingFrame.hidden = false;
  bookingFrame.src = url;
}

document.querySelectorAll("[data-booking-start], [data-booking-url]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (link.dataset.bookingUrl) {
      showBookingFrame(link.dataset.bookingUrl);
    } else {
      bookingFrame.hidden = true;
      bookingStart.hidden = false;
    }
    bookingDialog.showModal();
  });
});

bookingStart.querySelectorAll("[data-path]").forEach((button) => {
  button.addEventListener("click", () => {
    showBookingFrame("https://dikidi.net/ru/record/1854348?st_m=" + button.dataset.path);
    bookingFrame.focus();
  });
});

bookingDialog.addEventListener("close", () => bookingFrame.removeAttribute("src"));
bookingDialog.addEventListener("click", (event) => {
  if (event.target === bookingDialog) bookingDialog.close();
});

const streetMap = document.getElementById("street-map");
const shopMapUrl = streetMap.src;
const findMe = document.getElementById("find-me");
const locationStatus = document.getElementById("location-status");

document.getElementById("find-shop").addEventListener("click", () => {
  streetMap.src = shopMapUrl;
  locationStatus.textContent = "";
});
findMe.addEventListener("click", () => {
  if (!navigator.geolocation || !window.isSecureContext) {
    locationStatus.textContent = "Для определения местоположения откройте сайт в браузере по HTTPS.";
    return;
  }
  findMe.disabled = true;
  locationStatus.textContent = "Определяем ваше местоположение…";
  navigator.geolocation.getCurrentPosition((position) => {
    const {latitude, longitude} = position.coords;
    const map = new URL(shopMapUrl);
    const dx = Math.max(.0025, Math.abs(longitude - 33.840604) * .7);
    const dy = Math.max(.0015, Math.abs(latitude - 44.746561) * .7);
    const cx = (longitude + 33.840604) / 2;
    const cy = (latitude + 44.746561) / 2;
    map.searchParams.delete("ll");
    map.searchParams.delete("z");
    map.searchParams.set("bbox", [cx-dx,cy-dy,cx+dx,cy+dy].join(","));
    map.searchParams.set("pt", "33.840604,44.746561,pm2rdm~" + longitude + "," + latitude + ",pm2blm");
    streetMap.src = map.href;
    locationStatus.textContent = "Синяя метка — вы, красная — барбершоп. Точность вашего местоположения: около " +
      Math.ceil(position.coords.accuracy) + " м.";
    findMe.disabled = false;
  }, (error) => {
    locationStatus.textContent = error.code === 1
      ? "Разрешите доступ к геопозиции в настройках сайта и снова нажмите «Где я?»."
      : "Не удалось определить местоположение. Проверьте, включена ли геолокация, и попробуйте ещё раз.";
    findMe.disabled = false;
  }, { enableHighAccuracy:true, timeout:15000, maximumAge:60000 });
});

const masterDialog = document.getElementById("masterDialog");
document.querySelectorAll(".master-about").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("masterDialogName").textContent = button.dataset.name;
    document.getElementById("masterDialogBio").textContent = button.dataset.bio;
    masterDialog.showModal();
  });
});
