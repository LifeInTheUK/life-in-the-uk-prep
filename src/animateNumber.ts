export function animateNumber(
    el: HTMLElement,
    to: number,
    render: (value: number) => string,
    duration = 450,
): void {
    const fromMatch = el.textContent?.match(/-?\d+/);
    const from = fromMatch ? Number(fromMatch[0]) : 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = render(to);
        return;
    }

    const start = performance.now();
    function step(now: number): void {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(from + (to - from) * eased);
        el.textContent = render(value);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}
