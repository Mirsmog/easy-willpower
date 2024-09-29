import { browser } from 'webextension-polyfill-ts'
import { getToastIcon } from '../consts/icons'

interface IToastParams {
	tabId: number
	variant: 'info' | 'warn' | 'success' | 'error'
	message?: string
	timer?: number
	showTimer?: boolean
}

export function showInfoToast({ tabId, variant, message, timer = 5, showTimer = false }: IToastParams): Promise<void> {
	const icon = getToastIcon(variant, 30)
	const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

	return new Promise(resolve => {
		const listener = (msg: any) => {
			if (msg.toastId === toastId && msg.action === 'timerEnd') {
				resolve()
				browser.runtime.onMessage.removeListener(listener)
			}
		}

		browser.runtime.onMessage.addListener(listener)

		browser.tabs.executeScript(tabId, {
			code: `(${createToast.toString()})(${JSON.stringify(icon)}, ${JSON.stringify(message)}, ${timer}, '${variant}', '${toastId}', ${showTimer})`
		})
	})
}

function createToast(
	icon: string,
	message: string,
	timer: number,
	variant: 'warn' | 'info' | 'success' | 'error',
	toastId: number,
	showTimer = false
) {
	const toastWrapper = document.createElement('div')
	const shadow = toastWrapper.attachShadow({ mode: 'open' })
	const style = document.createElement('style')
	style.textContent = `
    :host {
			--toast-spacing: 10px;
			--toast-color-info: 0, 145, 255;
			--toast-color-success: 48, 209, 88;
			--toast-color-error: 214, 50, 50;
			--toast-color-warning: 255, 159, 10;
			--toast-bg-opacity: 0.3;
      padding: 0!important;
      margin:0!important;
      background-color: transparent!important;
			width: 100%!important;
			max-width: 350px!important;
			position: fixed!important;
			top: var(--toast-spacing)!important;
			right: var(--toast-spacing)!important;
			z-index: 9999!important;
			display: flex!important;
			flex-direction: column!important;
			gap: 10px!important;
		}

		.toast {
			--color-variant: 55, 55, 55;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
			padding: 20px 16px;
			border-radius: 8px;
			max-width: 350px;
			background-color: rgba(var(--color-variant), var(--toast-bg-opacity));
			backdrop-filter: blur(10px) brightness(50%);
			outline: 1px solid rgba(var(--color-variant), 0.5);
			outline-offset: -1px;
			color: white;
			font-size: 18px;
			font-weight: 500;
			display: flex !important;
			flex-wrap: nowrap !important;
			align-items: center;
			gap: 10px;
			position: relative;
			overflow: hidden;
		}

		.toast.toast--info {
			--color-variant: var(--toast-color-info);
		}

		.toast.toast--success {
			--color-variant: var(--toast-color-success);
		}

		.toast.toast--warn {
			--color-variant: var(--toast-color-warning);
		}

		.toast.toast--error {
			--color-variant: var(--toast-color-error);
		}

		.toast .progress {
			height: 3px;
			background-color: rgba(var(--color-variant), 1);
			position: absolute;
			bottom: 0;
			left: 0;
			transition: width 0.3s linear;
		}

		.toast .icon {
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.toast .icon svg {
			stroke: rgb(var(--color-variant));
		}

		.toast.show {
			animation: slideIn 0.5s cubic-bezier(0, 1.5, 0.5, 1) forwards;
		}

		.toast.hide {
			animation: slideOut 0.15s linear forwards;
		}

		@keyframes slideIn {
			from {
				transform: translateX(calc(100% + var(--toast-spacing)));
			}
			to {
				transform: translateX(0%);
			}
		}

		@keyframes slideOut {
			from {
				transform: translateX(0%);
			}
			to {
				transform: translateX(calc(100% + var(--toast-spacing)));
			}
		}
	`

	shadow.appendChild(style)

	const toast = document.createElement('div')
	toast.className = `toast toast--${variant} show`

	const iconDiv = document.createElement('div')
	iconDiv.className = 'icon'
	iconDiv.innerHTML = icon

	const bodyDiv = document.createElement('div')
	bodyDiv.className = 'body'
	bodyDiv.textContent = showTimer ? message.replace('$TIMER', `${timer}`) : message

	const progressBar = document.createElement('span')
	progressBar.className = 'progress'
	progressBar.style.width = '100%'

	toast.appendChild(iconDiv)
	toast.appendChild(bodyDiv)
	toast.appendChild(progressBar)
	shadow.appendChild(toast)

	document.body.appendChild(toastWrapper)

	let timeLeft = timer * 1000
	const countdown = setInterval(() => {
		if (timeLeft <= 0) {
			clearInterval(countdown)
			progressBar.style.width = '0%'
			setTimeout(() => {
				toast.classList.replace('show', 'hide')
				setTimeout(() => {
					chrome.runtime.sendMessage({ toastId, action: 'timerEnd' })
				}, 200)
			}, 1000)
			return
		}

		if (showTimer) {
			bodyDiv.textContent = message.replace('$TIMER', `${(timeLeft / 1000).toFixed(0)}`)
		}

		const percentage = Math.max(0, (timeLeft / (timer * 1000)) * 100)
		progressBar.style.width = percentage + '%'
		timeLeft -= 100
	}, 100)
}
