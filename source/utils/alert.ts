import { browser } from 'webextension-polyfill-ts'

export async function showTimeLeftAlert(tabId: number): Promise<void> {
	return new Promise(resolve => {
		browser.runtime.onMessage.addListener(function listener(message) {
			if (message === 'timerEnd') {
				resolve()
				browser.runtime.onMessage.removeListener(listener)
			}
		})

		browser.tabs.executeScript(tabId, {
			code: `
            (() => {
                let timeLeft = 60;

                const existingPopup = document.getElementById('timerPopup');
                if (existingPopup) {
                    existingPopup.remove();
                }

                const popup = document.createElement('div');
                popup.style.position = 'fixed';
                popup.style.top = '10px';
                popup.style.left = '10px';
                popup.style.padding = '10px';
                popup.style.backgroundColor = 'rgba(255,0,0,0.6)';
                popup.style.backdropFilter = 'blur(10px)';
                popup.style.color = 'white';
                popup.style.fontSize = '16px';
                popup.style.zIndex = '9999';
                popup.style.borderRadius = '5px';
                popup.id = 'timerPopup';
                popup.textContent = 'Time left: ' + timeLeft + ' seconds';

                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }

                document.body.appendChild(popup);

                const countdown = setInterval(() => {
                    timeLeft--;
                    popup.textContent = 'Time left: ' + timeLeft + ' seconds';

                    if (timeLeft <= 0) {
                        clearInterval(countdown);
                        popup.remove();
                        chrome.runtime.sendMessage('timerEnd');
                    }
                }, 1000);
            })();
        `
		})
	})
}
