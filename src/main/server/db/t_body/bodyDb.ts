import path from 'path';
import fs from 'fs';
import { all, run } from '../index';
import { RunResult } from 'sqlite3';
import { randomUUID } from 'node:crypto';
import { app } from 'electron';

const pageFilesPath = path.join(app.getPath('userData'), 'pageFiles');
if (!fs.existsSync(pageFilesPath)) {
  fs.mkdirSync(pageFilesPath);
}

export function initTbodySql(): Promise<RunResult> {
  //创建一张sql表
  return run(`CREATE TABLE IF NOT EXISTS t_body
                (
                    id    INTEGER PRIMARY KEY AUTOINCREMENT, -- 主键自增ID
                    title TEXT,                              -- 标题
                    link  TEXT,                              -- 链接
                    body  TEXT,                              -- 内容
                    fileName  TEXT,                              -- 文件名
                    time  DATETIME DEFAULT CURRENT_TIMESTAMP -- 时间，默认为当前时间
                );`);
}

export async function addPageToDb(param: { title: string; body: string; link: string }) {
 
  //写入文件
  const uuid = randomUUID();
  const fileName = `${uuid}.html`;
  const write = fs.createWriteStream(path.join(pageFilesPath, fileName));
  write.write(param.body, 'utf8');
  write.close();
  await run('INSERT INTO t_body (title, body,link,fileName) VALUES (?, ?, ?, ?)', [
    param.title,
    param.body,
    param.link,
    fileName
  ]);
  return fileName;
}

export async function getAllPage() {
  const result = await all('SELECT title, time,link,fileName FROM t_body order by id desc');
  return result;
}
