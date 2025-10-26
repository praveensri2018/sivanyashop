import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { SizeChartService } from '../../services/size-chart.service';
import { SizeChart, SizeMeasurement } from '../../models/size-chart.model';

@Component({
  selector: 'app-size-chart-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, // This enables formGroup, formGroupName, formControlName
    RouterModule // This enables routerLink
  ],
  templateUrl: './size-chart-form.component.html',
  styleUrls: ['./size-chart-form.component.scss']
})
export class SizeChartFormComponent implements OnInit {
  sizeChartForm: FormGroup;
  isEdit = false;
  sizeChartId?: number;
  loading = false;
  submitting = false;

  // Common measurement fields for different chart types
  measurementFields = {
    DRESS: ['Chest', 'Waist', 'Hips', 'Length'],
    SHOES: ['Length', 'Width'],
    GENERAL: ['Length', 'Width', 'Height']
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private sizeChartService: SizeChartService
  ) {
    this.sizeChartForm = this.createForm();
  }

  ngOnInit(): void {
    this.sizeChartId = this.route.snapshot.params['id'];
    this.isEdit = !!this.sizeChartId;

    if (this.isEdit && this.sizeChartId) {
      this.loadSizeChart(this.sizeChartId);
    }

    // Update measurement fields when chart type changes
    this.sizeChartForm.get('chartType')?.valueChanges.subscribe((type: string) => {
      this.updateMeasurementFields();
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      chartType: ['DRESS', Validators.required],
      description: [''],
      measurements: this.fb.array([])
    });
  }

  get measurements(): FormArray {
    return this.sizeChartForm.get('measurements') as FormArray;
  }

  createMeasurementFormGroup(measurement?: SizeMeasurement): FormGroup {
    const group: any = {
      size: [measurement?.size || '', Validators.required]
    };

    // Add dynamic measurement fields based on chart type
    const chartType = this.sizeChartForm.get('chartType')?.value || 'DRESS';
    const fields = this.measurementFields[chartType as keyof typeof this.measurementFields] || [];
    
    fields.forEach(field => {
      const key = field.toLowerCase();
      group[key] = [measurement?.measurements?.[key] || 0, [Validators.required, Validators.min(0)]];
    });

    return this.fb.group(group);
  }

  addSize(): void {
    this.measurements.push(this.createMeasurementFormGroup());
  }

  removeSize(index: number): void {
    this.measurements.removeAt(index);
  }

  updateMeasurementFields(): void {
    const currentMeasurements = this.measurements.value;
    this.measurements.clear();
    
    currentMeasurements.forEach((measurement: any) => {
      this.measurements.push(this.createMeasurementFormGroup(measurement));
    });
  }

  loadSizeChart(id: number): void {
    this.loading = true;
    this.sizeChartService.getSizeChartById(id).subscribe({
      next: (response) => {
        this.populateForm(response.sizeChart);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading size chart:', error);
        this.loading = false;
        alert('Error loading size chart');
      }
    });
  }

  populateForm(sizeChart: SizeChart): void {
    this.sizeChartForm.patchValue({
      name: sizeChart.name,
      chartType: sizeChart.chartType,
      description: sizeChart.description
    });

    // Clear existing measurements and add new ones
    this.measurements.clear();
    sizeChart.measurements.forEach(measurement => {
      this.measurements.push(this.createMeasurementFormGroup(measurement));
    });
  }

  onSubmit(): void {
    if (this.sizeChartForm.valid) {
      this.submitting = true;
      
      const formValue = this.sizeChartForm.value;
      const sizeChartData = {
        name: formValue.name,
        chartType: formValue.chartType,
        description: formValue.description,
        measurements: formValue.measurements.map((m: any) => ({
          size: m.size,
          measurements: { ...m }
        }))
      };

      const observable = this.isEdit && this.sizeChartId
        ? this.sizeChartService.updateSizeChart(this.sizeChartId, sizeChartData)
        : this.sizeChartService.createSizeChart(sizeChartData);

      observable.subscribe({
        next: (response) => {
          this.submitting = false;
          alert(`Size chart ${this.isEdit ? 'updated' : 'created'} successfully!`);
          this.router.navigate(['/admin/size-charts']);
        },
        error: (error) => {
          console.error('Error saving size chart:', error);
          this.submitting = false;
          alert('Error saving size chart');
        }
      });
    } else {
      this.markFormGroupTouched(this.sizeChartForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl: any) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  getMeasurementFields(): string[] {
    const chartType = this.sizeChartForm.get('chartType')?.value || 'DRESS';
    return this.measurementFields[chartType as keyof typeof this.measurementFields] || [];
  }

  getFieldName(field: string): string {
    return field.toLowerCase();
  }
}