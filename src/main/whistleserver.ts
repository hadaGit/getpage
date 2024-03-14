import whistle from 'whistle';
import installca from 'whistle/bin/ca/cli';
import { enableProxy, stopProxy } from './proxy';

let port;
export default async function startWhistle() {
  port = process.argv[3];
  const w2 = whistle({
    port,
    username: 'admin',
    password: 'admin123',
    mode: 'capture',
    rules: [
      '/https?://.*/ jsAppend://{jscode} includeFilter://resH:Content-Type=/text/html.*/',
      'local.asdcaslkdjfsndfjasdnfjkasnflksadkslfd.cn http://127.0.0.1:' + process.argv[2]
    ],
    values: {
      jscode: `(function () {
                let btnHtml = \`<div id="gather-html"
                      style="position: fixed;
                          bottom: 20px; /* 调整按钮距离低部的距离 */
                          right: 20px; /* 调整按钮距离右侧的距离 */
                          z-index: 1000; /* 确保按钮在最顶层显示 */
                          background-color: #07c160; /* 按钮背景颜色 */
                          color: #fff; /* 按钮文字颜色 */
                          padding: 5px 10px; /* 按钮内边距 */
                          border: none; /* 移除按钮边框 */
                          border-radius: 5px; /* 按钮圆角 */
                          cursor: pointer; /* 鼠标悬停样式 */
                          font-size: 18px;
                          ">
                          采集
                      </div>\`;
                document.body.insertAdjacentHTML("beforeend", btnHtml);
              
                // 绑定点击事件
                document.getElementById("gather-html").addEventListener("click", function () {
                  var cloneBody = document.body.cloneNode(true);
                  var ghtml = cloneBody.querySelector('#gather-html');
                  ghtml.previousSibling.remove();
                  ghtml.remove();
                  let htmlContent = cloneBody.outerHTML;
                  console.log(htmlContent);
                  let params = {
                    title: document.title,
                    body: htmlContent,
                    link: window.location.href,
                  };
              
                  let url = "https://local.asdcaslkdjfsndfjasdnfjkasnflksadkslfd.cn/tBody/save";
              
                  fetch(url, {
                    method: "POST",
                    headers: {
                      'Content-Type': 'application/json', // 设置请求头，告诉服务器正文使用JSON格式
                    },
                    body: JSON.stringify(params), // 将JavaScript对象转换为JSON字符串
                  })
                    .then((response) => response.json())
                    .then((data) => {
                      if(data.code === 0){
                        alert('采集完成，请返回软件查看')
                        return;
                      }
                      alert(data.msg);
                      console.log("POST request succeeded with JSON response:", data);
                    })
                    .catch((error) => {
                      console.error("Error:", error);
                    });
                });
              })();
              `
    }
  });

  console.log(w2.getWhistlePath(), 'w2 服务启动成功：' + port);
}

function installCA() {
  installca([port]);
}

startWhistle();

process.parentPort.on('message', (e) => {
  console.log(`Message from parent: ${e.data.message}`);
  if (e.data.message === 'close') {
    stopProxy();
  } else if (e.data.message === 'ca') {
    installCA();
  } else if (e.data.message === 'proxy') {
    enableProxy({
      host: '127.0.0.1',
      port
    });
  }
});
