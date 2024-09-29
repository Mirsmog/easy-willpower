import axios from 'axios'
import React, { useState, useEffect } from 'react'
import './styles.scss'

interface IBlocked {}

interface IQuote {
	quoteText: string
	quoteAuthor: string
}

const Blocked: React.FC<IBlocked> = ({}) => {
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [quote, setQuote] = useState<IQuote | null>(null)
	const [imageLoaded, setImageLoaded] = useState(false)
	const [quoteLoaded, setQuoteLoaded] = useState(false)

	const imageParams = {
		min_size: 3840
	}

	const quoteParams = {
		method: 'getQuote',
		format: 'json',
		lang: 'ru'
	}

	useEffect(() => {
		const fetchImage = async () => {
			try {
				const { data } = await axios({
					method: 'GET',
					url: 'https://pic.re/image',
					responseType: 'blob',
					params: imageParams
				})
				const imageUrl = URL.createObjectURL(data)
				setImageUrl(imageUrl)
				setImageLoaded(true)
			} catch (error) {
				console.error('Error fetching the image:', error)
			}
		}

		const fetchQuote = async () => {
			try {
				const { data } = await axios<IQuote>({
					method: 'POST',
					url: 'https://api.forismatic.com/api/1.0/',
					params: quoteParams
				})
				setQuote(data)
				setQuoteLoaded(true)
			} catch (error) {
				console.error('Error fetching the quote:', error)
			}
		}
		fetchImage()
		fetchQuote()
	}, [])

	return (
		<div className='container'>
			{imageUrl && (
				<div
					className={`background-image ${imageLoaded ? 'fadeIn' : ''}`}
					style={{ backgroundImage: `url(${imageUrl})` }}
				/>
			)}

			<div className='wrapper'>
				{quote && (
					<blockquote className={`quote ${quoteLoaded ? 'scaleIn' : ''}`}>
						<span className='text'>
							<span className='symbol'>«</span> {quote.quoteText} <span className='symbol'>»</span>
						</span>
						<div className='author'>
							<div className='author__wrapper'>
								<span>Автор: </span>
								<cite className='name'>{quote.quoteAuthor || 'Unknown'}</cite>
							</div>
						</div>
					</blockquote>
				)}
			</div>
		</div>
	)
}

export default Blocked
