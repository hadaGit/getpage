import { BrowserWindow } from 'electron';

let mainWin: BrowserWindow;

export function setMainWin(win) {
  mainWin = win;
}

export function getMainWin() {
  return mainWin;
}
