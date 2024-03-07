import { execSync as _execSync, exec as _exec } from 'child_process'
import refreshFile from '../../../resources/refresh.exe?asset&asarUnpack'

const execSync = _execSync
const exec = _exec
const REFRESH_PROXY = JSON.stringify(refreshFile)

console.log(REFRESH_PROXY, 'REFRESH_PROXY')
const REG_PATH =
  'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v'
const SETTINGS_PATH =
  '"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections"'
const PORT_RE = /:\d{1,5}$/

function getRawSettings(stdout) {
  if (stdout && typeof stdout === 'string') {
    const lines = stdout.trim().split(/[\r\n]+/)
    for (let i = 0, len = lines.length; i < len; i++) {
      const line = lines[i].trim().split(/\s+/)
      if (line[0] === 'DefaultConnectionSettings') {
        return (line[2] || '').substring(16)
      }
    }
  }
  return ''
}

function sliceBuf(buf, start, end) {
  return buf.subarray ? buf.subarray(start, end) : buf.slice(start, end)
}

function getServer(callback) {
  const script = `REG QUERY ${SETTINGS_PATH}`
  exec(script, function (_, stdout) {
    const raw = getRawSettings(stdout)
    if (!raw) {
      return callback('Error')
    }
    const bytes = []
    const result = {}
    for (let i = 0, len = raw.length; i < len; i += 2) {
      bytes.push(parseInt(raw.substring(i, i + 2), 16))
    }
    const buffer = Buffer.from(bytes)
    const svrLen = buffer[4]
    if (!svrLen) {
      return callback(null, result)
    }
    result.enabled = buffer[0] === 3
    const server = sliceBuf(buffer, 8, svrLen + 8).toString()
    if (PORT_RE.test(server)) {
      const index = server.lastIndexOf(':')
      result.host = server.substring(0, index)
      result.port = server.substring(index + 1)
    }
    callback(null, result)
  })
}

export function getServerProxy(callback) {
  return getServer(function (err, server) {
    if (err) {
      return callback(err)
    }
    return callback(null, { http: server, https: server })
  })
}

function disableProxy() {
  const proxyCmd = REG_PATH + ' ProxyEnable /t REG_DWORD /d 0 /f'
  const pacCmd = REG_PATH + ' AutoConfigURL /t REG_DWORD /d 0 /f'
  const detectCmd = REG_PATH + ' AutoDetect /t REG_DWORD /d 0 /f'
  execSync(proxyCmd + ' & ' + pacCmd + ' & ' + detectCmd)
  execSync(REFRESH_PROXY)
  return true
}

export function enableProxy(options) {
  disableProxy()
  let bypass = options.bypass
  const setCmd = REG_PATH + ' ProxyServer /t REG_SZ /d ' + options.host + ':' + options.port + ' /f'
  const enableCmd = REG_PATH + ' ProxyEnable /t REG_DWORD /d 1 /f'
  let cmd = setCmd + ' & ' + enableCmd

  if (bypass) {
    bypass = REG_PATH + ' ProxyOverride /t REG_SZ /d "' + bypass.join(';') + '" /f'
    cmd = cmd + ' & ' + bypass
  }
  execSync(cmd)
  execSync(REFRESH_PROXY)
  return true
}

const _disableProxy = disableProxy
export { _disableProxy as disableProxy }
