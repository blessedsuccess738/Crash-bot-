export class AutoLogin {
  async execute(page, username, password) {
    if (!username || !password) {
      console.log('[AUTO-LOGIN] No credentials provided, skipping auto-login.');
      return;
    }

    console.log('[AUTO-LOGIN] Attempting to auto sign in...');
    
    try {
      // Wait for the page to load enough to find login buttons
      // This is a generic approach, specific selectors might need adjustment based on the actual site structure
      
      // Look for a login button to open the modal
      const loginButtonSelectors = [
        'button:contains("Sign In")',
        'button:contains("Login")',
        'a[href*="login"]',
        '.login-btn'
      ];

      // We'll inject a script to find and click the login button
      await page.evaluate((selectors) => {
        for (const selector of selectors) {
          // jQuery-like contains selector workaround
          if (selector.includes(':contains')) {
            const text = selector.match(/:contains\("(.*)"\)/)[1];
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const target = buttons.find(b => b.textContent.includes(text));
            if (target) {
              target.click();
              return true;
            }
          } else {
            const target = document.querySelector(selector);
            if (target) {
              target.click();
              return true;
            }
          }
        }
        return false;
      }, loginButtonSelectors);

      // Wait a moment for modal to appear
      await new Promise(r => setTimeout(r, 2000));

      // Type credentials
      // We look for common input names/types
      await page.evaluate((user, pass) => {
        const emailInput = document.querySelector('input[type="email"], input[name="email"], input[name="username"]');
        const passInput = document.querySelector('input[type="password"], input[name="password"]');
        
        if (emailInput && passInput) {
          // Set values and dispatch events so React registers the change
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          
          nativeInputValueSetter.call(emailInput, user);
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          nativeInputValueSetter.call(passInput, pass);
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Find submit button
          const submitBtn = document.querySelector('button[type="submit"], form button');
          if (submitBtn) {
            setTimeout(() => submitBtn.click(), 500);
          }
        }
      }, username, password);

      console.log('[AUTO-LOGIN] Credentials injected and submitted.');
    } catch (err) {
      console.error('[AUTO-LOGIN] Failed to auto-login:', err.message);
    }
  }
}
