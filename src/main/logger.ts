import fs from 'fs'
import { Console } from 'node:console'

const output = fs.createWriteStream('./stdout.log')
const errorOutput = fs.createWriteStream('./stderr.log')
// 自定义日志对象
const logger = new Console({ stdout: output, stderr: errorOutput })

export default logger
