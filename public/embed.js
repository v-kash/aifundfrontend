(function () {
  const scriptTag = document.currentScript;

  // 1. Read Configuration
  const config = {
    clientId: scriptTag.getAttribute("data-client-id") || "demo",
    primaryColor: scriptTag.getAttribute("data-primary-color") || "#4f46e5",
    botName: scriptTag.getAttribute("data-bot-name") || "AI Consultant",
    botAvatar:
      scriptTag.getAttribute("data-bot-avatar") ||
      "http://localhost:3000/default-bot.png",
    welcomeMsg:
      scriptTag.getAttribute("data-welcome-msg") ||
      "Hello! How can I help you today?",
    widgetUrl: "https://aifundfrontend-eight.vercel.app/embed",
    autoOpen: parseInt(scriptTag.getAttribute("data-auto-open") || "0", 10),
  };

  // 2. Inject Custom Animations & Styles (Removed pulseGlow)
  const styleSheet = document.createElement("style");
  styleSheet.innerHTML = `
    @keyframes launcherBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes tooltipPoint {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(8px); } /* Moves toward the bubble */
    }
    
    .saas-launcher-wrapper {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999; 
      display: flex; align-items: center; cursor: pointer;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    /* Updated Bubble: White background, no borders, no glowing ring */
    .saas-launcher-bubble {
      width: 60px; height: 60px; border-radius: 50%; 
      background-color: #ffffff; 
      display: flex; align-items: center; justify-content: center; 
      overflow: hidden; border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      animation: launcherBounce 2s ease-in-out infinite;
      transition: transform 0.2s ease, background-color 0.3s ease;
    }

    .saas-launcher-tooltip {
      background: #ffffff; color: #1e293b; padding: 10px 16px; 
      border-radius: 12px; font-size: 14px; font-weight: 600; 
      box-shadow: 0 4px 15px rgba(0,0,0,0.15); white-space: nowrap; 
      margin-right: 15px; position: relative; border: none;
      animation: tooltipPoint 1.5s ease-in-out infinite;
    }

    /* The little triangle pointing at the bubble */
    .saas-launcher-tooltip:after {
      content: ''; position: absolute; right: -10px; top: 50%; transform: translateY(-50%);
      border-top: 7px solid transparent; border-bottom: 7px solid transparent;
      border-left: 10px solid #ffffff;
    }

    .saas-launcher-wrapper:hover .saas-launcher-bubble {
      transform: scale(1.1);
      animation-play-state: paused; /* Stop bouncing when hovering to click */
    }
    .saas-launcher-wrapper:hover .saas-launcher-tooltip {
      animation-play-state: paused;
    }
  `;
  document.head.appendChild(styleSheet);

  // 3. Create Launcher Wrapper (Holds Tooltip and Bubble)
  const launcherWrapper = document.createElement("div");
  launcherWrapper.className = "saas-launcher-wrapper";

  // Tooltip Text
  const tooltip = document.createElement("div");
  tooltip.className = "saas-launcher-tooltip";
  tooltip.innerHTML = `👋 Talk to <span style="color: ${config.primaryColor};">${config.botName}</span>`;

  // Bubble (Circle Pic)
  const bubble = document.createElement("div");
  bubble.className = "saas-launcher-bubble";
  bubble.innerHTML = `<img src="${config.botAvatar}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Chat with ${config.botName}">`;

  launcherWrapper.appendChild(tooltip);
  launcherWrapper.appendChild(bubble);
  document.body.appendChild(launcherWrapper);

  // 4. Create Iframe Container + Footer
  const iframeContainer = document.createElement("div");
  iframeContainer.style.cssText = `
    position: fixed; bottom: 100px; right: 24px; width: 380px; height: 640px; 
    border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    z-index: 999999; display: none; overflow: hidden; background: white; flex-direction: column;
    opacity: 0; transform: translateY(20px) scale(0.95); 
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;

  const iframe = document.createElement("iframe");
  const params = new URLSearchParams({
    clientId: config.clientId,
    color: config.primaryColor,
    botName: config.botName,
    avatar: config.botAvatar,
    welcomeMsg: config.welcomeMsg,
  });

  iframe.src = `${config.widgetUrl}?${params.toString()}`;
  iframe.style.cssText = `width: 100%; height: 100%; border: none; flex-grow: 1;`;
  iframeContainer.appendChild(iframe);

  // "Powered By" Footer
  // const footer = document.createElement('div');
  // footer.style.cssText = `background: #f8fafc; color: #64748b; text-align: center; padding: 8px; font-size: 12px; border-top: 1px solid #e2e8f0; font-family: sans-serif;`;
  // footer.innerHTML = 'Powered by <a href="https://your-saas-domain.com" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: bold;">FundingAI</a>';
  // iframeContainer.appendChild(footer);

  document.body.appendChild(iframeContainer);

  // 5. Toggle and Auto-Open Logic
  let isOpen = false;

  const toggleChat = (open) => {
    isOpen = open !== undefined ? open : !isOpen;

    if (isOpen) {
      iframeContainer.style.display = "flex";
      // Trigger CSS transition for smooth opening
      setTimeout(() => {
        iframeContainer.style.opacity = "1";
        iframeContainer.style.transform = "translateY(0) scale(1)";
      }, 20);

      // Hide tooltip and change bubble to Close (X) button
      tooltip.style.display = "none";
      bubble.style.animation = "none"; // Stop bouncing
      bubble.style.backgroundColor = "#334155"; // Dark slate for close button
      bubble.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else {
      iframeContainer.style.opacity = "0";
      iframeContainer.style.transform = "translateY(20px) scale(0.95)";

      // Wait for transition to finish before hiding completely
      setTimeout(() => {
        if (!isOpen) iframeContainer.style.display = "none";
      }, 300);

      // Restore bubble and tooltip
      tooltip.style.display = "block";
      bubble.style.backgroundColor = "#ffffff"; // Keep background white
      bubble.innerHTML = `<img src="${config.botAvatar}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Chat with ${config.botName}">`;
      bubble.style.animation = "launcherBounce 2s ease-in-out infinite";
    }
  };

  launcherWrapper.onclick = () => toggleChat();

  if (config.autoOpen > 0) {
    setTimeout(() => {
      if (!isOpen) toggleChat(true);
    }, config.autoOpen * 1000);
  }
})();
