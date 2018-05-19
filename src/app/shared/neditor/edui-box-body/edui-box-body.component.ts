import {
  Component,
  OnInit,
  HostBinding,
  Input,
  Renderer2,
  ElementRef,
  Directive,
} from '@angular/core';
import { fromEvent } from 'rxjs';
@Directive({
  selector: '[edui-box-body]',
})
export class EduiBoxBodyDirective implements OnInit {
  @HostBinding('class.edui-notadd') _notadd: boolean = true;
  _type: string;
  @Input()
  set type(val: string) {
    if (this._type) {
      this.render.removeClass(
        this.ele.nativeElement,
        `edui-${this._type}-body`,
      );
    } else {
      this.render.addClass(this.ele.nativeElement, `edui-${val}-body`);
      this._type = val;
    }
  }
  get type() {
    return this._type;
  }

  @Input() disabled: boolean = false;
  constructor(public render: Renderer2, public ele: ElementRef) {}

  ngOnInit() {
    if (!this.disabled) {
      fromEvent(this.ele.nativeElement, 'mouseover').subscribe(res => {
        this.render.addClass(this.ele.nativeElement, 'edui-state-hover');
      });
      fromEvent(this.ele.nativeElement, 'mouseout').subscribe(res => {
        this.render.removeClass(this.ele.nativeElement, 'edui-state-hover');
      });
    }
  }
}
