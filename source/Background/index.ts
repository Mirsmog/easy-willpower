import { Tabs } from 'webextension-polyfill'
import { browser } from 'webextension-polyfill-ts'
import {
	getLocalStorage,
	setLocalStorage,
	applyReward,
	getWakaTimeStats,
	showInfoToast,
	handleNavigation
} from '../utils'

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
	if (!tab || !tab.id) return

	const { isOnBlockedPage, isOnLimitedTab } = await handleTabs()
	const blockUrl = browser.runtime.getURL(`blocked.html?refer=${tab.url}`)
	const referUrl = new URLSearchParams(new URL(tab.url || '').search).get('refer')

	if (unblock && referUrl) {
		if (tab.active) {
			await showInfoToast({
				tabId: tab.id,
				variant: 'success',
				message: 'Redirecting you back. Joy!',
				timer: 2
			})
		}
		await browser.tabs.update(tab.id, { url: referUrl })
	} else if (!isOnBlockedPage && isOnLimitedTab) {
		await browser.tabs.update(tab.id, { url: blockUrl })
	}
}

async function refreshBalance() {
	const { newBalance } = await getWakaTimeStats()
	const today = new Date().toLocaleDateString()
	const currentHour = new Date().getHours()

	const {
		prevBalance = 0,
		lastBalance = 0,
		savedBalance = 0,
		lastDateCheck = '',
		earlyBonus = false,
		heatEffect = { value: 0, level: 1 }
	} = await getLocalStorage(['lastBalance', 'prevBalance', 'lastDateCheck', 'savedBalance', 'heatEffect', 'earlyBonus'])

	if (lastDateCheck !== today) {
		const unusedTime = Math.min(lastBalance, 360)
		await setLocalStorage({
			lastBalance: 0,
			prevBalance: 0,
			savedBalance: unusedTime,
			lastDateCheck: today,
			earlyBonus: false,
			rewardsHistory: []
		})
	}

	const diffBalance = newBalance - prevBalance

	if (diffBalance > 0) {
		const { currentTab } = await handleTabs()
		let currentBalance = lastBalance + diffBalance

		const rewardChance = Math.random()

		if (rewardChance <= 0.2) {
			currentBalance = await applyReward(currentBalance)
		}

		if (!earlyBonus && currentHour === 4 && newBalance >= 10) {
			currentBalance += 50
			await setLocalStorage({ earlyBonus: true })
			if (currentTab && currentTab.id) {
				showInfoToast({
					tabId: currentTab.id,
					variant: 'info',
					message: `You've earned a early bonus! Current balance: ${currentBalance}`
				})
			}
		}

		// penalty
		if (!earlyBonus && currentHour > 4) {
			currentBalance -= 120
			await setLocalStorage({ earlyBonus: true })
		}

		if (newBalance > 60 && savedBalance > 0) {
			currentBalance += savedBalance
			await setLocalStorage({
				savedBalance: 0
			})

			if (currentTab && currentTab.id) {
				showInfoToast({
					tabId: currentTab.id,
					variant: 'info',
					message: `Your saved time has been added! Current: ${currentBalance}`
				})
			}
		}

		if (heatEffect.value > 0) {
			heatEffect.value = Math.max(heatEffect.value - 2, 0)
		}

		await setLocalStorage({ prevBalance: newBalance, lastBalance: currentBalance, heatEffect })
	}

	await checkAndUpdateBalance()
}

async function checkAndUpdateBalance() {
	let { lastBalance = 0, heatEffect = { value: 0, level: 1 } } = await getLocalStorage(['lastBalance', 'heatEffect'])
	const { isBalanceInUse, isOnBlockedPage, currentTab } = await handleTabs()
	let heatLevel = heatEffect.level
	let heatValue = heatEffect.value

	if (!currentTab || !currentTab.id) return

	if (isOnBlockedPage && lastBalance > 0) {
		const allTabs = await browser.tabs.query({ currentWindow: true })
		const blockedTabs = allTabs.filter(tab => tab.url?.includes('blocked.html'))
		for (const tab of blockedTabs) {
			handleBlockTab(tab, true)
		}
	}

	if (!isBalanceInUse && heatValue > 0) {
		heatValue = Math.max(heatValue - 2, 0)
	}

	if (heatValue > 90) {
		heatLevel = 3
	} else if (heatValue > 60) {
		heatLevel = 2
	} else {
		heatLevel = 1
	}

	if (heatLevel !== heatEffect.level && currentTab.id) {
		if (heatLevel === 1) {
			showInfoToast({
				tabId: currentTab.id,
				variant: 'success',
				message: 'Heat level is back to normal. Joy!'
			})
		} else {
			showInfoToast({
				tabId: currentTab.id,
				variant: 'warn',
				message: `Heat level updated. level: ${heatLevel}!`
			})
		}
		await setLocalStorage({ heatEffect: { ...heatEffect, level: heatLevel } })
	}
	if (isBalanceInUse && lastBalance > 0) {
		heatValue++
		lastBalance = lastBalance - heatLevel
		await setLocalStorage({ lastBalance })
	}

	if (lastBalance === 1) {
		await showInfoToast({
			variant: 'error',
			message: 'Time left: $TIMER seconds',
			timer: 60,
			tabId: currentTab.id,
			showTimer: true
		})
		lastBalance--
		await setLocalStorage({ lastBalance })
		handleBlockTab(currentTab)
	}
	if (lastBalance <= 0) {
		handleBlockTab(currentTab)
	}
	await setLocalStorage({ heatEffect: { value: heatValue, level: heatLevel } })
}

refreshBalance()
handleNavigation()
setInterval(refreshBalance, 60000)
