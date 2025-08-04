import { Routes } from '@angular/router';
import { HomeComponentComponent } from './home-component/home-component.component';
import { CertificateComponent } from './certificate/certificate.component';
import { CertficateDownloadComponent } from './certficate-download/certficate-download.component';
import { RegisterComponent } from './register/register.component';
import { EmpYearComponent } from './certificate_types/emp-year/emp-year.component';
import { AccountComponent } from './account/account.component';
import { AttendanceComponent } from './certificate_types/attendance/attendance.component'; 
import { PeerAwardComponent } from './certificate_types/peer-award/peer-award.component';
import { VibesAwardComponent } from './certificate_types/vibes-award/vibes-award.component';
import { PunctualityComponent } from './certificate_types/punctuality/punctuality.component';
import { ExemplaryComponent } from './certificate_types/exemplary/exemplary.component';
import { InitiativeComponent } from './certificate_types/initiative/initiative.component';
import { LeadershipComponent } from './certificate_types/leadership/leadership.component';
import { OutstandingComponent } from './certificate_types/outstanding/outstanding.component';
import { CompletionComponent } from './certificate_types/completion/completion.component';

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
    { path: 'account-settings', component: AccountComponent },
    { path: 'attendance', component: AttendanceComponent },
    { path: 'peer-award', component: PeerAwardComponent },
    { path: 'vibes-award', component: VibesAwardComponent },
    { path: 'punctuality', component: PunctualityComponent },
    { path: 'exemplary', component: ExemplaryComponent},
    { path: 'initiative', component: InitiativeComponent},
    { path: 'leadership', component: LeadershipComponent},
    { path: 'outstanding', component: OutstandingComponent},
    { path: 'completion', component: CompletionComponent }
];