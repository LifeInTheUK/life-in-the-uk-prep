const COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ec4899", "#818cf8"];

export function launchConfetti(target: HTMLElement | null): void {
  if (!target) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (let i = 0; i < 24; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = COLORS[i % COLORS.length];
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    target.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}
