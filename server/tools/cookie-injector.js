export const cookieInjector = {
  name: 'Cookie Injector',
  description: 'Injects session cookies for instant login',
  
  inject: async (page, cookieString) => {
    if (!page || !cookieString) return false;
    
    try {
      const cookies = cookieString.split(';').map(pair => {
        const [name, ...rest] = pair.split('=');
        return {
          name: name.trim(),
          value: rest.join('=').trim(),
          domain: new URL(page.url()).hostname
        };
      });
      
      await page.setCookie(...cookies);
      console.log('[Cookie Injector] Injected', cookies.length, 'cookies.');
      return true;
    } catch (e) {
      console.error('[Cookie Injector] Failed to inject cookies:', e);
      return false;
    }
  }
};
