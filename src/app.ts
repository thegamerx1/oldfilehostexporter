import sqlite3 from "sqlite3"
import { open } from "sqlite"
import type { Database } from "sqlite"
import { writeFile, copyFile, lstat } from "fs/promises"
import { existsSync, mkdirSync } from "fs"
import cliProgress from "cli-progress"
import { validate } from "./fileModel"
import config from "../config.json"

async function starto() {
	const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
	const db = await open({
		filename: "./data/database.db",
		driver: sqlite3.Database,
		mode: sqlite3.OPEN_READONLY,
	})

	let files = await db.all("select * from file")
	bar1.start(files.length, 0)
	for (const res of files) {
		let file = await parseFile(res, db, "./data/files/")
		if (file) {
			await writeFile(`./output/jsons/${file.id}.json`, JSON.stringify(file, null, 2))
			let stat = await lstat(`./data/files/${file.name}`)
			if (!existsSync(`./output/files/${file.id}`) || stat.size < 0) {
				await copyFile(`./data/files/${file.name}`, `./output/files/${file.name}`)
			}
			bar1.increment()
		} else {
			bar1.setTotal(bar1.getTotal() - 1)
		}
		bar1.render()
	}
	console.log("\nComplete")
	process.exit(0)
}
if (!existsSync("output")) {
	mkdirSync("./output")
	mkdirSync("./output/files")
	mkdirSync("./output/jsons")
}
starto()

async function parseFile(
	file: {
		id: number
		name: string
		original: string
		time: number
		deleteKey: string
		ip: string
		destruct: number | null
		deleted: number
		hash: string
		language: string | null
		mime: string
	},
	db: Database,
	path: string
) {
	if (!existsSync(path + file.name)) {
		return null
	}

	let views = await db.all("select * from views where fileId = ?", file.id)
	let outviews: Array<{
		ip: string
		time: string
		userAgent: string
	}> = views.map(view => {
		return {
			ip: "0.0.0.0",
			time: new Date(view.time + config.EPOCH).toISOString(),
			userAgent: "import",
		}
	})

	try {
		let output = validate({
			name: file.name,
			id: file.name.split(".").shift(),
			mime: file.mime,
			time: new Date(file.time + config.EPOCH).toISOString(),
			selfDestruct: !!file.destruct,
			destruct: !!file.destruct ? new Date(file.destruct + config.EPOCH).toISOString() : null,
			ip: file.ip,
			original: file.original,
			views: outviews,
		})
		return output
	} catch (e) {
		console.error(e)
		return null
	}
}
// db.close()
