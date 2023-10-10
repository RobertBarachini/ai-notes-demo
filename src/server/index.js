// Create a simple express server

import exec from 'child_process'
import fs from 'fs'
import path from 'path'

import cors from 'cors'
import express from 'express'
import multer from 'multer'
import OpenAI from 'openai'

import { logger } from '#utils/logger.js'

const app = express()
const log = logger({ service: 'server', level: 'info' })
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

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
app.use(express.json())

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
	console.log(`Whisper options: ${JSON.stringify(options)}`)
	let { language, model, filepath } = options
	let command = 'whisper'
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
	command += ' --output_dir uploads'
	command += ' 2>/dev/null'
	const [shell_result, shell_error] = await runShellCommand(command)
	if (shell_error) {
		return [null, shell_error]
	}

	// // Split by newline
	// let result_lines = shell_result.split('\n')
	// // Remove empty lines
	// result_lines = result_lines.filter((line) => line !== '')
	// // Return only lines starting with [
	// result_lines = result_lines.filter((line) => line.startsWith('['))
	// // Join as result string
	// const result = result_lines.join('\n')

	// Read result from uploads/recording.txt
	try {
		const result_filepath = path.join('uploads', 'recording.txt')
		const result = fs.readFileSync(result_filepath, 'utf8')
		return [result, null]
	} catch (error) {
		return [null, error]
	}
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
		// model: 'tiny',
	})
	if (error) {
		log.error(error)
		res.status(500).send(`Error: ${error}`)
		return
	}
	// Send the result string back to the client
	// res.send(`Whisper says: '${result}'`)
	res.send(result)
})

const generate = async (options, res) => {
	try {
		const { text, category, custom } = options
		console.log(`Generate options: ${JSON.stringify(options)}`)
		const prompts = {
			documentation: 'write documentation from above text in markdown',
			'meeting-notes':
				'write meeting notes that are summarized and then organized by topic from above text in markdown',
			summary: 'write a summary from above text',
			'leading-questions':
				'write leading questions for the next meeting from above text formatted as a markdown list',
			custom: custom,
		}
		const prompt = prompts[category]
		const constructedPrompt = `${text}\n\n---\n\n${prompt}`
		const openaiOptions = {
			messages: [{ role: 'user', content: constructedPrompt }],
			model: 'gpt-3.5-turbo',
		}
		if (res) {
			openaiOptions.stream = true
		}
		const chatCompletion = await openai.chat.completions.create(openaiOptions)
		if (res) {
			res.setHeader('Content-Type', 'text/plain')
			for await (const part of chatCompletion) {
				// if (part.choices[0]?.delta?.content !== '') {
				// 	console.log(part.choices[0]?.delta?.content)
				// }
				res.write(part.choices[0]?.delta?.content || '')
			}
			res.end()
			return [null, null]
		}
		const result = chatCompletion.choices[0].message.content
		return [result, null]
	} catch (error) {
		return [null, error]
	}
}

app.post('/generate', async (req, res) => {
	const options = {
		text: req?.body?.text,
		category: req?.body?.category,
	}
	if (options.category === 'custom') {
		options.custom = req?.body?.custom
	}
	const [result, error] = await generate(options, res)
	if (error) {
		log.error(error)
		res.status(500).send(`Error: ${error}`)
		return
	}
	// res.send(result)
})

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
