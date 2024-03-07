import { ipcMain, shell } from 'electron'
import path from 'path'
import { getPlugs, setEnable } from './plugsLoad'



ipcMain.handle('openFile', (_e, fileName: string) => {
  const filePath = path.resolve('./', 'pageFiles', fileName)
  return shell.openExternal(filePath)
})


ipcMain.handle('getPlugs', () => {
  return getPlugs()
})


ipcMain.handle('setEnablePlug', (_e, name: string,status : boolean) => {
  return setEnable(name, status)
})


