import { Events } from './events.js';
import { GlobalStyle } from './global-style.js';
import { Menus } from './menus.js';
import { Models } from './models.js';
import { PixiApp } from './pixi.js';
import { Stage } from './stage.js';
import { StatusBar } from './status-bar.js';
import { Store } from './store.js';
import { Tips } from './tips.js';
import { DEFAULT_OPTIONS } from '../config/index.js';
import { WindowSizeType } from '../constants/index.js';
import { CommonStyleType } from '../types/common.js';
import { EventFn, LoadEventFn } from '../types/events.js';
import type { DefaultOptions } from '../types/index.js';
import { Oml2dEvents, Oml2dMethods, Oml2dProperties } from '../types/oml2d/index.js';
import type { Options } from '../types/options/index.js';
import {
  checkVersion,
  getRandomIndex,
  getWindowSizeType,
  handleCommonStyle,
  mergeOptions,
  onChangeWindowSize,
  printProjectInfo
} from '../utils/index.js';

export class OhMyLive2D implements Oml2dProperties, Oml2dMethods, Oml2dEvents {
  store: Store;
  globalStyle: GlobalStyle;
  stage: Stage;
  statusBar: StatusBar;
  tips: Tips;
  menus: Menus;
  models: Models;
  pixiApp?: PixiApp;
  private currentModelIndex: number = 0;
  currentModelClothesIndex: number = 0;
  version = __VERSION__;
  options: DefaultOptions;
  events: Events;

  constructor(options: Options) {
    this.events = new Events();
    this.options = mergeOptions(DEFAULT_OPTIONS, options);
    this.globalStyle = new GlobalStyle(this.options);
    this.stage = new Stage(this.options, this.events); // 实例化舞台
    this.statusBar = new StatusBar(this.options);
    this.tips = new Tips(this.options, this); // 提示框
    this.menus = new Menus(this.options, this); // 菜单
    this.models = new Models(this.options, this.events);
    this.store = new Store();
    this.modelIndex = this.store.getModelIndex();
    this.modelClothesIndex = this.store.getModelClothesIndex();
    this.initialize();
  }

  /**
   * 显示模型的 hit area 区域
   */
  showModelHitAreaFrames() {
    this.models.removeHitAreaFrames();
  }

  /**
   * 隐藏模型的 hit area 区域
   */
  hideModelHitAreaFrames() {
    this.models.addHitAreaFrames();
  }

  /**
   * 设置模型缩放比例
   * @param scale 缩放比例
   */
  setModelScale(scale: number) {
    this.models.setScale(scale);
  }

  stopTipsIdle() {
    this.tips.idlePlayer?.stop();
  }

  startTipsIdle() {
    this.tips.idlePlayer?.start();
  }
  statusBarPopup(content?: string | undefined, delay?: number | undefined, color?: string | undefined) {
    this.statusBar.popup(content, delay, color);
  }

  setStatusBarHoverEvent(events?: { onIn?: () => void | Promise<void>; onOut?: () => void | Promise<void> }) {
    this.statusBar.setHoverEvent(events);
  }
  tipsMessage(message: string, duration: number, priority: number) {
    this.tips.notification(message, duration, priority);
  }
  setStageStyle(style: CommonStyleType) {
    this.stage.setStyle(handleCommonStyle(style));
  }
  setModelPosition(position: { x?: number | undefined; y?: number | undefined }) {
    const { x = 0, y = 0 } = position;

    this.models.setPosition(x, y);
  }

  /**
   * 移动端是否隐藏
   */
  private get mobileHidden(): boolean {
    return !this.options.mobileDisplay && getWindowSizeType() === WindowSizeType.mobile;
  }

  private set modelIndex(index: number) {
    this.currentModelIndex = index;
    this.stage.modelIndex = index;
    this.models.modelIndex = index;
    this.store.updateModelCurrentIndex(index);
  }

  get modelIndex(): number {
    return this.currentModelIndex;
  }

  private set modelClothesIndex(index: number) {
    this.currentModelClothesIndex = index;
    this.models.modelClothesIndex = index;
    this.store.updateModelCurrentClothesIndex(index);
  }

  get modelClothesIndex(): number {
    return this.currentModelClothesIndex;
  }

  /**
   * 创建
   */
  private create(): void {
    this.store.updateModelInfo(this.options.models);

    this.stage.create();

    this.pixiApp = new PixiApp(this.stage);

    this.statusBar.create();
    this.statusBar.initializeStyle();
  }

  /**
   * 挂载
   */
  private mount(): void {
    this.stage.mount();
    this.statusBar.mount();
  }

  /**
   * 加载模型
   * tip: 仅加载模型, 并不会显示模型; 若想显示模型, 则需要再 callback 里面执行一次 stage.slideIn 方法
   */
  private async loadModel(callback: () => void): Promise<void> {
    this.tips.clear();
    await this.stage.slideOut();

    if (!this.options.models || !this.options.models.length) {
      return;
    }

    if (this.mobileHidden) {
      this.statusBar.rest();

      return;
    }

    this.statusBar.showLoading();

    return this.models
      .create()
      .catch(() => {
        this.statusBar.loadingError(() => void this.reloadModel());
      })
      .then(() => {
        this.pixiApp?.mount(this.models.model);
        this.menus.reload(this.stage.element!);
        this.tips.reload(this.stage.element!);

        this.models.settingModel();
        this.stage.reloadStyle(this.models.modelSize);
        this.pixiApp?.resize();
        this.statusBar.hideLoading();

        callback();
      });
  }

  /**
   * 重新加载
   */
  async reloadModel(): Promise<void> {
    await this.loadModel(() => {
      this.stage.slideIn();
    });
    void this.tips.idlePlayer?.start();
  }

  /**
   * 随机加载模型
   */
  async loadRandomModel(): Promise<void> {
    this.modelIndex = getRandomIndex(this.options.models.length, this.modelIndex);
    this.modelClothesIndex = 0;

    this.statusBar.open(this.options.statusBar.switchingMessage);
    await this.loadModel(() => {
      this.stage.slideIn();
    });
    void this.tips.idlePlayer?.start();
  }

  /**
   * 加载下个角色模型
   */
  async loadNextModel(): Promise<void> {
    if (++this.modelIndex >= this.options.models.length) {
      this.modelIndex = 0;
    }
    this.modelClothesIndex = 0;

    this.statusBar.open(this.options.statusBar.switchingMessage);

    await this.loadModel(() => {
      this.stage.slideIn();
    });
    void this.tips.idlePlayer?.start();
  }

  /**
   * @description 通过模型索引值加载模型
   */
  async loadModelByIndex(modelIndex: number, modelClothesIndex?: number): Promise<void> {
    if (modelIndex >= 0 && modelIndex < this.options.models.length) {
      this.modelIndex = modelIndex;
      this.modelClothesIndex = modelClothesIndex || 0;

      this.statusBar.open(this.options.statusBar.switchingMessage);

      await this.loadModel(() => {
        this.stage.slideIn();
      });
      void this.tips.idlePlayer?.start();
    }
  }

  /**
   * @description 通过模型名称加载模型
   */
  async loadModelByName(modelName: string, modelClothesIndex?: number) {
    const targetIndex = this.options.models.findIndex((item) => item.name === modelName);

    if (targetIndex > 0) {
      this.modelIndex = targetIndex;
      this.modelClothesIndex = modelClothesIndex || 0;

      this.statusBar.open(this.options.statusBar.switchingMessage);

      await this.loadModel(() => {
        this.stage.slideIn();
      });
      void this.tips.idlePlayer?.start();
    }
  }

  /**
   * 加载角色模型的下一个衣服, 即切换同个角色的不同模型
   */
  async loadNextModelClothes(): Promise<void> {
    const path = this.options.models[this.modelIndex].path;

    if (Array.isArray(this.options.models[this.modelIndex].path)) {
      if (++this.modelClothesIndex >= path.length) {
        this.modelClothesIndex = 0;
      }

      await this.loadModel(() => {
        this.stage.slideIn();
      });
    }
  }

  // 初始化
  private initialize(): void {
    // 检查版本
    void checkVersion();

    // 打印信息
    if (this.options.sayHello) {
      printProjectInfo();
    }

    this.registerGlobalEvent();

    this.globalStyle.initialize();

    //  创建舞台和状态条
    this.create();

    //  挂载舞台和状态条
    this.mount();

    // 加载模型
    void this.loadModel(() => {
      if (this.options.initialStatus == 'sleep') {
        this.tips.clear();
        this.statusBar.open(this.options.statusBar.restMessage);
        this.statusBar.setClickEvent(() => {
          this.stage.slideIn();
          this.statusBar.close();
          this.statusBar.clearHoverEvent();
          this.statusBar.clearClickEvent();
        });
      } else {
        this.stage.slideIn();
      }
    });
  }

  /**
   * 舞台滑入
   */
  async stageSlideIn(): Promise<void> {
    await this.stage.slideIn();
  }

  /**
   * 舞台滑出
   */
  async stageSlideOut(): Promise<void> {
    await this.stage.slideOut();
  }

  /**
   * 弹出状态条并保持打开状态
   * @param content
   * @param color
   */
  statusBarOpen(content?: string, color?: string): void {
    this.statusBar.open(content, color);
  }

  /**
   * 清除当前提示框内容并关闭空闲消息播放器
   */
  clearTips(): void {
    this.tips.clear();
  }
  /**
   * 设置状态条点击事件
   * @param fn
   */
  setStatusBarClickEvent(fn: EventFn): void {
    this.statusBar.setClickEvent(fn);
  }

  /**
   * 收起状态条
   * @param content
   * @param color
   * @param delay
   */
  statusBarClose(content?: string, color?: string, delay?: number): void {
    this.statusBar.close(content, color, delay);
  }
  /**
   * 清除状态条所有绑定事件
   */
  statusBarClearEvents(): void {
    this.statusBar.clearClickEvent();
    this.statusBar.clearHoverEvent();
  }
  /**
   * 舞台滑入动画执行完毕后的事件监听
   * @param fn
   */
  onStageSlideIn(fn: EventFn): void {
    this.events.add('stageSlideIn', fn);
  }

  /**
   * 舞台滑出动画执行完毕后的事件监听
   * @param fn
   */
  onStageSlideOut(fn: EventFn): void {
    this.events.add('stageSlideOut', fn);
  }

  /**
   * 模型在每次加载状态发生变化时的事件监听
   * @param fn
   */
  onLoad(fn: LoadEventFn): void {
    this.events.add('load', fn);
  }

  /**
   * 注册全局事件
   */
  private registerGlobalEvent(): void {
    onChangeWindowSize(() => {
      void this.reloadModel();
    });

    this.onStageSlideIn(() => {
      this.tips.welcome();
    });

    window.document.oncopy = (): void => {
      this.tips.copy();
    };
  }
}
