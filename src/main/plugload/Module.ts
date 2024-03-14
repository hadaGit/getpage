import path from 'path';
import fs from 'fs';
import vm from 'vm';
import Plug from './Plug';

const isCoreModule = (moduleName) => {
  return require('module').builtinModules.includes(moduleName);
};

export default class Module {
  id: string;
  plugName: string;
  loaded: boolean = false;
  exports = {};

  constructor(plugName: string, id: string) {
    this.plugName = plugName;
    this.id = id;
    Module._cache[this.plugName] = {};
  }

  static _cache = {};

  static _extensions = {
    '.js': function (module: Module, fileName: string) {
      const content = fs.readFileSync(fileName, 'utf8');
      const jsContent = `
            const orequire = require;
            require = (op)=>{
              return orequire(op,'${module.plugName}')
            }
            ${content};
            `;
      module._compile(jsContent, fileName);
    },
    '.json': function (module: Module, fileName: string) {
      const content = fs.readFileSync(fileName, 'utf8');
      module.exports = JSON.parse(content);
    }
  };

  static wrapper = [
    '(function (exports, require, module, __filename, __dirname, console, __plug) { ',
    '\n});'
  ];

  static wrap(script) {
    return Module.wrapper[0] + script + Module.wrapper[1];
  }

  static _resolveFilename(request) {
    const filename = path.resolve(request); // 获取传入参数对应的绝对路径
    const extname = path.extname(request); // 获取文件后缀名

    // 如果没有文件后缀名，尝试添加.js和.json
    if (!extname) {
      const exts = Object.keys(Module._extensions);
      for (let i = 0; i < exts.length; i++) {
        const currentPath = `${filename}${exts[i]}`;

        // 如果拼接后的文件存在，返回拼接的路径
        if (fs.existsSync(currentPath)) {
          return currentPath;
        }
      }
      //如果不存在当做目录查找 package.json
      //先查找 package.json  如果存在 查看main 入口字段指定是否存在
      const packagePath = path.resolve(request, 'package.json');
      const existsPackage = fs.existsSync(packagePath);
      if (existsPackage) {
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);
        if (packageJson.main) {
          const mianPath = path.resolve(request, packageJson.main);
          const existsMain = fs.existsSync(mianPath);
          if (existsMain) {
            return mianPath;
          }
        }
      }
      const indexJsPath = path.resolve(request, 'index.js');
      const indexExists = fs.existsSync(indexJsPath);
      if (indexExists) {
        return indexJsPath;
      }
    }

    return filename;
  }

  static _load(request: string, plugName: string) {
    //包加载逻辑
    /**
         *  1.优先加载内置模块，即使有同名文件，也会优先使用内置模块。
            2.不是内置模块，先去缓存找。
            3.缓存没有就去找对应路径的文件。
            4.不存在对应的文件，就将这个路径作为文件夹加载。
            5.对应的文件和文件夹都找不到就去node_modules下面找。
            还找不到就报错了。
        */
    //内置模块 直接走系统提供的加载

    if (isCoreModule(request)) {
      return require(request);
    }

    if (!path.isAbsolute(request)) {
      request = request.replace(/\\/g, '/');
      const plug = Plug.getPlugByName(plugName);
      if (!(request.startsWith('/') || request.startsWith('./') || request.startsWith('../'))) {
        console.log(plug.baseDir);
        request = path.join(plug.baseDir, 'node_modules', request);
      } else {
        request = path.join(plug.baseDir, request);
      }
    }
    const filename = Module._resolveFilename(request);

    console.log('插件:', plugName, '加载模块:', request, filename);

    // 先检查缓存，如果缓存存在且已经加载，直接返回缓存
    const cachedModule = Plug.getPlugByName(plugName)._modulesCache[filename];
    if (cachedModule !== undefined) {
      console.log('插件:', plugName, '加载模块:', request, '缓存存在');
      return cachedModule.exports;
    }

    // 如果缓存不存在，我们就加载这个模块
    // 加载前先new一个MyModule实例，然后调用实例方法load来加载
    // 加载完成直接返回module.exports
    const module = new Module(plugName, filename);

    // load之前就将这个模块缓存下来，这样如果有循环引用就会拿到这个缓存，但是这个缓存里面的exports可能还没有或者不完整
    Plug.getPlugByName(plugName)._modulesCache[filename] = module;

    module.load(filename);

    return module.exports;
  }

  require(id: string, basePath: string) {
    return Module._load(id, basePath);
  }

  load(fileName: string) {
    // 获取文件后缀名
    const extname = path.extname(fileName);

    // 调用后缀名对应的处理函数来处理
    Module._extensions[extname](this, fileName);

    this.loaded = true;
  }

  _compile(content: string, filename) {
    const wrapper = Module.wrap(content); // 获取包装后函数体

    // vm是nodejs的虚拟机模块，runInThisContext方法可以接受一个字符串并将它转化为一个函数
    // 返回值就是转化后的函数，所以compiledWrapper是一个函数

    const compiledWrapper = vm.runInThisContext(wrapper, {
      filename,
      lineOffset: 0,
      displayErrors: true
    });

    // 准备exports, require, module, __filename, __dirname这几个参数
    // exports可以直接用module.exports，即this.exports
    // require官方源码中还包装了一层，其实我们这里可以直接使用this.require
    // module不用说，就是this了
    // __filename直接用传进来的filename参数了
    // __dirname需要通过filename获取下
    const dirname = path.dirname(filename);

    compiledWrapper.call(
      this.exports,
      this.exports,
      this.require,
      this,
      filename,
      dirname,
      Plug.getPlugByName(this.plugName).logger,
      Plug.getPlugByName(this.plugName)
    );
  }

  start() {
    return this.require(
      path.join(Plug.getPlugByName(this.plugName).baseDir, this.id),
      this.plugName
    );
  }
}
