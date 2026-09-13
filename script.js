document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");

  startBtn.addEventListener("click", () => {
    startBtn.classList.remove("pulse");
    // restart animation on every click
    void startBtn.offsetWidth;
    startBtn.classList.add("pulse");
  });
});
