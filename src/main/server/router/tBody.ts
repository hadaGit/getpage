import Router from 'koa-router'
import { addPageToDb, getAllPage } from '../db/t_body/bodyDb'
import plugHandle from './plugHandle'

// **配置路由前缀**
const router = new Router({
  prefix: '/tbody'
})

router.get('/list', async (ctx) => {
  const pages = await getAllPage()
  ctx.body = pages
})

router.get('/id/:id', (ctx) => {
  ctx.body = `用户id：${ctx.params.id}`
})

function removeScriptTags(html: string) {
  const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
  return html.replace(regex, '')
}

router.post('/save', async (ctx) => {
  const { title, body, link } = ctx.request.body as { title: string; body: string; link: string }
  const bodyA = removeScriptTags(body)
  await addPageToDb({ title, body: bodyA, link })
  plugHandle({title,body: bodyA,link});
  ctx.body = { code: 'ok' }
})
console.log('加载路由：tbody')

export default router
