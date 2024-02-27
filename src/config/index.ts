import '@/library/iconfont';

import type { DefaultOptions } from '@/types';

// 默认配置选项, 实例化时会与用户传进来的合并
export const defaultOptions: DefaultOptions = {
  fixed: true,
  sayHello: true,
  transitionTime: 1000,
  parentElement: document.body,
  models: [],
  tips: {
    style: {
      width: 230,
      height: 100,
      offsetX: 0,
      offsetY: 0
    },
    idleTips: {
      message: [],
      duration: 3000,
      interval: 8000,
      priority: 2
    },
    welcomeTips: {
      message: {
        daybreak: '早上好！一日之计在于晨，美好的一天就要开始了。',
        morning: '上午好！工作顺利嘛，不要久坐，多起来走动走动哦！',
        noon: '中午了，工作了一个上午，现在是午餐时间！',
        afternoon: '午后很容易犯困呢，来杯咖啡吧~',
        dusk: '傍晚了！工作一天幸苦啦~',
        night: '晚上好，今天过得怎么样呢？',
        lateNight: '已经这么晚了呀，早点休息吧，晚安~',
        weeHours: '这么晚还不睡吗？当心熬夜秃头哦！'
      },
      duration: 6000,
      priority: 3
    }
  }
};

//  全局配置
export const config = {
  stageId: 'oml2dStage',
  canvasId: 'oml2dCanvas',
  statusBarId: 'oml2dStatusBar',
  tipsId: 'oml2dTips',
  menusId: 'oml2dMenus'
};

// 菜单的配置
export const menusConfig = [
  {
    id: 'SwitchModel',
    name: 'icon-a-userswitch-fill',
    title: '切换模型'
  },
  {
    id: 'Play',
    name: 'icon-skin-fill',
    title: '变装'
  },
  {
    id: 'About',
    name: 'icon-info-circle-fill',
    title: '关于'
  }
];
