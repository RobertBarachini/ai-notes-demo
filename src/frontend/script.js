console.log('Hello from script.js')

//
////  Constants and variables
//
// ids
const idContainerSelectInput = 'containerSelectInput'
const idContainerRecordVoice = 'containerRecordVoice'
const idContainerWaitingFor = 'containerWaitingFor'
const idContainerTranscription = 'containerTranscription'
const idContainerGenerated = 'containerGenerated'
const idTextTranscription = 'textTranscription'
const idButtonStartRecording = 'buttonStartRecording'
const idButtonStopRecording = 'buttonStopRecording'
const idButtonUploadRecording = 'buttonUploadRecording'
const idAudioPreview = 'audioPreview'
const idAudioTranscription = 'audioTranscription' // present in Transcription container
const idButtonWaitingForX = 'buttonWaitingForX'
const idPromptCategory = 'promptCategory'
const idPromptCustom = 'promptCustom'
const idTextGenerated = 'textGenerated'
const assistantText = 'assistantText'

// containers (simulates SPA)
const containerIds = [
	idContainerSelectInput,
	idContainerRecordVoice,
	idContainerWaitingFor,
	idContainerTranscription,
	idContainerGenerated,
]
// Setup
const serverUri = 'http://localhost:3000'
// Script variables
let mediaRecorder
let audioChunks = []

//
//// Code
//

const startRecording = async () => {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
	mediaRecorder = new MediaRecorder(stream)
	audioChunks = []

	mediaRecorder.addEventListener('dataavailable', (event) => {
		audioChunks.push(event.data)
	})

	mediaRecorder.addEventListener('stop', () => {
		const audioBlob = new Blob(audioChunks)
		const audioUrl = URL.createObjectURL(audioBlob)
		document.getElementById(idAudioPreview).src = audioUrl
		document.getElementById(idAudioTranscription).src = audioUrl
		// const audio = new Audio(audioUrl)
		// audio.play()
	})

	mediaRecorder.start()
}

const stopRecording = () => {
	mediaRecorder.stop()
}

const uploadRecording = async () => {
	try {
		const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
		const formData = new FormData()
		formData.append('audio', audioBlob, 'recording.wav')

		const response = await fetch('http://localhost:3000/upload', {
			method: 'POST',
			body: formData,
		})

		if (response.ok) {
			console.log('Upload successful')
			const result = await response.text()
			return [result, null]
		} else {
			console.error('Upload failed - response not ok')
			const error = await response.text()
			return [null, error]
		}
	} catch (error) {
		console.error('Upload failed')
		console.error(error)
		return [null, error]
	}
}

const showContainer = (containerId) => {
	containerIds.forEach((id) => {
		const container = document.getElementById(id)
		// console.log('container', container)
		if (id === containerId) {
			container.style.display = 'flex'
		} else {
			container.style.display = 'none'
		}
	})
}

// eslint-disable-next-line no-unused-vars
const clickedStopRecording = () => {
	document.getElementById(idButtonStartRecording).style.display = 'flex'
	document.getElementById(idButtonStopRecording).style.display = 'none'
	document.getElementById(idButtonUploadRecording).style.display = 'flex'
	document.getElementById(idAudioPreview).style.display = 'flex'
	stopRecording()
}

// eslint-disable-next-line no-unused-vars
const clickedStartRecording = () => {
	document.getElementById(idButtonStartRecording).style.display = 'none'
	document.getElementById(idButtonStopRecording).style.display = 'flex'
	document.getElementById(idButtonUploadRecording).style.display = 'none'
	document.getElementById(idAudioPreview).style.display = 'none'
	startRecording()
}

// eslint-disable-next-line no-unused-vars
const clickedUploadRecording = async () => {
	document.getElementById(idButtonWaitingForX).innerText =
		'Waiting for Whisper transcription...'

	showContainer(idContainerWaitingFor)
	// eslint-disable-next-line no-unused-vars
	const [result, err] = await uploadRecording()
	// TODO: error handling and such
	document.getElementById(idAudioTranscription).style.display = 'flex'
	showContainer(idContainerTranscription)
	document.getElementById(idTextTranscription).innerText = result
}

const uploadFile = async (file) => {
	// similar to uploading from recording
	const formData = new FormData()
	// accept .wav files only
	formData.append('audio', file, 'recording.wav')
	try {
		const options = {
			method: 'POST',
			body: formData,
		}
		const response = await fetch(`${serverUri}/upload`, options)
		if (response.ok) {
			console.log('Upload successful')
			const result = await response.text()
			return [result, null]
		} else {
			console.error('Upload failed - response not ok')
			const error = await response.text()
			return [null, error]
		}
	} catch (error) {
		return [(null, error)]
	}
}

// eslint-disable-next-line no-unused-vars
const clickedUploadFile = async () => {
	// Allow only .wav files for now
	// const [fileHandle] = await window.showOpenFilePicker()
	try {
		const [fileHandle] = await window.showOpenFilePicker({
			types: [
				// {
				// 	description: 'Audio files',
				// 	accept: {
				// 		'audio/*': ['.wav'],
				// 	},
				// },
				{
					// description: 'Audio files',
					description: 'Audio files (.wav)',
					accept: {
						'audio/wav': ['.wav'],
					},
				},
			],
		})
		console.log('fileHandle', fileHandle)
		const file = await fileHandle.getFile()
		console.log('file', file)

		document.getElementById(idButtonWaitingForX).innerText =
			'Waiting for Whisper transcription...'
		document.getElementById(idAudioTranscription).style.display = 'flex'
		showContainer(idContainerWaitingFor)

		const [result, err] = await uploadFile(file)
		if (err) {
			console.error(err)
			return
		}

		showContainer(idContainerTranscription)
		document.getElementById(idTextTranscription).innerText = result
	} catch (error) {
		console.error(error)
	}
}

// eslint-disable-next-line no-unused-vars
const clickedEnterText = () => {
	document.getElementById(idAudioTranscription).style.display = 'none'
	showContainer(idContainerTranscription)
}

// eslint-disable-next-line no-unused-vars
const clickedRecordVoice = () => {
	showContainer(idContainerRecordVoice)
	document.getElementById(idButtonStartRecording).style.display = 'flex'
	document.getElementById(idButtonStopRecording).style.display = 'none'
	document.getElementById(idButtonUploadRecording).style.display = 'none'
	document.getElementById(idAudioPreview).style.display = 'none'
}

// eslint-disable-next-line no-unused-vars
const clickedBackToInputSelection = () => {
	showContainer(idContainerSelectInput)
}

// eslint-disable-next-line no-unused-vars
const clickedBackToTranscription = () => {
	showContainer(idContainerTranscription)
}

const generate = async () => {
	const text = document.getElementById(idTextTranscription).value
	let category = document.getElementById(idPromptCategory).value

	try {
		const options = { text, category }
		if (category === 'custom') {
			options.custom = document.getElementById(idPromptCustom).value
		}
		console.log(`Generate options: ${JSON.stringify(options)}`)

		const response = await fetch(`${serverUri}/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(options),
			responseType: 'text',
		})

		if (response.ok) {
			showContainer(idContainerGenerated)
			const elementTextGenerated = document.getElementById(idTextGenerated)
			// Static
			// const generated = await response.text();
			// document.getElementById('generated').value = generated;
			// Read and display the response as it arrives
			const reader = response.body.getReader()
			let result = ''
			// eslint-disable-next-line no-constant-condition
			while (true) {
				// change this to a more robust implementation later (famous last words)
				const { done, value } = await reader.read()
				// convert value to string
				const text = new TextDecoder('utf-8').decode(value)
				if (done) break
				result += text
				elementTextGenerated.value = result
				// Scroll to bottom
				elementTextGenerated.scrollTop = elementTextGenerated.scrollHeight
			}
		} else {
			console.error('Generation failed')
		}
	} catch (error) {
		console.error('Generation failed')
		console.error(error)
	}
}

// eslint-disable-next-line no-unused-vars
const clickedGenerate = async () => {
	document.getElementById(idButtonWaitingForX).innerText =
		'Waiting for OpenAI API...'
	showContainer(idContainerWaitingFor)
	generate() // Streaming response
}

const copyToClipboard = (elementId, caller) => {
	const element = document.getElementById(elementId)
	element.select()
	element.setSelectionRange(0, 99999) /* For mobile devices */
	navigator.clipboard.writeText(element.value)
	// Deselect
	element.setSelectionRange(0, 0)
	// Temporarily change caller element text to 'Copied!'
	const originalText = caller.innerText
	caller.innerText = 'Copied!'
	setTimeout(() => {
		caller.innerText = originalText
	}, 1000)
}

// eslint-disable-next-line no-unused-vars
const clickedCopyToClipboard = (callerId) => {
	const caller = document.getElementById(callerId)
	copyToClipboard(idTextGenerated, caller)
}

// eslint-disable-next-line no-unused-vars
const changedPromptCategory = () => {
	const promptCategory = document.getElementById(idPromptCategory).value
	if (promptCategory === 'custom') {
		document.getElementById(idPromptCustom).style.display = 'flex'
	} else {
		document.getElementById(idPromptCustom).style.display = 'none'
	}
}

// eslint-disable-next-line no-unused-vars
const toggleAssistant = () => {
	const assistant = document.getElementById(assistantText)
	if (assistant.style.display === 'none') {
		assistant.style.display = 'flex'
	} else {
		assistant.style.display = 'none'
	}
}

// eslint-disable-next-line no-unused-vars
const showContainerSelectInput = () => {
	showContainer(idContainerSelectInput)
}

const init = () => {
	// Start
	showContainerSelectInput()
	document.getElementById(idPromptCustom).style.display = 'none'
	document.getElementById(assistantText).style.display = 'none'
	// document.getElementById(idAudioTranscription).style.display = 'none'

	// Debug
	// showContainer(idContainerTranscription)
	// showContainer(idContainerGenerated)
}

init()
