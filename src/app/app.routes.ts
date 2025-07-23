import { Routes } from '@angular/router';
import { HomeComponentComponent } from './home-component/home-component.component';
import { CertificateComponent } from './certificate/certificate.component';
import { CertficateDownloadComponent } from './certficate-download/certficate-download.component';
import { RegisterComponent } from './register/register.component';
import { EmpYearComponent } from './certificate_types/emp-year/emp-year.component';
import { AccountComponent } from './account/account.component'; 

export const routes: Routes = [
    { path: 'certificates', component: CertificateComponent },
    { path: '', component: HomeComponentComponent },
    {
      path: 'login',
      loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    { path: 'approved', component: CertficateDownloadComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'downloads', component: CertficateDownloadComponent },
    { path: 'empyear', component: EmpYearComponent },
    { path: 'account-settings', component: AccountComponent }
];
