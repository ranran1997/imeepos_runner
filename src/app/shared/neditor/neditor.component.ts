import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  Renderer2,
  ChangeDetectionStrategy,
  AfterViewInit,
  HostBinding,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as _ from 'lodash';
import { Iwe7ScriptService } from 'iwe7-script';
import { Iwe7GlobalService } from 'iwe7-global';

import { UrlService } from '@core/url.service';
import { throttleTime, debounceTime } from 'rxjs/operators';

declare let UE: any;

export const EDITOR_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NeditorComponent),
  multi: true,
};

@Component({
  selector: 'neditor',
  templateUrl: './neditor.component.html',
  providers: [EDITOR_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeditorComponent
  implements ControlValueAccessor, OnInit, OnDestroy, AfterViewInit {
  editor_text: string = '';
  elementRef: ElementRef;
  config: any;
  isReady: boolean = false;
  editorChange: any = (_: any) => {};
  defaultConfig: any = {
    autoHeightEnabled: false,
  };
  ue: any = null;
  Editor: any;
  EventBase: any;
  uNode: any;
  domRange: any;
  domSelection: any;
  domUtils: Function;
  ajax: any;
  browser: any;
  utils: Function;

  @Input()
  set option(config: any) {
    this.config = config;
  }

  get option(): any {
    return this.config;
  }

  get text() {
    return this.editor_text;
  }

  set text(value: string) {
    this.editor_text = value;
    if (this.isReady) {
      this.setContent(value);
    }
  }

  // 编辑器准备就绪后会触发该事件
  @Output() ready: EventEmitter<any> = new EventEmitter<any>(false);

  // 执行destroy方法,会触发该事件
  @Output() destroy: EventEmitter<any> = new EventEmitter<any>(false);

  // 执行reset方法,会触发该事件
  @Output() reset: EventEmitter<any> = new EventEmitter<any>(false);

  // 执行focus方法,会触发该事件
  @Output() focusEvent: EventEmitter<any> = new EventEmitter<any>(false);

  // 语言加载完成会触发该事件
  @Output() langReady: EventEmitter<any> = new EventEmitter<any>(false);

  // 运行命令之后会触发该命令
  @Output() beforeExecCommand: EventEmitter<any> = new EventEmitter<any>(false);

  // 运行命令之后会触发该命令
  @Output() afterExecCommand: EventEmitter<any> = new EventEmitter<any>(false);

  // 运行命令之前会触发该命令
  @Output()
  firstBeforeExecCommand: EventEmitter<any> = new EventEmitter<any>(false);

  // 在getContent方法执行之前会触发该事件
  @Output() beforeGetContent: EventEmitter<any> = new EventEmitter<any>(false);

  // 在getContent方法执行之后会触发该事件
  @Output() afterGetContent: EventEmitter<any> = new EventEmitter<any>(false);

  // 在getAllHtml方法执行时会触发该事件
  @Output() getAllHtml: EventEmitter<any> = new EventEmitter<any>(false);

  // 在setContent方法执行之前会触发该事件
  @Output() beforeSetContent: EventEmitter<any> = new EventEmitter<any>(false);

  // 在setContent方法执行之后会触发该事件
  @Output() afterSetContent: EventEmitter<any> = new EventEmitter<any>(false);

  // 每当编辑器内部选区发生改变时，将触发该事件
  // 警告： 该事件的触发非常频繁，不建议在该事件的处理过程中做重量级的处理
  @Output() selectionchange: EventEmitter<any> = new EventEmitter<any>(false);

  // 在所有selectionchange的监听函数执行之前，会触发该事件
  @Output()
  beforeSelectionChange: EventEmitter<any> = new EventEmitter<any>(false);

  // 在所有selectionchange的监听函数执行完之后，会触发该事件
  @Output()
  afterSelectionChange: EventEmitter<any> = new EventEmitter<any>(false);

  // 编辑器内容发生改变时会触发该事件
  @Output() contentChange: EventEmitter<any> = new EventEmitter<any>(false);

  @HostBinding('attr.id') id: string = 'ueditor';
  @HostBinding('class.myeditor') myeditor: boolean = true;
  @HostBinding('style.overflow') overflow: string = 'hidden';

  @ViewChild('textarea') textarea: ElementRef;
  random: any = 6;
  constructor(
    elementRef: ElementRef,
    public render: Renderer2,
    public script: Iwe7ScriptService,
    public url: UrlService,
    public global: Iwe7GlobalService,
  ) {
    this.elementRef = elementRef;
    render.listen(this.elementRef.nativeElement, 'click', () => {}); // 当数据变化时通过调用click事件触发数据检测，保证视图已更新
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.script
      .load([
        `${this.url.root}addons/runner_open/assets/neditor/neditor.config.js?t=${this.random}`,
        `${this.url.root}addons/runner_open/assets/neditor/neditor.all.js?t=${this.random}`,
        `${this.url.root}addons/runner_open/assets/neditor/i18n/zh-cn/zh-cn.js?t=${this.random}`,
      ])
      .subscribe(res => {
        this.Editor = UE.Editor;
        this.EventBase = UE.EventBase;
        this.uNode = UE.uNode;
        this.domRange = UE.dom.Range;
        this.domSelection = UE.dom.Selection;
        this.domUtils = UE.dom.domUtils;
        this.ajax = UE.ajax;
        this.browser = UE.browser;
        this.utils = UE.utils;
        const con: any = _.merge({}, this.defaultConfig, this.config);
        if (this.global.map.has(this.id)) {
          this.ue = this.global.get(this.id);
          // UE.delEditor(this.id);
          console.log(this.ue);
          this.ue.render(this.textarea.nativeElement);
          // this.global.set(this.id, this.ue);
        } else {
          this.ue = UE.getEditor(this.id, con);
          console.log(this.ue);
          this.global.set(this.id, this.ue);
        }
        console.dir(this.ue);
        // 注册事件
        this.addListener('ready', (editor: any) => {
          this.isReady = true;
          this.setContent(this.editor_text);
          this.ue.setHeight(300);
          this.ready.emit(this);
          this.focus();
        });

        this.addListener('destroy', (editor: any) => {
          this.destroy.emit(this);
        });

        this.addListener('reset', (editor: any) => {
          this.reset.emit(this);
        });

        this.addListener('focus', (editor: any) => {
          this.focusEvent.emit(this);
        });

        this.addListener('langReady', (editor: any) => {
          this.langReady.emit(this);
        });

        this.addListener('beforeExecCommand', (editor: any) => {
          this.beforeExecCommand.emit(this);
        });

        this.addListener('afterExecCommand', (editor: any) => {
          this.afterExecCommand.emit(this);
        });

        this.addListener('firstBeforeExecCommand', (editor: any) => {
          this.firstBeforeExecCommand.emit(this);
        });

        this.addListener('beforeGetContent', (editor: any) => {
          this.beforeGetContent.emit(this);
        });

        this.addListener('afterGetContent', (editor: any) => {
          this.afterGetContent.emit(this);
        });

        this.addListener('getAllHtml', (editor: any) => {
          this.getAllHtml.emit(this);
        });

        this.addListener('beforeSetContent', (editor: any) => {
          this.beforeSetContent.emit(this);
        });

        this.addListener('afterSetContent', (editor: any) => {
          this.afterSetContent.emit(this);
        });

        this.addListener('selectionchange', (editor: any) => {
          this.viewAndModelChange();
          this.selectionchange.emit(this);
        });

        this.addListener('beforeSelectionChange', (editor: any) => {
          this.beforeSelectionChange.emit(this);
        });

        this.addListener('afterSelectionChange', (editor: any) => {
          this.afterSelectionChange.emit(this);
        });

        this.addListener('contentChange', () => {
          this.viewAndModelChange();
          this.contentChange.emit(this.editor_text);
        });
      });
  }

  ngOnDestroy() {
    this.events.forEach((item, key) => {
      this.ue.removeListener(key, item);
    });
    this.ue.hide();
  }
  events: Map<string, Function> = new Map();
  addListener(key: string, fn: Function) {
    this.ue.addListener(key, fn);
    this.events.set(key, fn);
  }

  /**
   * 更新视图和模型及有关值
   */
  viewAndModelChange() {
    this.editor_text = this.getContent();
    this.editorChange(this.editor_text); // 更新ngModel
    this.elementRef.nativeElement.click(); // 触发数据检测，保证视图已更新
  }

  // ueditor常用API
  /**
   * 设置编辑器高度
   * 提示：当配置项autoHeightEnabled为真时,该方法无效
   * @param height 编辑器高度（不带单位）
   */
  setHeight(height: number): void {
    this.ue && this.ue.setHeight(height);
  }

  /**
   * 设置编辑器的内容，可修改编辑器当前的html内容
   * @param html 要插入的html内容
   * @param isAppendTo 若传入true，不清空原来的内容，在最后插入内容，否则，清空内容再插入
   */
  setContent(html: string, isAppendTo: boolean = false): void {
    this.ue && this.ue.setContent(html, isAppendTo);
  }

  /**
   * 获取编辑器html内容
   */
  getContent(): any {
    return this.ue && this.ue.getContent();
  }

  /**
   * 获取编辑器纯文本内容
   */
  getContentTxt(): any {
    return this.ue && this.ue.getContentTxt();
  }

  /**
   * 获取编辑器带格式的纯文本内容
   */
  getPlainTxt(): any {
    return this.ue && this.ue.getPlainTxt();
  }

  /**
   * 判断编辑器是否有内容
   */
  hasContents(): boolean {
    return this.ue && this.ue.hasContents();
  }

  /**
   * 让编辑器获得焦点
   */
  focus(): void {
    this.ue && this.ue.focus();
  }

  /**
   * 让编辑器失去焦点
   */
  blur(): void {
    this.ue && this.ue.blur();
  }

  /**
   * 判断编辑器是否获得焦点
   */
  isFocus(): boolean {
    return this.ue && this.ue.isFocus();
  }

  /**
   * 设置当前编辑区域不可编辑
   */
  setDisabled(): void {
    this.ue && this.ue.setDisabled();
  }

  /**
   * 设置当前编辑区域可以编辑
   */
  setEnabled(): void {
    this.ue && this.ue.setEnabled();
  }

  /**
   * 隐藏编辑器
   */
  setHide(): void {
    this.ue && this.ue.setHide();
  }

  /**
   * 显示编辑器
   */
  setShow(): void {
    this.ue && this.ue.setShow();
  }

  /**
   * 获得当前选中的文本
   */
  getSelectionText(): string {
    return this.ue && this.ue.selection.getText();
  }

  /**
   * 执行指定命令
   * @param command 命令
   * @param content 内容
   */
  executeCommand(command: string, content?: string): void {
    if (content) {
      this.ue && this.ue.execCommand(command, content);
    } else {
      this.ue && this.ue.execCommand(command);
    }
  }

  // 以下实现ControlValueAccessor接口的方法
  writeValue(value: string): void {
    if (value) {
      this.text = value;
    }
  }

  registerOnChange(fn: any): void {
    this.editorChange = fn;
  }

  registerOnTouched(fn: any): void {}
}
