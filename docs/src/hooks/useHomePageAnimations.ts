import { useEffect } from 'react';
import { setupDissectionAnimation } from '../components/animations/_dissectionAnimation';
import { setupHeaderAnimations } from '../components/animations/_headerAnimation';

const useHomePageAnimations = () => {
  useEffect(() => {
    setupHeaderAnimations();
    setupDissectionAnimation();
    return () => {
        
          document.querySelectorAll('.dissection, .logo').forEach(element => {
            element.classList.remove('animate');
          });
        };
  }, []);
  return undefined;
};

export default useHomePageAnimations