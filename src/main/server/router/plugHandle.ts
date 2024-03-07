import { getPlugsByEnable } from '../../plugsLoad'

export default function(article){
    return new Promise<void>((resolve, reject) => {
        try{
            const plugs = getPlugsByEnable();
            for (let index = 0; index < plugs.length; index++) {
                const plug = plugs[index];
                if(plug.plugModule.articleHandle){
                    plug.plugModule.articleHandle(article)
                }
            }
            resolve();
        }catch(_e){
            reject(_e)
        }
        
    })
    
}