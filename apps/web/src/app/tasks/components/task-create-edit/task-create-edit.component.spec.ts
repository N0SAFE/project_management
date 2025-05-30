import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCreateEditComponent } from './task-create-edit.component';

describe('TaskCreateEditComponent', () => {
  let component: TaskCreateEditComponent;
  let fixture: ComponentFixture<TaskCreateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCreateEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskCreateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
