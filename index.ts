import { readFileSync, existsSync, statSync } from 'node:fs'
import { stdin, stdout } from 'node:process'
import readLine from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

type DataType = {
	date: string
	upload: string
	download: string
	rawUpload: number
	rawDownload: number
}[]

function parseData(dt: number) {
	if (isNaN(dt) || dt < 0) return 'Invalid data'
	if (dt < 1024) return `${dt.toFixed(2)} KB`
	if (dt < 1024 * 1024) return `${(dt / 1024).toFixed(2)} MB`
	return `${(dt / (1024 * 1024)).toFixed(2)} GB`
}
async function askAndSort(data: DataType) {
	console.log('How do you want the data to be sorted?')
	console.log('1. By Date (Ascending)')
	console.log('2. By Date (Descending)')
	console.log('3. By Upload (Ascending)')
	console.log('4. By Upload (Descending)')
	console.log('5. By Download (Ascending)')
	console.log('6. By Download (Descending)')

	const rl = readLine.createInterface({
		input: stdin,
		output: stdout
	})

	const answer = await rl.question('Enter your choice (1/2/3/4/5/6): ')
	if (answer === '1') data.sort((a, b) => a.date.localeCompare(b.date))
	else if (answer === '2') data.sort((a, b) => b.date.localeCompare(a.date))
	else if (answer === '3') data.sort((a, b) => a.rawUpload - b.rawUpload)
	else if (answer === '4') data.sort((a, b) => b.rawUpload - a.rawUpload)
	else if (answer === '5') data.sort((a, b) => a.rawDownload - b.rawDownload)
	else if (answer === '6') data.sort((a, b) => b.rawDownload - a.rawDownload)
	else {
		rl.close()
		console.error('Invalid choice. You can only enter 1/2/3/4/5/6.\n')
		return askAndSort(data)
	}
	rl.close()
}

;(async () => {
	try {
		const filePath = fileURLToPath(new URL('./history_traffic.dat', import.meta.url))
		if (!existsSync(filePath)) {
			console.error(`File "${filePath}" does not exist.\nPlease ensure the file is in the same directory as this script.`)
			return
		}
		if (!statSync(filePath).isFile()) {
			console.error(`File "${filePath}" is not a file.\nPlease ensure the file is in the same directory as this script.`)
			return
		}

		const data: DataType = []
		const rawFile = readFileSync(filePath, 'utf-8')

		rawFile.split('\n').forEach((line, index) => {
			if (index === 0) return
			line = line.trim()
			if (!line) return
			const [date, uploadDownload] = line.split(' ')
			const [upload, download] = uploadDownload.split('/')
			data.push({
				date: date,
				upload: parseData(parseInt(upload, 10)),
				download: parseData(parseInt(download, 10)),
				rawUpload: parseInt(upload, 10),
				rawDownload: parseInt(download, 10)
			})
		})

		await askAndSort(data)
		console.table(
			data.map(item => {
				return {
					'🗓️  Date': item.date,
					'⬆️  Uploaded Data': item.upload,
					'⬇️  Downloaded Data': item.download
				}
			})
		)
	} catch {
		console.error('An error occurred while processing the data.')
	}
})()
