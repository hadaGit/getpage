import Koa from 'koa'
import tBody from './tBody'

export default function (app: Koa) {
  app.use(tBody.routes())
  app.use(tBody.allowedMethods())
}
