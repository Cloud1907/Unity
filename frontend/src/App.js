import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AnimatedRoutes from './components/AnimatedRoutes';
import { Toaster } from './components/ui/sonner';

function App() {
  // 🛡️ Emergent Preview Body Lock Fix
  useEffect(() => {
    const isPreviewEnv = window.location.hostname.includes('emergent') ||
      window.location.hostname.includes('preview');

    if (!isPreviewEnv) return;

    // Body lock protection enabled

    const unlockBody = () => {
      if (document.body) {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        document.body.removeAttribute('data-scroll-locked');
      }
    };

    unlockBody();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.body) {
          const hasLock = document.body.hasAttribute('data-scroll-locked') ||
            document.body.style.pointerEvents === 'none';

          if (hasLock) {
            console.warn('⚠️ Body locked detected! Auto-unlocking...');
            unlockBody();
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked', 'class']
    });

    const intervalId = setInterval(unlockBody, 1000);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
      // Body lock protection cleaned up
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <AnimatedRoutes />
              <Toaster />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
