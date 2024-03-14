import Router from 'koa-router';
import { addPageToDb } from '../db/t_body/bodyDb';
import plugHandle from './plugHandle';
import { Notification } from 'electron';

import { getMainWin } from '../../globleWin';
import { getRegStatus } from '../../reg';

// **配置路由前缀**
const router = new Router({
  prefix: '/tbody'
});

// router.get('/list', async (ctx) => {
//   const pages = await getAllPage()
//   ctx.body = pages
// })

// router.get('/id/:id', (ctx) => {
//   ctx.body = `用户id：${ctx.params.id}`
// })

function removeScriptTags(html: string) {
  const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  return html.replace(regex, '');
}

router.post('/save', async (ctx) => {
  try {
    await getRegStatus();
  } catch (error) {
    ctx.body = { code: 6001,msg: '未注册,或已到期' };
    return;
  }
  const { title, body, link } = ctx.request.body as { title: string; body: string; link: string };
  const bodyA = removeScriptTags(body);
  await addPageToDb({ title, body: bodyA, link });
  plugHandle({ title, body: bodyA, link });

  const isAllowed = Notification.isSupported();
  if (isAllowed) {
    const options = {
      title: '抓取通知',
      body: `页面 ${title},抓取完成，点击打开到文件夹`,
      silent: true, // 系统默认的通知声音
      icon: '' // 通知图标
    };
    const notification = new Notification(options);
    notification.on('click', () => {
      const win = getMainWin();
      win.show();
      if (win.isMinimized()) {
        win.restore();
      }
    });
    notification.on('show', () => {});
    notification.on('close', () => {});
    notification.show();
  }

  ctx.body = { code: 0 };
});
console.log('加载路由：tbody');

export default router;
