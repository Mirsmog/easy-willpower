import React from 'react'

interface IBlocked {}

const Blocked: React.FC<IBlocked> = ({}) => {
	React.useEffect(() => {
		document.title = 'hya'
	}, [])

	const alertStyles = {
		backgroundColor: 'red',
		display: 'inline-block',
		borderRadius: 5
	} as React.CSSProperties

	return <div style={alertStyles}>Alert: 23 minutes</div>
}

export default Blocked
