import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { IHistoryReward } from '../utils/reward'

const Popup: React.FC = () => {
	const [accessLimitedSites, setAccessLimitedSites] = useState<string[]>([])
	const [balance, setBalance] = useState(0)
	const [newSite, setNewSite] = useState('')
	const [rewardsHistory, setRewardsHistory] = useState<IHistoryReward[]>([])

	const fetchData = async () => {
		const result = await browser.storage.local.get(['accessLimitedSites', 'lastBalance', 'rewardsHistory'])
		setAccessLimitedSites(result.accessLimitedSites || [])
		setBalance(result.lastBalance || 0)
		setRewardsHistory(result.rewardsHistory || [])
	}

	useEffect(() => {
		fetchData()

		const intervalId = setInterval(() => {
			browser.storage.local.get(['lastBalance', 'rewardsHistory']).then(result => {
				setBalance(result.lastBalance || 0)
				setRewardsHistory(result.rewardsHistory || [])
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
	const formattedTime = `${hours}h ${remainingMinutes}m - (${balance})`

	return (
		<div style={styles.container}>
			<h1 style={styles.header}>🎉 Time Balance</h1>
			<div style={styles.balance}>{formattedTime}</div>

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
	},
	header: {
		fontSize: '32px',
		marginBottom: '10px',
		color: '#2980b9',
		textAlign: 'center'
	},
	balance: {
		fontSize: '24px',
		fontWeight: 'bold',
		marginBottom: '20px',
		color: '#16a085',
		textAlign: 'center'
	},
	subHeader: {
		fontSize: '26px',
		marginBottom: '10px',
		color: '#2c3e50'
	},
	inputContainer: {
		display: 'flex',
		marginBottom: '20px',
		borderRadius: '5px',
		overflow: 'hidden',
		border: '1px solid #bdc3c7'
	},
	input: {
		flex: '1',
		padding: '15px',
		border: 'none',
		fontSize: '16px'
	},
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
	},
	siteList: {
		listStyleType: 'none',
		padding: 0
	},
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
	},
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
	},
	historyList: {
		listStyleType: 'none',
		padding: 0
	},
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
	},
	rewardName: {
		fontWeight: 'bold',
		fontSize: '18px',
		textTransform: 'capitalize',
		color: '#8e44ad'
	},
	effect: {
		color: '#34495e'
	},
	balanceIncrease: {
		color: '#27ae60'
	},
	newBalance: {
		color: '#2980b9'
	}
}

export default Popup
