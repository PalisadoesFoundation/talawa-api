import { useEffect } from 'react';
import { setupDissectionAnimation } from '../components/animations/_dissectionAnimation';
import { setupHeaderAnimations } from '../components/animations/_headerAnimation';

const useHomePageAnimations = () => {
  useEffect(() => {
    setupHeaderAnimations();
    setupDissectionAnimation();
  }, []);
};

export default useHomePageAnimations