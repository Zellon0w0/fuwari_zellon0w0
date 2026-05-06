/* This is a script to create a new thought markdown file with front-matter */

import fs from "fs"
import path from "path"

function pad(value) {
  return String(value).padStart(2, "0")
}

function getLocalDateTime(date = new Date()) {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? "+" : "-"
  const offsetHour = pad(Math.floor(Math.abs(offset) / 60))
  const offsetMinute = pad(Math.abs(offset) % 60)

  return `${year}-${month}-${day}T${hour}:${minute}:00${sign}${offsetHour}:${offsetMinute}`
}

function getSlugDate(date = new Date()) {
  const year = String(date.getFullYear()).slice(-2)
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())

  return `${year}${month}${day}-${hour}${minute}`
}

const args = process.argv.slice(2)
const initialContent = args.join(" ").trim()
const slug = `${getSlugDate()}.md`
const targetDir = "./src/content/thoughts/"
const fullPath = path.join(targetDir, slug)

if (fs.existsSync(fullPath)) {
  console.error(`Error: File ${fullPath} already exists`)
  process.exit(1)
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

const content = `---
title: ''
published: ${getLocalDateTime()}
tags: []
mood: ''
location: ''
draft: false
---

${initialContent}
`

fs.writeFileSync(fullPath, content)

console.log(`Thought ${fullPath} created`)
