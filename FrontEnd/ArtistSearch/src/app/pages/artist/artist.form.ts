import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';

const yearRangeValidator: ValidatorFn = (formGroup: AbstractControl) => {
  const fromYear = formGroup.get('fromYear')?.value;
  const toYear = formGroup.get('toYear')?.value;

  if (fromYear !== null && toYear !== null && fromYear > toYear) {
    return { yearRangeInvalid: true };
  }
  return null;
};

export class SearchForm extends FormGroup {
  constructor() {
    super(
      {
        genre: new FormControl(''),
        country: new FormControl(''),
        fromYear: new FormControl(null, [
          Validators.min(1990),
          Validators.max(2023),
        ]),
        toYear: new FormControl(null, [
          Validators.min(1990),
          Validators.max(2023),
        ]),
      },
      { validators: yearRangeValidator }
    );
  }
}
