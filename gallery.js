// Trail photo gallery: scroll-snapped thumbnail strip with prev/next arrows.
// Arrows only appear when there are more photos than fit in the visible
// row (6 on desktop, 3 on tablet, 2 on small phones — see styles.css),
// and they scroll by exactly one viewport width per click.
(function () {
    function initGallery(root) {
        const viewport = root.querySelector('.gallery-viewport');
        const track = root.querySelector('.gallery-track');
        const prevBtn = root.querySelector('.gallery-arrow-prev');
        const nextBtn = root.querySelector('.gallery-arrow-next');
        if (!viewport || !track || !prevBtn || !nextBtn) return;

        function updateArrows() {
            const canScroll = track.scrollWidth > viewport.clientWidth + 2;
            prevBtn.style.display = canScroll ? '' : 'none';
            nextBtn.style.display = canScroll ? '' : 'none';
            if (!canScroll) return;
            prevBtn.disabled = track.scrollLeft <= 2;
            nextBtn.disabled = track.scrollLeft >= track.scrollWidth - viewport.clientWidth - 2;
        }

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -viewport.clientWidth, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: viewport.clientWidth, behavior: 'smooth' });
        });

        track.addEventListener('scroll', updateArrows);
        window.addEventListener('resize', updateArrows);

        // Run once after layout settles (images/fonts can still be loading).
        updateArrows();
        window.addEventListener('load', updateArrows);
    }

    document.querySelectorAll('.trail-gallery').forEach(initGallery);
})();
