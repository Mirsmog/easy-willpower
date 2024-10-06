import React, { CSSProperties, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { IHistoryReward } from '../utils/reward'
import './styles.scss'

// FIX: Clear code move styles to css file and change design

const styles = {
	container: {
		padding: '20px',
		fontFamily: 'Arial, sans-serif',
		backgroundColor: '#ffffff',
		borderRadius: '8px',
		width: '350px',
		margin: '0 auto',
		boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
		transition: 'transform 0.3s',
		':hover': {
			transform: 'scale(1.03)'
		}
	} as CSSProperties,
	header: {
		fontSize: '32px',
		marginBottom: '10px',
		color: '#2980b9',
		textAlign: 'center'
	} as CSSProperties,
	balance: {
		fontSize: '24px',
		display: 'flex',
		flexWrap: 'wrap',
		fontWeight: 'bold',
		marginBottom: '20px',
		color: '#16a085',
		textAlign: 'center'
	} as CSSProperties,
	subHeader: {
		fontSize: '26px',
		marginBottom: '10px',
		color: '#2c3e50'
	} as CSSProperties,
	inputContainer: {
		display: 'flex',
		marginBottom: '20px',
		borderRadius: '5px',
		overflow: 'hidden',
		border: '1px solid #bdc3c7'
	} as CSSProperties,
	input: {
		flex: '1',
		padding: '15px',
		border: 'none',
		fontSize: '16px'
	} as CSSProperties,
	addButton: {
		padding: '15px 20px',
		backgroundColor: '#1abc9c',
		color: '#fff',
		border: 'none',
		borderRadius: '0',
		cursor: 'pointer',
		fontSize: '16px',
		transition: 'background-color 0.3s',
		':hover': {
			backgroundColor: '#16a085'
		}
	} as CSSProperties,
	siteList: {
		listStyleType: 'none',
		padding: 0
	} as CSSProperties,
	siteItem: {
		display: 'flex',
		justifyContent: 'space-between',
		padding: '15px',
		backgroundColor: '#ecf0f1',
		alignItems: 'center',
		fontSize: 18,
		borderRadius: '4px',
		marginBottom: '10px',
		boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
		transition: 'background-color 0.3s',
		':hover': {
			backgroundColor: '#bdc3c7'
		}
	} as CSSProperties,
	removeButton: {
		backgroundColor: '#e74c3c',
		color: '#fff',
		border: 'none',
		borderRadius: '4px',
		padding: '8px 12px',
		cursor: 'pointer',
		transition: 'background-color 0.3s',
		':hover': {
			backgroundColor: '#c0392b'
		}
	} as CSSProperties,
	historyList: {
		listStyleType: 'none',
		padding: 0
	} as CSSProperties,
	historyItem: {
		padding: '15px',
		backgroundColor: '#f8f9fa',
		borderRadius: '4px',
		marginBottom: '10px',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
		display: 'flex',
		flexDirection: 'column',
		gap: '5px',
		transition: 'box-shadow 0.3s',
		':hover': {
			boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
		}
	} as CSSProperties,
	rewardName: {
		fontWeight: 'bold',
		fontSize: '18px',
		textTransform: 'capitalize',
		color: '#8e44ad'
	} as CSSProperties,
	effect: {
		color: '#34495e'
	} as CSSProperties,
	balanceIncrease: {
		color: '#27ae60'
	} as CSSProperties,
	newBalance: {
		color: '#2980b9'
	} as CSSProperties
}

const Popup: React.FC = () => {
	const [accessLimitedSites, setAccessLimitedSites] = useState<string[]>([])
	const [savedBalance, setSavedBalance] = useState(0)
	const [heatValue, setHeatValue] = useState({ value: 0 })
	const [balance, setBalance] = useState(0)
	const [newSite, setNewSite] = useState('')
	const [rewardsHistory, setRewardsHistory] = useState<IHistoryReward[]>([])

	const fetchData = async () => {
		const result = await browser.storage.local.get([
			'accessLimitedSites',
			'lastBalance',
			'rewardsHistory',
			'savedBalance',
			'heatEffect'
		])
		setAccessLimitedSites(result.accessLimitedSites || [])
		setBalance(result.lastBalance || 0)
		setSavedBalance(result.savedBalance || 0)
		setRewardsHistory(result.rewardsHistory || [])
		setHeatValue({ value: result.heatEffect.value || 0 })
	}

	useEffect(() => {
		fetchData()

		const intervalId = setInterval(() => {
			browser.storage.local.get(['lastBalance', 'rewardsHistory', 'heatEffect']).then(result => {
				setBalance(result.lastBalance || 0)
				setRewardsHistory(result.rewardsHistory || [])

				setHeatValue({ value: result.heatEffect.value || 0 })
			})
		}, 60000)

		return () => clearInterval(intervalId)
	}, [])

	const addSite = () => {
		if (newSite && !accessLimitedSites.includes(newSite)) {
			const updatedSites = [...accessLimitedSites, newSite]
			setAccessLimitedSites(updatedSites)
			browser.storage.local.set({ accessLimitedSites: updatedSites })
			setNewSite('')
		}
	}

	const removeSite = (site: string) => {
		const updatedSites = accessLimitedSites.filter(s => s !== site)
		setAccessLimitedSites(updatedSites)
		browser.storage.local.set({ accessLimitedSites: updatedSites })
	}

	const hours = Math.floor(balance / 60)
	const remainingMinutes = balance % 60
	const formattedTime = `${hours}h ${remainingMinutes}m - (${balance}) ${'Saved' + (savedBalance > 0 && savedBalance)}`

	return (
		<div style={styles.container}>
			<h1 style={styles.header}>🎉 Time Balance</h1>
			<div>
				<div style={styles.balance}>{formattedTime}</div>
			</div>
			{heatValue.value > 0 && (
				<div style={{ display: 'flex', justifyContent: 'center', gap: 5, fontSize: 18 }}>
					<span style={{ fontWeight: 600, color: '#2c3e50' }}>HEAT - </span>
					<span style={{ color: 'red', fontSize: 18 }}>({heatValue.value})</span>
				</div>
			)}

			<h2 style={styles.subHeader}>🛡️ Blocked Sites</h2>
			<div style={styles.inputContainer}>
				<input
					type='text'
					value={newSite}
					onChange={e => setNewSite(e.target.value)}
					placeholder='Add a site to block'
					style={styles.input}
				/>
				<button
					onClick={addSite}
					style={styles.addButton}
				>
					Add
				</button>
			</div>

			<ul style={styles.siteList}>
				{accessLimitedSites.map(site => (
					<li
						key={site}
						style={styles.siteItem}
					>
						<span>{site}</span>
						<button
							onClick={() => removeSite(site)}
							style={styles.removeButton}
						>
							Remove
						</button>
					</li>
				))}
			</ul>

			<h2 style={styles.subHeader}>🏆 Reward History</h2>
			<ul style={styles.historyList}>
				{rewardsHistory.reverse().map((reward, index) => (
					<li
						key={index}
						style={styles.historyItem}
					>
						<span style={styles.rewardName}>{reward.name}</span>
						<span style={styles.effect}>Effect: {reward.effect}</span>
						<span style={styles.balanceIncrease}>Balance Increase: {reward.balanceIncrease}</span>
						<span style={styles.newBalance}>New Balance: {reward.newBalance}</span>
					</li>
				))}
			</ul>
		</div>
	)
}

export default Popup
