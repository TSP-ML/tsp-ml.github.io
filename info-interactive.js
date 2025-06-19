// Interactive TSP Demo
document.addEventListener('DOMContentLoaded', function() {
    const showBadRouteBtn = document.getElementById('show-bad-route');
    const showGoodRouteBtn = document.getElementById('show-good-route');
    const resetDemoBtn = document.getElementById('reset-demo');
    const badRoute = document.querySelector('.bad-route');
    const goodRoute = document.querySelector('.good-route');
    const demoCities = document.querySelectorAll('.demo-city');

    // Reset demo state
    function resetDemo() {
        badRoute.style.display = 'none';
        goodRoute.style.display = 'none';
        demoCities.forEach(city => {
            city.classList.remove('visited');
        });
    }

    // Show bad route
    function showBadRoute() {
        resetDemo();
        badRoute.style.display = 'block';
        animateRoute('.bad-route .demo-route', 'bad');
    }

    // Show good route
    function showGoodRoute() {
        resetDemo();
        goodRoute.style.display = 'block';
        animateRoute('.good-route .demo-route', 'good');
    }

    // Animate route drawing
    function animateRoute(selector, type) {
        const route = document.querySelector(selector);
        if (route) {
            const pathLength = route.getTotalLength();
            route.style.strokeDasharray = pathLength;
            route.style.strokeDashoffset = pathLength;
            
            setTimeout(() => {
                route.style.transition = 'stroke-dashoffset 3s ease-in-out';
                route.style.strokeDashoffset = '0';
            }, 100);

            // Animate cities
            setTimeout(() => {
                animateCities();
            }, 500);
        }
    }

    // Animate cities being visited
    function animateCities() {
        demoCities.forEach((city, index) => {
            setTimeout(() => {
                city.classList.add('visited');
            }, index * 600);
        });
    }

    // Event listeners
    showBadRouteBtn?.addEventListener('click', showBadRoute);
    showGoodRouteBtn?.addEventListener('click', showGoodRoute);
    resetDemoBtn?.addEventListener('click', resetDemo);

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    const otherQuestion = otherItem.querySelector('.faq-question');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    otherQuestion.setAttribute('aria-expanded', 'false');
                    otherAnswer.style.maxHeight = '0';
                    otherQuestion.querySelector('i').style.transform = 'rotate(0deg)';
                }
            });
            
            // Toggle current item
            if (isExpanded) {
                question.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = '0';
                question.querySelector('i').style.transform = 'rotate(0deg)';
            } else {
                question.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                question.querySelector('i').style.transform = 'rotate(180deg)';
            }
        });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Special animation for complexity stats
                if (entry.target.classList.contains('complexity-stats')) {
                    animateComplexityStats();
                }
                
                // Special animation for comparison table
                if (entry.target.classList.contains('comparison-table')) {
                    animateComparisonTable();
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.application-card, .approach-card, .complexity-stats, .comparison-table').forEach(el => {
        observer.observe(el);
    });

    // Animate complexity statistics
    function animateComplexityStats() {
        const complexityItems = document.querySelectorAll('.complexity-item');
        complexityItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transform = 'scale(1.05)';
                item.style.background = 'var(--primary-color)';
                item.style.color = 'var(--white)';
                
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                    item.style.background = '';
                    item.style.color = '';
                }, 500);
            }, index * 300);
        });
    }

    // Animate comparison table
    function animateComparisonTable() {
        const rows = document.querySelectorAll('.comparison-row:not(.header)');
        rows.forEach((row, index) => {
            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateX(0)';
            }, index * 150);
        });
    }

    // City hover effects
    demoCities.forEach(city => {
        city.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.3)';
            this.style.filter = 'drop-shadow(0 0 10px var(--primary-color))';
        });
        
        city.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.filter = 'none';
        });
    });
});
