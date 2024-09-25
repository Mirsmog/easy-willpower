import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'

const Popup: React.FC = () => {
	const [accessLimitedSites, setAccessLimitedSites] = useState<string[]>([])
	const [balance, setBalance] = useState(0)
	const [newSite, setNewSite] = useState('')

	const fetchData = async () => {
		const result = await browser.storage.local.get(['accessLimitedSites', 'lastBalance'])
		setAccessLimitedSites(result.accessLimitedSites || [])
		setBalance(result.lastBalance || 0)
	}

	useEffect(() => {
		fetchData()

		const intervalId = setInterval(() => {
			browser.storage.local.get('lastBalance').then(result => {
				setBalance(result.lastBalance || 0)
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
	const formattedTime = `${hours}h ${remainingMinutes}m`

	return (
		<div style={styles.container}>
			<h1 style={styles.header}>Time Balance</h1>
			<div style={styles.balance}>{formattedTime}</div>

			<h2 style={styles.subHeader}>Blocked Sites</h2>
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
		</div>
	)
}

const styles = {
	container: {
		padding: '20px',
		fontFamily: 'Arial, sans-serif',
		backgroundColor: '#f5f5f5',
		borderRadius: '8px',
		width: '260px',
		margin: '0 auto',
		boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
	},
	header: {
		fontSize: '24px',
		marginBottom: '10px',
		color: '#333'
	},
	balance: {
		fontSize: '18px',
		marginBottom: '20px',
		color: '#555'
	},
	subHeader: {
		fontSize: '20px',
		marginBottom: '10px',
		color: '#333'
	},
	inputContainer: {
		display: 'flex',
		marginBottom: '20px'
	},
	input: {
		flex: '1',
		padding: '8px',
		borderRadius: '4px',
		border: '1px solid #ccc',
		marginRight: '8px'
	},
	addButton: {
		padding: '8px 12px',
		backgroundColor: '#4CAF50',
		color: '#fff',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer'
	},
	siteList: {
		listStyleType: 'none',
		padding: 0
	},
	siteItem: {
		display: 'flex',
		justifyContent: 'space-between',
		padding: '8px',
		backgroundColor: '#fff',
		borderRadius: '4px',
		marginBottom: '8px',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
	},
	removeButton: {
		backgroundColor: '#f44336',
		color: '#fff',
		border: 'none',
		borderRadius: '4px',
		padding: '4px 8px',
		cursor: 'pointer'
	}
}

export default Popup
