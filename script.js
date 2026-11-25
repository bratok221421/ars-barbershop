const header = document.getElementById("header");
const menuButton = document.getElementById("menuButton");
const nav = document.getElementById("nav");
const modal = document.getElementById("atmosphereModal");
const atmosphereButton = document.getElementById("openAtmosphereButton");
const interiorPlayer = modal.querySelector("iframe");
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
  if (document.fullscreenEnabled && !document.fullscreenElement) {
    interiorScreen.requestFullscreen().catch(() => {
      // The dialog still fills the viewport when native fullscreen is unavailable.
    });
  }
});
modal.addEventListener("close", () => {
  interiorPlayer.removeAttribute("src");
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

document.querySelectorAll("[data-booking-url]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    bookingFrame.src = link.dataset.bookingUrl;
    bookingDialog.showModal();
  });
});

bookingDialog.addEventListener("close", () => bookingFrame.removeAttribute("src"));
bookingDialog.addEventListener("click", (event) => {
  if (event.target === bookingDialog) bookingDialog.close();
});

const shopPoint = [44.746630, 33.840740];
const streetMap = L.map("street-map", { scrollWheelZoom:false }).setView(shopPoint, 17);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom:19,
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(streetMap);
L.circleMarker(shopPoint, {
  radius:10, color:"#312413", weight:3, fillColor:"#efc35c", fillOpacity:1
}).addTo(streetMap).bindTooltip("ARS Barber · Крымская, 2Д", {
  permanent:true, direction:"top", offset:[0,-12], opacity:1
});

const findMe = document.getElementById("find-me");
const locationStatus = document.getElementById("location-status");
let visitorMarker;
document.getElementById("find-shop").addEventListener("click", () => {
  streetMap.setView(shopPoint, 17);
});
findMe.addEventListener("click", () => {
  if (!navigator.geolocation || !window.isSecureContext) {
    locationStatus.textContent = "Для определения местоположения откройте сайт в браузере по HTTPS.";
    return;
  }
  findMe.disabled = true;
  locationStatus.textContent = "Определяем ваше местоположение…";
  navigator.geolocation.getCurrentPosition((position) => {
    const point = L.latLng(position.coords.latitude, position.coords.longitude);
    if (visitorMarker) visitorMarker.setLatLng(point);
    else visitorMarker = L.circleMarker(point, {
      radius:7, color:"#fff", weight:3, fillColor:"#176adb", fillOpacity:1
    }).addTo(streetMap).bindTooltip("Вы здесь", {
      permanent:true, direction:"bottom", offset:[0,10], opacity:1
    });
    streetMap.fitBounds(L.latLngBounds([shopPoint, point]), {
      padding:[Math.min(105, streetMap.getSize().x / 3),48], maxZoom:18
    });
    locationStatus.textContent = "Синяя точка — вы, золотая — барбершоп. Точность вашего местоположения: около " +
      Math.ceil(position.coords.accuracy) + " м.";
    findMe.disabled = false;
  }, (error) => {
    locationStatus.textContent = error.code === 1
      ? "Разрешите доступ к геопозиции в настройках сайта и снова нажмите «Где я?»."
      : "Не удалось определить местоположение. Проверьте, включена ли геолокация, и попробуйте ещё раз.";
    findMe.disabled = false;
  }, { enableHighAccuracy:true, timeout:15000, maximumAge:60000 });
});
