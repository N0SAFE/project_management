import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { ControlContainer, FormGroupDirective, NgControl } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <div class="form-field" [class.invalid]="hasError()">
      @if (label) {
        <label>{{label}} </label>
      }
      <ng-content></ng-content>
      
      <div class="form-error">
        @if (hasError()) {
          @for (error of errorMessages(); track $index) {
            {{ error }}
          }
        }
      </div>
    </div>
  `,
  styleUrls: ['./form-field.component.scss'],
  viewProviders: [ { provide: ControlContainer, useExisting: FormGroupDirective } ]
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() controlName = '';
  @Input() errorMap: Record<string, string> = {};
  @ContentChild(NgControl, { static: false }) ngControl?: NgControl;

  constructor(private formGroupDir: FormGroupDirective) {}

  get control() {
    return this.formGroupDir.form.get(this.controlName);
  }

  hasError() {
    return this.control && this.control.invalid && (this.control.dirty || this.control.touched);
  }

  errorMessages(): string[] {
    if (!this.control || !this.control.errors) return [];
    return Object.keys(this.control.errors).map(key => this.errorMap[key] || key);
  }
}
