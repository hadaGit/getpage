<script setup lang="ts">
import { ref } from 'vue'

const tableData = ref([
 /*  {
    time: '2016-05-03',
    title: 'Tom',
    link: 'Tom',
    body: 'No. 189, Grove St, Los Angeles'
  } */
])

function openFile(url: string) {
  window.electron.ipcRenderer.invoke('openFile', url)
}

async function getData() {
  

  setTimeout(async () => {
    const res = await fetch('http://local.asdcaslkdjfsndfjasdnfjkasnflksadkslfd.cn/tbody/list')
    const data = await res.json()
    tableData.value = data
    getData()
  }, 1000)
}

const plugs = ref()
plugs.value = [];

function getPlugs(){
  window.electron.ipcRenderer.invoke('getPlugs').then(res=>{
    console.log(res);
    plugs.value = res;
  })
}

const activeName = ref('first');

function tabChange(e){
  console.log(e);
  if(e === 'plug'){
    getPlugs();
  }
  
}

function plugEnableChange(e,plug){
  console.log(e,plug);
  window.electron.ipcRenderer.invoke('setEnablePlug',plug.name,e).then(res=>{
    console.log(res);
    getPlugs();
  })
}

async function init() {
  //自动设置代理
  // await setProxy()
  // await installCA()

  getData()
}
init()
</script>

<template>
  <div>
    <ElTabs v-model="activeName"  class="demo-tabs" @tab-change="tabChange">
      <el-tab-pane label="抓取数据" name="first">
        <el-table :data="tableData" style="width: 100%">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="title" label="标题" width="180" />
          <el-table-column show-overflow-tooltip prop="link" label="链接" width="180" />
          <el-table-column prop="fileName" label="文件名" />
          <el-table-column fixed="right" label="操作" width="120">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="openFile(`${scope.row.fileName}`)">打开</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="插件" name="plug">
        <el-card style="max-width: 480px" class="plug" v-for="plug in plugs" :key="plug.name">
          <template #header>
            <div class="card-header">
              <span>{{ plug.name }}</span>
              <el-switch v-model="plug.enable" @change="plugEnableChange($event,plug)"></el-switch>
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
            <div class="info-item err">
              <div class="item-name">提示:</div>
              <div class="item-value">{{ plug.loadErrorMsg }}</div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
      
    </ElTabs>
    
  </div>
</template>

<style lang="less" scoped>
.plug{
  line-height: 1;
  .card-header{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .plug-info{
    display: flex;
    flex-direction: column;
    .info-item{
      display: flex;
      padding: 10px 0;
      .item-name{
        margin-right: 10px;
      }
    }
    .err{
      color: rgb(255, 0, 0);
    }
  }
}
</style>