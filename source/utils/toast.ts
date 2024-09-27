import { browser } from 'webextension-polyfill-ts'
import { getToastIcon } from '../consts/icons'

interface IToastParams {
	tabId: number
	variant: 'info' | 'warn' | 'success' | 'error'
	msg?: string
	timer?: number
	showTimer?: boolean
}

export function showInfoToast({ tabId, variant, msg, timer = 10, showTimer = false }: IToastParams): Promise<void> {
	const icon = getToastIcon(variant, 30)
	const styleUrl = browser.runtime.getURL('css/background.css')
	const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

	browser.tabs.insertCSS(tabId, { file: styleUrl })

	return new Promise(resolve => {
		const listener = (msg: any) => {
			if (msg.toastId === toastId && msg.action === 'timerEnd') {
				resolve()
				browser.runtime.onMessage.removeListener(listener)
			}
		}

		browser.runtime.onMessage.addListener(listener)

		browser.tabs.executeScript(tabId, {
			code: `(${createToast.toString()})(${JSON.stringify(icon)}, ${JSON.stringify(msg)}, ${timer}, '${variant}', '${toastId}', ${showTimer})`
		})
	})
}

function createToast(
	icon: string,
	message: string,
	timer: number,
	variant: string,
	toastId: string,
	showTimer: boolean = false
) {
	const toast = document.createElement('div')
	toast.className = `toast toast--${variant} show`

	const iconDiv = document.createElement('div')
	iconDiv.className = 'icon'
	iconDiv.innerHTML = icon

	const bodyDiv = document.createElement('div')
	bodyDiv.className = 'body'
	bodyDiv.textContent = message

	const progressBar = document.createElement('span')
	progressBar.className = 'progress'
	progressBar.style.width = '100%'

	toast.appendChild(iconDiv)
	toast.appendChild(bodyDiv)
	toast.appendChild(progressBar)

	const existingToastWrapper = document.querySelector('.easy-willpower__toast-wrapper')

	let toastWrapper
	if (!existingToastWrapper) {
		toastWrapper = document.createElement('div')
		toastWrapper.className = 'easy-willpower__toast-wrapper'
		document.body.appendChild(toastWrapper)
	} else {
		toastWrapper = existingToastWrapper
	}

	toastWrapper.appendChild(toast)

	if (document.fullscreenElement) {
		document.exitFullscreen()
	}

	let timeLeft = timer * 1000
	const countdown = setInterval(() => {
		if (timeLeft <= 0) {
			clearInterval(countdown)
			chrome.runtime.sendMessage({ toastId, action: 'timerEnd' })
			setTimeout(() => {
				toast.classList.replace('show', 'hide')
				setTimeout(() => toast.remove(), 200)
			}, 1000)
			return
		}

		if (showTimer) {
			bodyDiv.textContent = `Time left: ${(timeLeft / 1000).toFixed(0)} minutes`
		}

		const percentage = Math.max(0, (timeLeft / (timer * 1000)) * 100)
		progressBar.style.width = percentage + '%'
		timeLeft -= 100
	}, 100)
}
