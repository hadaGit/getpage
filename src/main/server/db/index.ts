import { AsyncDatabase } from 'promised-sqlite3'
import path from 'path'
import { RunResult } from 'sqlite3'
import fs from 'fs'

let db: AsyncDatabase

export async function init() {
  // 初始化数据库
  // 这里假设数据库文件在项目的根目录
  const dbDir = path.join('./', 'dbDir')
  const dbFile = path.join(dbDir, 'db.sqlite')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir)
  }
  console.log('init db', dbDir)
  db = await AsyncDatabase.open(dbFile)
}

export function get<T>(sql: string, params: string[] = []) {
  return db.get<T>(sql, params)
}

export function all<T>(sql: string, params: string[] = []) {
  return db.all<T>(sql, params)
}

export function run(sql: string, params: string[] = []): Promise<RunResult> {
  return db.run(sql, params)
}

export function close() {
  return db.close()
}
