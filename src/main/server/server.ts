import Koa from 'koa'
import * as db from './db'
import { initTbodySql } from './db/t_body/bodyDb'
import router from './router'
import bodyParser from 'koa-bodyparser'
import cors from 'koa2-cors'
import { getPort } from './portUtils'

let port = 0

export default async function ():Promise<number> {
  port = await getPort();
  return new Promise((resolve) =>{
    const app = new Koa()
    app.use(cors())
    app.use(bodyParser())

    router(app)
    // app.use(serve(path.join(__dirname, 'public')))

    app.listen(port, async () => {
      console.log('Server is running at http://localhost:' + port)

      await db.init()
      await initTbodySql()
      resolve(port);
    })
  })
  

}

export function getServerPort(){
  return port;
}
