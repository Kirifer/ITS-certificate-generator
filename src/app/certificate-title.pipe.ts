import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'certificateTitle',
  standalone: true
})
export class CertificateTitlePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
