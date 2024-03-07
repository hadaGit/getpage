import fs from 'fs'
import path from 'path'
import logger from './logger'
import Plug from './plugload/Plug';


const plugsPath = path.resolve('./', 'plugs')
if(!fs.existsSync(plugsPath)){
    fs.mkdirSync(plugsPath);
}

export function loadAllPlugs() {
  const plugsDir = fs.readdirSync(plugsPath)
  logger.log('扫描插件')
  plugsDir.forEach((plugDir) => {
    logger.log(plugsPath, plugDir)
    try {
        new Plug(path.join(plugsPath, plugDir),plugDir);
    } catch (_e) {
        logger.log(`加载插件${plugDir}错误`,_e)
    }
  })
}

export function setEnable(name: string,status: boolean){
    const plug = Plug.getPlugByName(name);
    return plug.setEnable(status);
}

export function getPlugs(){
    return Plug.allPlug.map(item=>{
        const plugInfo = {...item};
        for (const key in plugInfo) {
            key.startsWith('_') && delete plugInfo[key]
        }
        return plugInfo;
    });
}


export function getPlugsByEnable(){

    return Plug.allPlug.filter(item=>item.enable).map(item=>{
        return {name: item.name,plugModule: item._module};
    })
}
