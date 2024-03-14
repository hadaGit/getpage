<script setup lang="ts">
import { ElButton, ElNotification } from 'element-plus';
import { ref, toRaw } from 'vue';
import PlugConfig from './PlugConfig.vue';

const tableData = ref([
  /*  {
    time: '2016-05-03',
    title: 'Tom',
    link: 'Tom',
    body: 'No. 189, Grove St, Los Angeles'
  } */
]);

function openFile(url: string, type: number) {
  window.electron.ipcRenderer.invoke('openFile', url, type);
}

async function getData() {
  const data = await window.electron.ipcRenderer.invoke('getPageList');
  tableData.value = data;
  setTimeout(async () => {
    getData();
  }, 1000);
}

const plugs = ref();
plugs.value = [];

function getPlugs() {
  window.electron.ipcRenderer.invoke('getPlugs').then((res) => {
    console.log(res);
    plugs.value = res;
  });
}

const activeName = ref('first');

function tabChange(e) {
  console.log(e);
  if (e === 'plug') {
    getPlugs();
  }
}

function plugEnableChange(e, plug) {
  console.log(e, plug);
  window.electron.ipcRenderer.invoke('setEnablePlug', plug.name, e).then((res) => {
    console.log(res);
    getPlugs();
  });
}

const plugConfig = ref();

function openConfigWin(plug) {
  plugConfig.value.open(toRaw(plug));
}

const isReg = ref(false);
const regForm = ref({ machineCode: '', regCode: '', regInfo: '', timeLong: 365 * 24 * 60 * 60 });
const labelPosition = ref('right');

// function regClick(){
//   window.electron.ipcRenderer.invoke('createTokenReg',regForm.value.machineCode,regForm.value.timeLong).then((res)=>{
//     console.log(res);
//     regForm.value.regCode = res;
//   })
// }

async function getRegStatus() {
  try {
    const regInfo = await window.electron.ipcRenderer.invoke('getRegStatus');
    console.log(regInfo);
    regForm.value.regInfo = regInfo;
    if (regInfo) {
      isReg.value = true;
    }
  } catch (err: any) {
    if (err.message.includes('TokenExpiredError')) {
      regForm.value.regInfo = '验证码已过期';
    }
  }
}

async function verifyToken() {
  if (!regForm.value.regCode) {
    return;
  }
  await window.electron.ipcRenderer
    .invoke('verifyToken', regForm.value.regCode)
    .then((res) => {
      console.log(res);
      init();
    })
    .catch(() => {
      regForm.value.regInfo = '注册码有误';
    });
}

window.electron.ipcRenderer.on('proxyError', (res) => {
  ElNotification({
    title: '代理错误',
    message: '代理设置失败' + res,
    type: 'error',
    duration: 0
  });
});

async function init() {
  //自动设置代理
  // await setProxy()
  // await installCA()
  await getRegStatus();
  if (isReg.value) {
    getData();
  } else {
    window.electron.ipcRenderer.invoke('getMachineCode').then((machineCode) => {
      regForm.value.machineCode = machineCode;
    });
  }
}
init();
</script>

<template>
  <div>
    <div class="main-content" v-if="isReg">
      <ElTabs v-model="activeName" class="demo-tabs" @tab-change="tabChange">
        <el-tab-pane label="抓取数据" name="first">
          <el-table :data="tableData" stripe style="width: 100%">
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="title" label="标题" width="180" />
            <el-table-column show-overflow-tooltip prop="link" label="链接" width="180" />
            <el-table-column show-overflow-tooltip prop="fileName" label="文件名" />
            <el-table-column fixed="right" label="操作" width="200">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="openFile(`${scope.row.fileName}`, 1)"
                  >打开到浏览器</el-button
                >
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="openFile(`${scope.row.fileName}`, 2)"
                  >打开到文件</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="插件" name="plug">
          <el-card style="max-width: 480px" class="plug" v-for="plug in plugs" :key="plug.name">
            <template #header>
              <div class="card-header">
                <span>{{ plug.name }}</span>
                <div>
                  <ElButton
                    class="plug-config"
                    v-if="plug.packageJson.configKeyValue"
                    @click="openConfigWin(plug)"
                    >配置</ElButton
                  >
                  <el-switch
                    v-model="plug.enable"
                    @change="plugEnableChange($event, plug)"
                  ></el-switch>
                </div>
              </div>
            </template>
            <div class="plug-info">
              <div class="info-item">
                <div class="item-name">描述:</div>
                <div class="item-value">{{ plug.packageJson.description }}</div>
              </div>
              <div class="info-item">
                <div class="item-name">版本:</div>
                <div class="item-value">{{ plug.packageJson.version }}</div>
              </div>
              <div class="info-item">
                <div class="item-name">入口:</div>
                <div class="item-value">{{ plug.packageJson.main }}</div>
              </div>
              <div class="info-item err" v-if="plug.loadErrorMsg">
                <div class="item-name">提示:</div>
                <div class="item-value">{{ plug.loadErrorMsg }}</div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>
      </ElTabs>
      <PlugConfig ref="plugConfig"></PlugConfig>
    </div>
    <div class="reg" v-else>
      <el-form
        :label-position="labelPosition"
        label-width="auto"
        v-model="regForm"
        style="width: 60%"
      >
        <el-form-item label="机器码">
          <el-input v-model="regForm.machineCode" />
        </el-form-item>
        <!-- <el-form-item label="注册时长">
            <el-select v-model="regForm.timeLong" placeholder="选择注册时长">
              <el-option label="一年" :value="365 * 24 * 60 * 60" />
              <el-option label="一个月" :value="30 * 24 * 60 * 60" />
              <el-option label="100年" :value="100 * 365 * 24 * 60 * 60" />
              <el-option label="10秒" :value="10" />
            </el-select>
          </el-form-item> -->
        <el-form-item label="注册码">
          <el-input v-model="regForm.regCode" />
        </el-form-item>

        <el-form-item label="注册信息">
          <div style="color: red">{{ regForm.regInfo }}</div>
        </el-form-item>

        <div>
          <!-- <ElButton @click="regClick">生成注册码</ElButton> -->
          <ElButton @click="verifyToken">注册</ElButton>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style lang="less" scoped>
.main-content {
  padding: 0 10px;
}

.plug {
  line-height: 1;
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .plug-config {
      margin-right: 10px;
    }
  }
  .plug-info {
    display: flex;
    flex-direction: column;
    .info-item {
      display: flex;
      padding: 10px 0;
      .item-name {
        margin-right: 10px;
      }
    }
    .err {
      color: rgb(255, 0, 0);
    }
  }
}
.reg {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
