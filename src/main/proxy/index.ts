import proxyset from '@resources/proxyset.exe?asset&asarUnpack';
import { exec } from 'child_process';
import { getMainWin } from '../globleWin';

export function enableProxy({ host = '127.0.0.1', port = 8123 }) {
  return new Promise((r, j) => {
    exec(`${proxyset} http=${host}:${port} https=${host}:${port}`, (error, stdout, stderr) => {
      if (error == null) {
        // console.log('自动代理设置成功')
        console.log('自动代理设置成功', stdout);
        r(true);
      } else {
        console.log(stderr);
        const mainWin = getMainWin();
        mainWin.webContents.send('proxyError', error);
        j(error);
      }
    });
  });
}

export function stopProxy() {
  return new Promise((r, j) => {
    exec(`${proxyset} stop`, (error, stdout, stderr) => {
      if (error == null) {
        // console.log('自动代理设置成功')
        console.log(stdout);
        r(true);
      } else {
        console.log('代理关闭失败', error);
        console.log(stderr);
        j(error);
      }
    });
  });
}
