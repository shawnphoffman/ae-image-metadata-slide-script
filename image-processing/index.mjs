import chalk from 'chalk'
import Geonames from 'geonames.js'
import { exiftool } from 'exiftool-vendored'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

// TODO - Change noLocation to be a status file for no location images, API errors, etc
// TODO - Should noLocation images fall back to the previous image's location?

// node polyfill
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const inDir = path.join(__dirname, './images/test')
const outDir = path.join(__dirname, './images/test-out')

let fetchedLocationCache = {}
const cachePath = path.join(__dirname, './data/cache.json')
let filenameToLocationCache = {}
const fileCachePath = path.join(__dirname, './data/files.json')
let noMetadataCache = []
const noLocationPath = path.join(__dirname, './data/no-location.json')
let prevFormatted = ''

// const LogExistingKeys = ['Location', 'XPComment', 'GPSLatitude', 'GPSLongitude']
const LogExistingKeys = []
// const LogGeoKeys = ['adminCode1', 'city', 'countryName', 'fclName']
const LogGeoKeys = []

const geonames = Geonames({
	username: 'shawnphoffman',
	lan: 'en',
	encoding: 'JSON',
})

const getFilenames = filePath => {
	var filenameWithExtension = filePath.split('/').pop()

	var inPath = path.join(inDir, filenameWithExtension)
	var outPath = path.join(outDir, filenameWithExtension)

	// console.log({ inPath, outPath })
	return { inPath, outPath, filenameWithExtension }
}

async function processFile(file) {
	const { inPath, outPath, filenameWithExtension: fn } = getFilenames(file)
	console.log(chalk.yellowBright.bold(`Processing ${fn}`))
	let formatted
	try {
		console.log(` - Copying`)
		try {
			await fs.copyFile(inPath, outPath, fs.constants.COPYFILE_EXCL)
		} catch {}

		console.log(` - Reading exif data`)
		const imageTags = await exiftool.read(inPath)

		// console.log(`\n++++ EXISTING IMAGE TAGS ++++`)
		Object.keys(imageTags)
			.sort(function (a, b) {
				return a.toLowerCase().localeCompare(b.toLowerCase())
			})
			.forEach(key => {
				if (LogExistingKeys.includes(key)) {
					console.log(` - ${key}: ${imageTags[key]}`)
				}
			})

		const hasLocation = imageTags?.GPSLatitude || imageTags?.GPSLongitude
		if (!hasLocation) {
			noMetadataCache.add(fn)
		}
		const cacheKey = !hasLocation ? '0,0' : `${imageTags.GPSLatitude},${imageTags.GPSLongitude}`

		// Check filename cache first
		if (filenameToLocationCache[fn] !== undefined) {
			formatted = filenameToLocationCache[fn]
		} else if (fetchedLocationCache[cacheKey] !== undefined) {
			formatted = fetchedLocationCache[cacheKey]
		}

		// console.log(cache)

		if (formatted !== undefined) {
			console.log(` - Cached (${cacheKey})`)
		} else {
			console.log(` - Not cached (${cacheKey})`)
			let closest = null
			try {
				console.log(` - Fetching nearby geo`)
				// const nearby = await geonames.findNearby({
				// 	lat: imageTags.GPSLatitude,
				// 	lng: imageTags.GPSLongitude,
				// 	fcode: 'PPL',
				// })
				// http://api.geonames.org/findNearbyPlaceName?
				// 		lat=32.5897138888889
				// 		lng=-116.46695
				// 		username=shawnphoffman
				// 		fcode=PPL
				// 		cities=cities1000
				// 		style=long
				const nearby = await geonames.findNearbyPlaceName({
					lat: imageTags.GPSLatitude,
					lng: imageTags.GPSLongitude,
					fcode: 'PPL',
					cities: 'cities1000',
					style: 'long',
				})
				// console.log(`\n++++ FIND NEARBY GEO ++++`)
				closest = nearby.geonames[0]
				Object.keys(closest)
					.sort(function (a, b) {
						return a.toLowerCase().localeCompare(b.toLowerCase())
					})
					.forEach(key => {
						if (LogGeoKeys.includes(key)) {
							console.log(` - ${key}: ${closest[key]}`)
						}
					})
				// console.log({
				// 	adminCode1: closest.adminCode1,
				// 	city: closest.city,
				// 	countryName: closest.countryName,
				// 	fclName: closest.fclName,
				// })
			} catch (err) {
				console.error(chalk.redBright.bold(err))
			}

			// console.log(`\n++++ FORMATTED LOCATION ++++`)
			const state = closest?.adminCode1
			const city = closest?.name
			formatted = `${city}, ${state}`

			if (state && city) {
				fetchedLocationCache[cacheKey] = formatted
				saveFetchedLocationCache(fetchedLocationCache)
			}
		}

		console.log(` - Formatted: ${formatted}`)
		if (formatted !== '') {
			console.log(` - Saving prevFormatted: ${formatted}`)
			prevFormatted = formatted
		} else {
			formatted = prevFormatted
			console.log(chalk.cyanBright(` - Using prevFormatted: ${formatted}`))
		}

		// Write XMP Tags
		// https://www.npmjs.com/package/exiftool-vendored
		// console.log(`\n++++ WRITING NEW IMAGE TAGS ++++`)
		console.log(` - Writing exif data - ${formatted}`)
		await exiftool.write(
			outPath,
			{
				XPComment: formatted,
				Location: formatted,
			},
			['-overwrite_original']
		)

		filenameToLocationCache[fn] = formatted
		saveFilenameToLocationCache(filenameToLocationCache)
		console.log(chalk.greenBright.bold(` - Success!`))
	} catch (err) {
		console.error(chalk.redBright.bold(err))
		throw err
	}
}

const main = async () => {
	try {
		console.log(`====================`)
		console.log(`===== STARTING =====`)
		console.log(`====================`)

		console.log(`Loading caches\n`)
		fetchedLocationCache = await loadFetchedLocationCache()
		noMetadataCache = await loadNoMetadataCache()
		filenameToLocationCache = await loadFilenameToLocationCache()

		const files = (await fs.readdir(inDir)).filter(f => {
			return f.indexOf('.HEIC') > -1 || f.indexOf('.mov') > -1
		})
		// const files = (await fs.readdir(inDir)).filter(f => f.indexOf('.mov') > -1)
		// const files = await fs.readdir(inDir)

		// for (const file of files.slice(350, 450)) {
		for (const file of files) {
			// if (file.includes('desert-0646.jpeg') || file.includes('desert-0647.jpeg')) {
			await processFile(file)
			console.log('')
			// }
		}

		console.log(`Persisting caches`)
		saveFetchedLocationCache(fetchedLocationCache)
		saveNoMetadataCache(noMetadataCache)
		saveFilenameToLocationCache(filenameToLocationCache)
	} catch (err) {
		console.error(chalk.redBright.bold(err))
		throw err
	} finally {
		exiftool.end()
	}
}

main()

// CACHE
async function saveFetchedLocationCache(cache) {
	const data = JSON.stringify(cache, Object.keys(cache).sort(), 2)
	await fs.writeFile(cachePath, data)
}
async function loadFetchedLocationCache() {
	try {
		const data = await fs.readFile(cachePath, 'utf8')
		return JSON.parse(data)
	} catch (error) {
		return {}
	}
}
// NoLocation Cache
async function loadNoMetadataCache() {
	try {
		const data = await fs.readFile(noLocationPath, 'utf8')
		return new Set(JSON.parse(data))
	} catch (error) {
		return []
	}
}
async function saveNoMetadataCache(noLocation) {
	const data = JSON.stringify(Array.from(noLocation).sort(), null, 2)
	await fs.writeFile(noLocationPath, data)
}
// File Cache
async function loadFilenameToLocationCache() {
	try {
		const data = await fs.readFile(fileCachePath, 'utf8')
		return JSON.parse(data)
	} catch (error) {
		return []
	}
}
async function saveFilenameToLocationCache(cache) {
	const data = JSON.stringify(cache, Object.keys(cache).sort(), 2)
	await fs.writeFile(fileCachePath, data)
}
