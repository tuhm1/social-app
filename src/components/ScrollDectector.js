import React from 'react';

const ScrollDetector = ({ onScroll }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
        const target = ref.current;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => e.isIntersecting && onScroll());
        }, { root: null, rootMargin: '0px', threshold: 1 });
        observer.observe(target);
        return () => observer.unobserve(target);
    });
    return <div ref={ref} />;
};

export default ScrollDetector;