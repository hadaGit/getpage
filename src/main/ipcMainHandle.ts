import { ipcMain, shell } from 'electron';
import path from 'path';
import { getPlugs, setConfig, setEnable } from './plugsLoad';
import { getAllPage } from './server/db/t_body/bodyDb';
import { PlugConfig } from './plugload/Plug';
import { createTokenReg, getMachineCode, getRegStatus, verifyToken } from './reg';

ipcMain.handle('openFile', (_e, fileName: string, type: number) => {
  const filePath = path.resolve('./', 'pageFiles', fileName);
  if (type === 1) {
    shell.openExternal(filePath);
  } else {
    shell.showItemInFolder(filePath);
  }
  return true;
});

ipcMain.handle('getPlugs', () => {
  return getPlugs();
});

ipcMain.handle('setEnablePlug', (_e, name: string, status: boolean) => {
  return setEnable(name, status);
});

ipcMain.handle('setConfig', (_e, name: string, config: PlugConfig) => {
  return setConfig(name, config);
});

ipcMain.handle('getPageList', async () => {
  const pages = await getAllPage();
  return pages;
});

ipcMain.handle('getMachineCode', async () => {
  return await getMachineCode();
});

ipcMain.handle('createTokenReg', async (_e, machineCode: string, timeLong: number) => {
  return await createTokenReg(machineCode, timeLong);
});

ipcMain.handle('verifyToken', async (_e, regCode: string) => {
  return await verifyToken(regCode);
});

ipcMain.handle('getRegStatus', async () => {
  return getRegStatus();
});
