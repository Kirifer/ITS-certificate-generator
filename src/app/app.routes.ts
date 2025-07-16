import { Routes } from '@angular/router';
import { HomeComponentComponent } from './home-component/home-component.component';
import { CertificateComponent } from './certificate/certificate.component';

export const routes: Routes = [
    { path: 'certificates', component: CertificateComponent },
    { path: '', component: HomeComponentComponent }
];
