import path from 'path'
import Module from './Module'
import fs from 'fs'
import { Console } from 'node:console'

class PackageInfo{
  name?: string
  version?: string
  description?: string
  main?: string
  author?: string
  license?: string
  
}

export default class Plug {
  baseDir: string
  name: string
  _logger: Console
  _module: {articleHandle?: (article)=>void} = {}
  enable: boolean = true
  enableFilePath: string
  packageJson: PackageInfo = {}
  loadErrorMsg: string = ''
  _modulesCache = {} 
  constructor(baseDir: string,name: string) {
    this.baseDir = baseDir;
    this.name = name;

    const output = fs.createWriteStream(path.join(this.baseDir,'out.log'))
    const errorOutput = fs.createWriteStream(path.join(this.baseDir,'err.log'))
    // 自定义日志对象
    this._logger = new Console({ stdout: output, stderr: errorOutput })

    //创建enable 文件
    this.enableFilePath = path.join(this.baseDir,'enable');
    const enableExists = fs.existsSync(this.enableFilePath);
    if (enableExists) {
      this.enable = fs.readFileSync(this.enableFilePath,"utf8") === '1';
    }

    //加载package 指定的main 入口js 文件
    Plug.allPlug.push(this);

    this.loadMain()
 
  }


  static allPlug: Plug[] = [];

  static getPlugByName(name: string): Plug{
    const plug = this.allPlug.find(item=>item.name === name);
    if(!plug){
      throw new Error(`插件不存在：${name}`);
    }
    return plug;
  }

  setEnable(status: boolean){
    if(status){
      if(!this.loadMain()){
        return false;
      }
    }
    this.enable = status;
    fs.writeFileSync(this.enableFilePath,this.enable?'1':'0')
    return this.enable;
  }

  loadMain() {
    this._modulesCache = {};
    this.loadErrorMsg = '';
    //读取插件 package.json 获取插件信息
    this.packageJson = require(path.join(this.baseDir, 'package.json'))

    //加载插件入口
    const mianJs = this.packageJson.main ?? 'index.js'
    const moduleMain = new Module(this.name, mianJs)
    this._module = moduleMain.start();
    if(!this._module['articleHandle']){
      this.loadErrorMsg = '插件未导出 articleHandle 方法'
      this.setEnable(false);
      return false;
    }
    return true;
  }

}
