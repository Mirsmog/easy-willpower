import { browser } from 'webextension-polyfill-ts'
import { getWakaTimeStats, showTimeLeftAlert } from '../utils'

let balance = 0

const API_UPDATE_INTERVAL = 60000 // Интервал обновления данных API (1 минута)
const CHECK_INTERVAL = 60000 // Интервал проверки (1 минута)

async function updateWakaTimeStats() {
	const stats = await getWakaTimeStats()
	const currentTotalMinutes = stats.totalMinutes

	const { previousTotalMinutes, balance: savedBalance } = await browser.storage.local.get([
		'previousTotalMinutes',
		'balance'
	])

	let previousMinutes = previousTotalMinutes || 0
	let currentBalance = savedBalance || 0

	const newMinutes = currentTotalMinutes - previousMinutes
	if (newMinutes > 0) {
		currentBalance += newMinutes
		previousMinutes = currentTotalMinutes
		await browser.storage.local.set({ previousTotalMinutes: previousMinutes, balance: currentBalance })
	}
	balance = currentBalance

	// Проверяем доступ к сайтам сразу, а не по интервалу
	await checkSites()
}

async function checkSites() {
	const { blockedSites } = await browser.storage.local.get(['blockedSites'])
	const tabs = await browser.tabs.query({ active: true, currentWindow: true })
	const activeTab = tabs[0]

	for (const site of blockedSites) {
		if (activeTab.url?.includes(site)) {
			// Если баланс меньше или равен нулю, сразу блокируем сайт
			if (balance <= 0) {
				await browser.tabs.update(activeTab.id, { url: 'https://some.com' })
				return // Выходим из функции, не продолжаем дальнейшую проверку
			} else {
				// Если баланс мал, но не нулевой, показываем попап
				if (balance <= 2 && activeTab.id) {
					await showTimeLeftAlert(activeTab.id)
				}
				balance--
				await browser.storage.local.set({ balance })
			}
		}
	}
}

updateWakaTimeStats()
setInterval(updateWakaTimeStats, API_UPDATE_INTERVAL)
setInterval(checkSites, CHECK_INTERVAL)
