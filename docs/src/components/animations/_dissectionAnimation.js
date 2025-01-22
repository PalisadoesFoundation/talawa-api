export function setupDissectionAnimation() {
    const section = document.querySelector('.NativeDevelopment');
    const dissection = section.querySelector('.dissection');
    const images = dissection.children;
    const numImages = images.length;
  
    const fadeDistance = 40;
    const navbarHeight = 60;
  
    const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
  
    // Scale the percent so that `min` goes to 0% and `max` goes to 100%
    const scalePercent = (percent, min, max) => clamp((percent - min) / (max - min), 0, 1);
  
    // Get the percentage that the image should be on the screen given
    // how much the entire container is scrolled
    const getImagePercent = (index, scrollPercent) => {
      const start = index / numImages;
      return clamp((scrollPercent - start) * numImages, 0, 1);
    }
  
    const onScroll = () => {
      const elPos = section.getBoundingClientRect().top - navbarHeight;
      const height = window.innerHeight;
      const screenPercent = 1 - clamp(elPos / height, 0, 1);
      const scaledPercent = scalePercent(screenPercent, 0.2, 0.9);
  
      for (let i = 0; i < numImages; i++) {
        const imgPercent = getImagePercent(i, scaledPercent);
        images[i].style.opacity = imgPercent;
  
        const translation = fadeDistance * (1 - imgPercent);
        images[i].style.transform = `translateX(${translation}px)`;
      }
    }
  
    window.addEventListener('scroll', onScroll);
  
    return () => window.removeEventListener('scroll', onScroll);
  }
   