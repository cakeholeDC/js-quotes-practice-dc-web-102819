const BASE_URL = "http://localhost:3000"
const QUOTES_URL = `${BASE_URL}/quotes`
const LIKES_URL = `${BASE_URL}/likes`
const QUOTES_WITH_LIKES = `${QUOTES_URL}?_embed=likes`
// It might be a good idea to add event listener to make sure this file 
// only runs after the DOM has finshed loading. 
document.addEventListener("DOMContentLoaded", function(){
	console.log('connected')
	fetchQuotes()
	addListeners()
})

function getForm() {
	return document.querySelector('#new-quote-form')
}

function addListeners() {
	getForm().addEventListener('submit', processNewQuote)
	let sortButton = document.getElementById('btn-sort')
	sortButton.classList.add('btn-primary')
	sortButton.classList.add('btn')
	sortButton.innerText = "Sort By Author"
	sortButton.addEventListener('click', toggleSort)
}


function fetchQuotes(sort=null) {
	let quoteList = document.querySelector('#quote-list')
	quoteList.innerHTML = ''

	let url = QUOTES_WITH_LIKES
	if (sort) {
		url += `&_sort=${sort}`
	}

	fetch(url)
		.then(response => response.json())
		.then(quotes => quotes.forEach(quote => renderQuote(quote)))
		.catch(error => console.log(error.message))
}

function renderQuote(quote) {
	let quoteList = document.querySelector('#quote-list')

	let quoteCard = document.createElement('li')
	quoteCard.classList.add('quote-card')
	quoteCard.id = `quote-card-${quote.id}`
	quoteList.appendChild(quoteCard)

	let blockquote = document.createElement('blockquote')
	blockquote.classList.add('blockquote')
	quoteCard.appendChild(blockquote)

		let content = document.createElement('p')
		// content.classList.add('mb')
		content.innerText = quote.quote

		let author = document.createElement('footer')
		author.classList.add('blockquote-footer')
		author.innerText = quote.author

		let likesBtn = document.createElement('button')
		likesBtn.classList.add('btn-success')
		likesBtn.classList.add('btn')
		likesBtn.id = `btn-like-${quote.id}`
		likesBtn.addEventListener('click', likeQuote)
		likesBtn.innerText = "Likes: "

			let btnSpan = document.createElement('span')
			btnSpan.innerText = quote.likes ? quote.likes.length : 0
			likesBtn.appendChild(btnSpan)

		let deleteBtn = document.createElement('button')
		deleteBtn.classList.add('btn-danger')
		deleteBtn.classList.add('btn')
		deleteBtn.id = `btn-delete-${quote.id}`
		deleteBtn.addEventListener('click', deleteQuote)
		deleteBtn.innerText = "Delete"

		let editBtn = document.createElement('button')
		editBtn.classList.add('btn-warning')
		editBtn.classList.add('btn')
		editBtn.id = `btn-edit-${quote.id}`
		editBtn.addEventListener('click', editQuote)
		editBtn.innerText = "Edit"

	blockquote.append(content, author, likesBtn, deleteBtn, editBtn)
}

function processNewQuote(event) {
	event.preventDefault()

	let content = event.target.content.value
	let author = event.target.author.value

	let configObject = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({
			quote: content,
			author: author,
			likes: []
		})
	}

	fetch(QUOTES_URL, configObject)
		.then(response => {
			if(response.ok) {
				console.log("fetch success!")
				getForm().reset()
				return response.json()
			} else {
				alert("Something went wrong, please try again")
			}
		})
		.then(quote => renderQuote(quote))
	.catch(error => console.log(`Fetch Error: ${error.message}`))

	event.target.reset()

}

function deleteQuote(event) {
	let quoteID = event.target.id.split('-')[2]
	let quote = document.getElementById(`quote-card-${quoteID}`)

	let deleteConfig = {
		method: 'DELETE',
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		}
	}

	fetch(`${QUOTES_URL}/${quoteID}`, deleteConfig)
	.then(response => {
		if(response.ok) {
			quote.remove()
		} else {
			alert("Something went wrong, please try again")
		}
	})
	.catch(error => console.log(`Fetch Error: ${error.message}`))

}

function likeQuote(event) {
	let quoteID = Number(event.target.id.split('-')[2])	
	let currLikes = Number(event.target.innerText.split(' ')[1])
	let datetime = Number(new Date())

	let configObject = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({
			quoteId: quoteID,
			createdAt: datetime
		})
	}

	fetch(LIKES_URL, configObject)
		.then(response => {
			if(response.ok){
				return response.json()
			} else {
				alert("Something went wrong, please try again")
			}
		})
		.then(json => {
			document.getElementById(`btn-like-${json.quoteId}`).innerText = `Likes: ${currLikes + 1}`
		})
		.catch(error => console.log(error.message))
}

function toggleSort(event) {
	let sortButton = document.getElementById('btn-sort')

	if (sortButton.classList.contains('btn-primary')) {
		sortButton.classList.add('btn-secondary')
		sortButton.classList.add('btn')
		sortButton.innerText = "Reset List Sorting"
		fetchQuotes('author')
	} else {
		sortButton.classList.add('btn-primary')
		sortButton.classList.add('btn')
		sortButton.innerText = "Sort By Author"
		fetchQuotes()
	}
}

function editQuote(event) {
	console.log('now editting')
	let quoteID = Number(event.target.id.split('-')[2])
	let quoteBlock = event.target.parentElement
	let content = quoteBlock.querySelector('p')
	let author = quoteBlock.querySelector('footer')

	// create edit form
	let editForm = document.createElement('form')
	editForm.addEventListener('submit', (event) => updateQuote(event, quoteID))
	editForm.id = "edit-form"

	editForm.innerHTML = `
		<div class="form-group">
			<label for="edit-quote">Edit Quote Body</label>
			<input type="text" name="content" class="form-control" id="edit-quote" value="${content.innerText}">
		</div>
		<div class="form-group">
			<label for="Author">Edit Author</label>
			<input type="text" name="author" class="form-control" id="edit-author" value="${author.innerText}">
		</div>
			<button type="submit" class="btn btn-primary edit-button">Edit Quote</button>
	`

	//hide existing data
	content.style.display = 'none'
	author.style.display = 'none'
	//hide edit button to prevent second click
	event.target.style.display = "none"

	quoteBlock.prepend(editForm)
}

function updateQuote(event, quoteID) {
	event.preventDefault()

	let content = event.target.content.value
	let author = event.target.author.value

	let configObject = {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({
			quote: content,
			author: author,
		})
	}

	fetch(`${QUOTES_URL}/${quoteID}`, configObject)
		.then(response => {
			if(response.ok) {
				console.log("patch success!")
				return response.json()
			} else {
				alert("Something went wrong, please try again")
			}
		})
		.then(quote => {
			let quoteBlock = event.target.parentElement
			
			let content = quoteBlock.querySelector('p')
			content.innerText = quote.quote
			content.style.display = 'block'

			let author = quoteBlock.querySelector('footer')
			author.innerText = quote.author
			author.style.display = 'block'
			//hide edit button to prevent second click
			quoteBlock.querySelector('.btn-warning').style.display = "inline"
			event.target.remove()
		})
	.catch(error => console.log(`Fetch Error: ${error.message}`))

}