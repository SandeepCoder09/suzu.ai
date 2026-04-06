try {
    const nav = document.querySelector('nav');
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.forEach((otherLink) => {
                otherLink.classList.remove('active');
            });
            link.classList.add('active');
            console.log('Navigation link clicked');
        });
    });

    // Scroll ke saath navigation bar ka color change
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.background = '#333';
            nav.style.color = '#fff';
            console.log('Scroll threshold reached');
        } else {
            nav.style.background = 'transparent';
            nav.style.color = '#333';
            console.log('Scroll threshold not reached');
        }
    });

    // Glass button ka JavaScript
    const glassButtons = document.querySelectorAll('.glass-button');

    glassButtons.forEach((button) => {
        button.addEventListener('mouseover', () => {
            button.style.background = '#ffe6cc';
            console.log('Glass button hovered');
        });
        button.addEventListener('mouseout', () => {
            button.style.background = '#ff69b4';
            console.log('Glass button not hovered');
        });
    });

    // Project container ka JavaScript
    const projectContainer = document.querySelector('.project-container');
    const projects = document.querySelectorAll('.project');

    projectContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('project')) {
            projects.forEach((project) => {
                project.classList.remove('active');
            });
            e.target.classList.add('active');
            console.log('Project clicked');
        }
    });

    // Form submission ka JavaScript
    const form = document.querySelector('form');
    const inputs = document.querySelectorAll('input, textarea');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData();
        inputs.forEach((input) => {
            formData.append(input.name, input.value);
        });
        console.log('Form submitted');
        console.log(formData);
    });

    // Scroll to top ka JavaScript
    const scrollBtn = document.querySelector('#scroll-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollBtn.style.display = 'block';
            console.log('Scroll threshold reached');
        } else {
            scrollBtn.style.display = 'none';
            console.log('Scroll threshold not reached');
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo(0, 0);
        console.log('Scroll to top clicked');
    });

    // Footer ka JavaScript
    const footer = document.querySelector('footer');

    footer.addEventListener('mouseover', () => {
        footer.style.background = '#ff69b4';
        footer.style.color = '#fff';
        console.log('Footer hovered');
    });
    footer.addEventListener('mouseout', () => {
        footer.style.background = '#333';
        footer.style.color = '#fff';
        console.log('Footer not hovered');
    });

    // Animations ka JavaScript
    const animations = document.querySelectorAll('.animate');

    window.addEventListener('scroll', () => {
        animations.forEach((animation) => {
            if (animation.getBoundingClientRect().top < window.innerHeight) {
                animation.classList.add('animate');
                console.log('Animation triggered');
            }
        });
    });
} catch (error) {
    console.error(error);
}