<template>
  <el-dialog v-model="dialogVisible" title="插件配置" width="500">
    <el-form
      :label-position="labelPosition"
      label-width="auto"
      v-model="config"
      style="max-width: 600px"
    >
      <el-form-item :label="configKV.desc" v-for="configKV in plug.packageJson.configKeyValue">
        <el-input v-model="config[configKV.k]" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirm"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, toRaw } from 'vue';
import type { FormProps } from 'element-plus';

const labelPosition = ref<FormProps['labelPosition']>('right');

const dialogVisible = ref(false);
const config = ref({});
const plug = ref();

async function confirm() {
  const tc = toRaw(config.value);
  const name = plug.value.name;
  await window.electron.ipcRenderer.invoke('setConfig', name, tc);
  dialogVisible.value = false;
}

defineExpose({
  open: (plug1) => {
    config.value = plug1.config || {};
    plug.value = plug1;
    dialogVisible.value = true;
  }
});
</script>
