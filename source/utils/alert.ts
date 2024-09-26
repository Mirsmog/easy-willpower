import { browser } from 'webextension-polyfill-ts'
import { IHistoryReward, Rarity } from './reward'

interface IToastParams {
	tabId: number
	title?: string
	description?: string
	variant?: 'success' | 'warn' | 'error'
	reward?: IHistoryReward
}

export async function showToast(params: IToastParams): Promise<void> {
	const { tabId, reward } = params

	if (reward) {
		console.log(reward)
		const { balanceIncrease, effect, name, newBalance } = reward

		const rarityStyles: { [key in Rarity]: string } = {
			[Rarity.Casual]: '#49a6ff',
			[Rarity.Rare]: '#1dbf63',
			[Rarity.Epic]: '#ffcc00',
			[Rarity.Legendary]: '#ff6600',
			[Rarity.Mythical]: '#e20000'
		}

		const bgColor = rarityStyles[name] || '#333'
		const rewardToast = `
            <div id="toast__easy_willpower" class="show" style="background-color: ${bgColor}">
                <div id='img'>🏆</div>
                <div id='desc'>
                    <strong>${name}</strong><br>
                    Эффект: ${effect}<br>
                    Увеличение баланса: +${balanceIncrease}<br>
                    Новый баланс: ${newBalance}
                </div>
            </div>
        `

		const styleUrl = browser.runtime.getURL('css/background.css')
		await browser.tabs.insertCSS(tabId, { file: styleUrl })
		console.log('inserted', styleUrl)

		browser.tabs.executeScript(tabId, {
			code: `
                document.body.insertAdjacentHTML("beforebegin", ${JSON.stringify(rewardToast)});
                setTimeout(() => {
                    document.getElementById('toast__easy_willpower').remove();
                }, 5000);
            `
		})
	}
}

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

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
