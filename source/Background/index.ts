import { Tabs, WebRequest } from 'webextension-polyfill'
import { browser } from 'webextension-polyfill-ts'
import { getLocalStorage, getWakaTimeStats, setLocalStorage, showTimeLeftAlert } from '../utils'
import { applyReward } from '../utils/reward'

async function handleTabs() {
	const { accessLimitedSites = [] } = await getLocalStorage(['accessLimitedSites'])
	const tabs = await browser.tabs.query({ currentWindow: true })
	const currentTab = tabs.find(tab => tab.active)
	const isOnBlockedPage = currentTab?.url?.includes('blocked.html') || false
	let isLimitedTabAudible = false
	let isOnLimitedTab = false

	for (const tab of tabs) {
		for (const site of accessLimitedSites) {
			if (tab.url?.includes(site)) {
				if (tab.audible) isLimitedTabAudible = true
				if (tab.active) isOnLimitedTab = true
			}
		}
		if (isLimitedTabAudible && isOnLimitedTab) break
	}

	const isBalanceInUse = (isOnLimitedTab && !isOnBlockedPage) || isLimitedTabAudible

	return { isBalanceInUse, currentTab, isOnBlockedPage, isLimitedTabAudible, isOnLimitedTab }
}

async function handleBlockTab(tab: Tabs.Tab, unblock?: boolean) {
	const blockUrl = browser.runtime.getURL(`blocked.html?refer=${tab.url}`)
	const referUrl = new URLSearchParams(new URL(tab.url || '').search).get('refer')

	if (unblock && referUrl) {
		await browser.tabs.update(tab.id, { url: referUrl })
	} else {
		await browser.tabs.update(tab.id, { url: blockUrl })
	}
}

async function refreshBalance() {
	const { newBalance } = await getWakaTimeStats()
	const today = new Date().toLocaleDateString()

	const {
		prevBalance = 0,
		lastBalance = 0,
		lastDateCheck = ''
	} = await getLocalStorage(['lastBalance', 'prevBalance', 'lastDateCheck', 'savedBalance'])

	if (lastDateCheck !== today) {
		const unusedTime = Math.min(lastBalance, 360)
		await setLocalStorage({
			lastBalance: unusedTime,
			prevBalance: 0,
			lastDateCheck: today,
			rewardsHistory: []
		})
	}

	const diffBalance = newBalance - prevBalance

	if (diffBalance > 0) {
		let currentBalance = lastBalance + diffBalance

		const rewardChance = Math.random()
		if (rewardChance <= 0.3) {
			currentBalance = await applyReward(currentBalance)
		}

		await setLocalStorage({ prevBalance: newBalance, lastBalance: currentBalance })
	}

	await checkAndUpdateBalance()
}

async function checkAndUpdateBalance() {
	let { lastBalance } = await getLocalStorage(['lastBalance'])
	const { isBalanceInUse, isOnBlockedPage, currentTab } = await handleTabs()

	if (!currentTab || !currentTab.id) return

	if (isOnBlockedPage && lastBalance > 0) {
		handleBlockTab(currentTab, true)
	}

	if (!isOnBlockedPage && lastBalance === 1) {
		await showTimeLeftAlert(currentTab.id)
		handleBlockTab(currentTab)
	}

	if (isBalanceInUse && lastBalance > 0) {
		lastBalance--
		await setLocalStorage({ lastBalance })
	}
}
refreshBalance()

setInterval(refreshBalance, 60000)

browser.webRequest.onBeforeRequest.addListener(
	async (details: WebRequest.OnBeforeRequestDetailsType) => {
		const { lastBalance } = await getLocalStorage(['lastBalance'])
		const { accessLimitedSites = [] } = await getLocalStorage(['accessLimitedSites'])

		if (!details.originUrl?.includes('blocked.html')) {
			if (lastBalance <= 0) {
				for (const site of accessLimitedSites) {
					if (details.url.includes(site)) {
						const cleanUrl = new URL(details.originUrl || '')
						const originalUrl = `${cleanUrl.href}`

						const blockedPageUrl = browser.runtime.getURL(`blocked.html?refer=${encodeURIComponent(originalUrl)}`)

						browser.tabs.update(details.tabId, { url: blockedPageUrl })
						return { cancel: true }
					}
				}
			}
		}
		return { cancel: false }
	},
	{ urls: ['<all_urls>'] },
	['blocking']
)
