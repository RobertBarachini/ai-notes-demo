// Create a simple express server

import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import cors from 'cors'
import exec from 'child_process'

import { logger } from '#utils/logger.js'

const app = express()
const log = logger({ service: 'server', level: 'info' })

const PORT = process.env.PORT ?? 3000

const directoryUploads = 'uploads'
if (!fs.existsSync(directoryUploads)) {
	fs.mkdirSync(directoryUploads)
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/')
	},
	filename: (req, file, cb) => {
		cb(null, 'recording.wav')
	},
})

const upload = multer({ storage })

app.use(express.static('public'))
app.use(cors())

app.get('/hello', (req, res) => {
	res.status(200).send('Hello World!')
})

app.get('/env', (req, res) => {
	res.status(200).send(process.env)
})

// Return [result, null] if successful, [null, error] if unsuccessful
const runShellCommand = async (command) => {
	try {
		const exec_result = exec.execSync(command)
		const result = exec_result.toString('utf8')
		return [result, null]
	} catch (error) {
		return [null, error]
	}
}

const getWhisperResult = async (options) => {
	let { language, model, filepath } = options
	let command = `whisper`
	if (!filepath) {
		return [null, new Error('No filepath provided')]
	}
	if (!fs.existsSync(filepath)) {
		return [null, new Error('File does not exist')]
	}
	command += ` ${filepath}`
	if (language) {
		command += ` --language ${language}`
	}
	if (model) {
		command += ` --model ${model}`
	}
	command += ` --output_dir uploads`
	command += ` 2>/dev/null`
	const [shell_result, shell_error] = await runShellCommand(command)
	if (shell_error) {
		return [null, shell_error]
	}
	// Split by newline
	let result_lines = shell_result.split('\n')
	// Remove empty lines
	result_lines = result_lines.filter((line) => line !== '')
	// Return only lines starting with [
	result_lines = result_lines.filter((line) => line.startsWith('['))
	// Join as result string
	const result = result_lines.join('\n')
	return [result, null]
}

app.post('/upload', upload.single('audio'), async (req, res) => {
	// Store file in uploads folder
	log.info('File uploaded successfully.')
	// Run command "whisper uploads/recording.wav --language English --model tiny" and get the result string
	const [result, error] = await getWhisperResult({
		// language: req.query.language,
		// model: req.query.model,
		// filepath: req.file.path,
		filepath: 'uploads/recording.wav',
		language: 'English',
	})
	if (error) {
		log.error(error)
		res.status(500).send(`Error: ${error}`)
		return
	}
	// Send the result string back to the client
	res.send(`Whisper says: '${result}'`)
})

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
