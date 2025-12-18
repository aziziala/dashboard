import { Component, OnInit,ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TaxiService } from '../../services/taxi.service';
import { Taxi, TaxiStatus, PhoneType } from '../../models/taxi.model';
import { PagedTaxisResponse } from '../../models/paged-taxis-response';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';


@Component({
  selector: 'app-taxi-management',
  templateUrl: './taxi-management.component.html',
  styleUrls: ['./taxi-management.component.scss']
})
export class TaxiManagementComponent implements OnInit {

  TaxiStatus = TaxiStatus;
  PhoneType = PhoneType;

  taxis: Taxi[] = [];
  filteredTaxis: Taxi[] = [];
  selectedTaxi: Taxi | null = null;

  isLoading = false;
  searchTerm = '';
  statusFilter: TaxiStatus | '' = '';
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;
  itemsPerPage = 20;
  pages: number[] = []; // 👈 Added for pagination display

  taxiStats = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    online: 0,
    offline: 0
  };
  passwordForm: FormGroup;
  confirmationForm: FormGroup;
  taxiForm: FormGroup;
  isEditing = false;
  isDarkMode = false;
  editingTaxiId: number | null = null;
  verifyForm!: FormGroup;
  passwordTaxiId!: number;
@ViewChild('confirmationCodeModal') confirmationCodeModal!: any;
@ViewChild('changePasswordModal') changePasswordModal!: any;


  constructor(
    private modalService: NgbModal,
    private taxiService: TaxiService,
    private fb: FormBuilder
  ) {
    this.taxiForm = this.fb.group({
      nomPrenom: ['', Validators.required],
      cin: ['', Validators.required],
      immatricule: ['', Validators.required],
      plaqueTaxi: ['', Validators.required],
      modeleVoiture: ['', Validators.required],
      taxiStatus: [TaxiStatus.PENDING, Validators.required],
      typeTel: [PhoneType.gsm, Validators.required],
      numTel: ['', Validators.required],
      email: ['', [Validators.email]],
      
    });
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { 
      validator: this.passwordMatchValidator 
    });

    this.confirmationForm = this.fb.group({
      confirmationCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
    });

    this.verifyForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  telephone: ['', Validators.required]
});

  }
  // Open the password change modal
  openChangePasswordModal(content: any) {
    this.modalService.open(content, { size: 'lg' });
  }
    // Password match validator
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }


    // This method will be triggered when the password form is submitted
submitPasswordChange() {
  if (this.passwordForm.invalid) return;

  const payload = {
    taxiId: this.passwordTaxiId,
    newPassword: this.passwordForm.value.newPassword
  };

  this.taxiService.resetPassword(payload).subscribe({
    next: () => {
      this.modalService.dismissAll();
      alert('Mot de passe changé avec succès');
    },
    error: err => console.error('Erreur changement mot de passe', err)
  });
}


  ngOnInit(): void {
    this.loadTaxis(this.currentPage);
  }

  /** ✅ Loads taxis and regenerates pagination pages */
  loadTaxis(page: number): void {
    this.isLoading = true;
    this.taxiService.getTaxis(page - 1, this.itemsPerPage).subscribe({
      next: (response: PagedTaxisResponse) => {
        this.taxis = response.content;
        this.totalItems = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = page;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1); // 👈 Generate page numbers
        this.filterTaxis();
        this.updateStatistics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading taxis:', error);
        this.isLoading = false;
      }
    });
  }

  updateStatistics(): void {
    this.taxiStats.total = this.taxis.length;
    this.taxiStats.approved = this.taxis.filter(t => t.taxiStatus === TaxiStatus.APPROVED).length;
    this.taxiStats.pending = this.taxis.filter(t => t.taxiStatus === TaxiStatus.PENDING).length;
    this.taxiStats.rejected = this.taxis.filter(t => t.taxiStatus === TaxiStatus.REJECTED).length;
    this.taxiStats.online = this.taxis.filter(t => t.traitement).length;
    this.taxiStats.offline = this.taxis.filter(t => !t.traitement).length;
  }

filterTaxis(resetPage = false): void {
  this.filteredTaxis = this.taxis.filter(taxi => {
    const matchesSearch = !this.searchTerm ||
      taxi.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      taxi.telephone?.includes(this.searchTerm) ||
      taxi.numeroTaxi?.toLowerCase().includes(this.searchTerm.toLowerCase());

    const matchesStatus = !this.statusFilter || taxi.taxiStatus === this.statusFilter;
    return matchesSearch && matchesStatus;
  });

  this.totalItems = this.filteredTaxis.length;
  if (resetPage) this.currentPage = 1; 
 }


  openAddModal(content: any): void {
    this.isEditing = false;
    this.editingTaxiId = null;
    this.taxiForm.reset({
      taxiStatus: TaxiStatus.PENDING,
      typeTel: PhoneType.gsm
    });
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }

openEditModal(content: any, taxi: Taxi): void {
  if (!taxi || !taxi.id) return; // safety check

  this.isEditing = true;
  this.editingTaxiId = taxi.id;

  // Patch form values from selected taxi
  this.taxiForm.patchValue({
    nomPrenom: taxi.nom,
    cin: taxi.numeroCin,
    immatricule: taxi.numeroMatricule,
    plaqueTaxi: taxi.numeroTaxi,
    modeleVoiture: taxi.constructeur,
    taxiStatus: taxi.taxiStatus,
    typeTel: taxi.type,
    numTel: taxi.telephone,
    email: taxi.email,
    
  });

  // Open modal
  this.modalService.open(content, { size: 'lg', backdrop: 'static' });
}


saveTaxi() {
  if (this.taxiForm.invalid) {
    this.taxiForm.markAllAsTouched();
    return;
  }

  const taxiData: Taxi = {
    id: this.editingTaxiId || 0,
    nom: this.taxiForm.value.nomPrenom,
    numeroCin: this.taxiForm.value.cin,
    numeroMatricule: this.taxiForm.value.immatricule,
    numeroTaxi: this.taxiForm.value.plaqueTaxi,
    constructeur: this.taxiForm.value.modeleVoiture,
    taxiStatus: this.taxiForm.value.taxiStatus,
    type: this.taxiForm.value.typeTel,
    telephone: this.taxiForm.value.numTel,
    email: this.taxiForm.value.email,
    traitement: false,
    
    destination: this.taxiForm.value.destination || '',
    contenu: null
  };

  // ---------- UPDATE ----------
  if (this.isEditing && this.editingTaxiId) {
    this.taxiService.updateTaxi(this.editingTaxiId, taxiData).subscribe({
      next: () => {
        this.loadTaxis(this.currentPage);
        this.modalService.dismissAll();
        this.isEditing = false;
        this.editingTaxiId = null;
      },
      error: (err) => console.error('Error updating taxi:', err)
    });

    return;
  }

  // ---------- CREATE / ADD ----------
  this.taxiService.addTaxi(taxiData).subscribe({
    next: () => {
      this.loadTaxis(this.currentPage); // refresh table
      this.modalService.dismissAll();   // close modal
      this.taxiForm.reset();            // reset form
    },
    error: (err) => console.error('Error adding taxi:', err)
  });
}

  deleteTaxi(taxiId: number): void {
    if (confirm('Are you sure you want to delete this taxi?')) {
      this.taxiService.deleteTaxi(taxiId).subscribe({
        next: () => this.loadTaxis(this.currentPage),
        error: (err) => console.error('Error deleting taxi:', err)
      });
    }
  }
  selectedTaxiId!: number;

openDeleteModal(content: any, taxiId: number) {
  this.selectedTaxiId = taxiId;
  this.modalService.open(content, { centered: true });
}

confirmDelete() {
  this.deleteTaxi(this.selectedTaxiId);
}


  updateTaxiStatus(taxiId: number, status: TaxiStatus): void {
    this.taxiService.updateTaxiStatus(taxiId, status).subscribe({
      next: () => this.loadTaxis(this.currentPage),
      error: (err) => console.error('Error updating taxi status:', err)
    });
  }

  updateTaxiLocation(taxiId: number, lat: number, lng: number): void {
    const taxi = this.taxis.find(t => t.id === taxiId);
    if (!taxi || !taxi.telephone) return;
    this.taxiService.updateTaxiLocation(taxi.telephone, { latitude: lat, longitude: lng }).subscribe({
      next: () => this.loadTaxis(this.currentPage),
      error: (err) => console.error('Error updating taxi location:', err)
    });
  }

 onPageChange(page: number): void {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page; // 👈 ensures view updates immediately
    this.loadTaxis(page);
  }
}

  get paginatedTaxis(): Taxi[] {
  return this.filteredTaxis.length ? this.filteredTaxis : this.taxis;
}

  getStatusBadgeClass(status: TaxiStatus | string): string {
    switch (status) {
      case TaxiStatus.APPROVED:
      case 'APPROVED':
        return 'bg-success';
      case TaxiStatus.PENDING:
      case 'PENDING':
        return 'bg-warning';
      case TaxiStatus.REJECTED:
      case 'REJECTED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getOnlineStatusClass(isOnline: boolean): string {
    return isOnline ? 'text-success' : 'text-secondary';
  }

  exportData(type: string): void {
    if (!this.taxis.length) {
      alert('Aucune donnée à exporter.');
      return;
    }

    const data = this.taxis.map(t => ({
      ID: t.id,
      Nom: t.nom || '',
      CIN: t.numeroCin || '',
      Immatriculation: t.numeroMatricule || '',
      'Plaque Taxi': t.numeroTaxi || '',
      Modèle: t.constructeur || '',
      Téléphone: t.telephone || '',
      Statut: t.taxiStatus || ''
    }));

    switch (type) {
      case 'excel': {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Taxis');
        XLSX.writeFile(wb, 'taxis.xlsx');
        break;
      }
      case 'csv': {
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'taxis.csv';
        link.click();
        break;
      }
      case 'pdf': {
        const doc = new jsPDF();
        doc.text('Liste des Taxis', 14, 10);
        autoTable(doc, {
          head: [['ID', 'Nom', 'CIN', 'Immatriculation', 'Plaque', 'Modèle', 'Téléphone', 'Statut']],
          body: data.map(t => [t.ID, t.Nom, t.CIN, t.Immatriculation, t['Plaque Taxi'], t.Modèle, t.Téléphone, t.Statut]),
          startY: 20,
          theme: 'grid'
        });
        doc.save('taxis.pdf');
        break;
      }
      default:
        console.error('Type d’export inconnu :', type);
    }
  }

  onSubmitTaxi(form: any, modal: any) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      console.warn("Formulaire invalide — vérifiez les champs obligatoires");
      return;
    }
  }

  openDetailsModal(content: any, taxi: Taxi): void {
  this.selectedTaxi = taxi;
  this.modalService.open(content, { size: 'lg', backdrop: 'static' });
}

printDetails(): void {
  const printContents = document.getElementById('detailsContent')?.innerHTML;
  if (!this.selectedTaxi) return;

  const taxi = this.selectedTaxi;
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const popupWin = window.open('', '_blank', 'width=900,height=700');
  popupWin!.document.open();
  popupWin!.document.write(`
<header>
<style>
@page {
  size: A4;
  margin: 2cm; /* Adjust if needed */
}
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');

:root {
  --font-color: #211F54;
  --highlight-color: #d8363a;
  --secondary-color: #3b71ca;
  --gap-size: 15px;
}

* { box-sizing: border-box; }

body{
  margin:0;
  padding:1cm 2cm;
  color:var(--font-color);
  font-family:'Montserrat', sans-serif;
  font-size:10pt;
  background-color: white; /* remove background colors */
}

a{ color:inherit; text-decoration:none; }

hr{
  margin: 0.8cm 0;
  height:0;
  border:0;
  border-top:1mm solid var(--highlight-color);
}

header{
  height:auto;
  padding:1cm 0;
  text-align:center; /* center logo */
  background-color: transparent; /* remove background */
  color: var(--font-color);
}

header .logoAndName img{
  width:9cm; /* bigger logo */
  height:auto;
  display:block;
  margin:0 auto;
}

.formLine { display: flex; align-items: flex-start; margin-left: calc(-1 * var(--gap-size)); margin-bottom: .5cm; }
.formLineWrap { flex-wrap: wrap; }
.formLine > * { padding-left: var(--gap-size); box-sizing: border-box; }

/* Label colors */
label{
  font-weight:bold;
  color: #211F54; /* default labels dark blue */
}

/* Sublabel overrides */
label.sublabel {
  font-size: 1.05em; /* +5% size */
  text-transform: uppercase;
  color: black;
  padding-bottom: 0.25em;
}

input[type="text"], select {
  width: 100%;
  height: 25px;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  padding:2px 5px;
}

input[type="text"]:focus, select:focus {
  border-color: var(--highlight-color);
  outline:none;
}

.w100{ width:100%; }
.w66{ width:66%; }
.w50{ width:50%; }
.w33{ width:33%; }

/* Footer centered without background */
.pdf-footer{
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 10pt;
  color: var(--font-color);
  border-top: 2px solid var(--highlight-color);
  padding: 10px 0;
  background: transparent; /* remove background */
  font-weight: 500;
}
</style>

<div class="headerSection" style="position: relative; margin-bottom: 2cm;">
  <div style="position: absolute; top: 0; left: 0; ">ID: <b>${taxi.id}</b></div>
  <div style="position: absolute; top: 0; right: 0;">Date: <b>${formattedDate}</b></div>
  <div class="logoAndName">
    <img src="assets/logoY2.png" alt="logo-smstaxi">
  </div>
</div>

</header>

<main>
<form name="application">
  <br/>
  <label class="w100 sublabel">Informations Conducteur :</label>
  <br/>
  <div class="formLine">
    <div class="w66">
      <label>Nom et prénom:</label>
      <input type="text" value="${taxi.nom || ''}"/>
    </div>
    <div class="w33">
      <label>Carte d'Identité Nationale:</label>
      <input type="text" value="${taxi.numeroCin || ''}"/>
    </div>
  </div>
  <hr/>
  <label class="w100 sublabel">Information Taxi:</label>
  <br/>
  <div class="formLine">
    <div class="w33">
      <label>Numéro d'Immatriculation:</label>
      <input type="text" value="${taxi.numeroMatricule || ''}"/>
    </div>
    <div class="w33">
      <label>Plaque d'identification:</label>
      <input type="text" value="${taxi.numeroTaxi || ''}"/>
    </div>
    <div class="w33">
      <label>Modèles de voiture:</label>
      <input type="text" value="${taxi.constructeur || ''}"/>
    </div>
  </div>
  <hr/>
  <label class="w100 sublabel">Contact:</label>
  <br/>
  
  <div class="formLine">
    <div class="w66">
      <label>Adresse e-mail:</label>
      <input type="text" value="${taxi.email || ''}"/>
    </div>
    <div class="w33">
      <label>Numéro de téléphone:</label>
      <input type="text" value="${taxi.telephone || ''}"/>
    </div>
  </div>
</form>
</main>

<div class="pdf-footer">
  © ${today.getFullYear()} TAXICHY-SMSTaxi — Tous droits réservés.
</div>
  `);
  popupWin!.document.close();
}


downloadDetailsPDF(): void {
  if (!this.selectedTaxi) return;

  const taxi = this.selectedTaxi;
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // 1️⃣ Create a temporary container with the same template and CSS as print
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px'; // hide it
  tempDiv.innerHTML = `
    <div id="pdfContent">
     <header>
<style>
@page {
  size: A4;
  margin: 2cm; 
}
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');

:root {
  --font-color: #211F54;
  --highlight-color: #d8363a;
  --secondary-color: #3b71ca;
  --gap-size: 15px;
}

* { box-sizing: border-box; }

body{
  margin:0;
  padding:1cm 2cm;
  color:var(--font-color);
  font-family:'Montserrat', sans-serif;
  font-size:10pt;
  background-color: white; /* remove background colors */
}

a{ color:inherit; text-decoration:none; }

hr{
  margin: 0.8cm 0;
  height:0;
  border:0;
  border-top:1mm solid var(--highlight-color);
}

header{
  height:auto;
  padding:1cm 0;
  text-align:center; /* center logo */
  background-color: transparent; /* remove background */
  color: var(--font-color);
}

header .logoAndName img{
  width:9cm; /* bigger logo */
  height:auto;
  display:block;
  margin:0 auto;
}

.formLine { display: flex; align-items: flex-start; margin-left: calc(-1 * var(--gap-size)); margin-bottom: .5cm; }
.formLineWrap { flex-wrap: wrap; }
.formLine > * { padding-left: var(--gap-size); box-sizing: border-box; }


label{
  font-weight:bold;
  color: #211F54; /* default labels dark blue */
}

label.sublabel {
  font-size: 1.05em; /* +5% size */
  text-transform: uppercase;
  color: black;
  padding-bottom: 0.25em;
}

input[type="text"], select {
  width: 100%;
  height: 25px;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  padding:2px 5px;
}

input[type="text"]:focus, select:focus {
  border-color: var(--highlight-color);
  outline:none;
}

.w100{ width:100%; }
.w66{ width:66%; }
.w50{ width:50%; }
.w33{ width:33%; }

.pdf-footer{
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 10pt;
  color: var(--font-color);
  border-top: 2px solid var(--highlight-color);
  padding: 10px 0;
  background: transparent; /* remove background */
  font-weight: 500;
}
</style>

<div class="headerSection" style="position: relative; margin-bottom: 2cm;">
  <div style="position: absolute; top: 0; left: 0; ">ID: <b>${taxi.id}</b></div>
  <div style="position: absolute; top: 0; right: 0;">Date: <b>${formattedDate}</b></div>
  <div class="logoAndName">
    <img src="assets/logoY2.png" alt="logo-smstaxi">
  </div>
</div>
</header>

<main>
<form name="application">
  <br/>
  <label class="w100 sublabel">Informations Conducteur :</label>
  <br/>
  <div class="formLine">
    <div class="w66">
      <label>Nom et prénom:</label>
      <input type="text" value="${taxi.nom || ''}"/>
    </div>
    <div class="w33">
      <label>Carte d'Identité Nationale:</label>
      <input type="text" value="${taxi.numeroCin || ''}"/>
    </div>
  </div>
  <hr/>
  <label class="w100 sublabel">Information Taxi:</label>
  <br/>
  <div class="formLine">
    <div class="w33">
      <label>Numéro d'Immatriculation:</label>
      <input type="text" value="${taxi.numeroMatricule || ''}"/>
    </div>
    <div class="w33">
      <label>Plaque d'identification:</label>
      <input type="text" value="${taxi.numeroTaxi || ''}"/>
    </div>
    <div class="w33">
      <label>Modèles de voiture:</label>
      <input type="text" value="${taxi.constructeur || ''}"/>
    </div>
  </div>
  <hr/>
  <label class="w100 sublabel">Contact:</label>
  <br/>
  
  <div class="formLine">
    <div class="w66">
      <label>Adresse e-mail:</label>
      <input type="text" value="${taxi.email || ''}"/>
    </div>
    <div class="w33">
      <label>Numéro de téléphone:</label>
      <input type="text" value="${taxi.telephone || ''}"/>
    </div>
  </div>
</form>
</main>
  <div class="pdf-footer">
    © ${today.getFullYear()} TAXICHY-SMSTaxi — Tous droits réservés.
  </div>
  `;
  document.body.appendChild(tempDiv);

  // 2️⃣ Capture using html2canvas
  html2canvas(tempDiv, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`taxi-${taxi.id}.pdf`);

    // 3️⃣ Remove temporary container
    document.body.removeChild(tempDiv);
  }).catch(err => console.error('Error generating PDF:', err));
}

submitConfirmationCode(modal: any) {
  const code = Object.values(this.confirmationForm.value).join('');

  this.taxiService.verifyResetCode({
    taxiId: this.passwordTaxiId,
    code
  }).subscribe({
    next: () => {
      modal.close();
      this.modalService.open(this.changePasswordModal, {
        centered: true,
        backdrop: 'static'
      });
    },
    error: () => alert('Code incorrect')
  });
}


  moveFocus(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    if (value.length > 1) {
      input.value = value.slice(0, 1);
    }

    if (value.length === 1 && index < 3) {
      const nextInput = input.parentElement.children[index + 1];
      nextInput.focus();
    }

    if (value.length === 0 && index > 0) {
      const prevInput = input.parentElement.children[index - 1];
      prevInput.focus();
    }
  }

  openVerifyIdentityModal(content: any, taxi: Taxi) {
  this.passwordTaxiId = taxi.id!;

  this.verifyForm.patchValue({
    email: taxi.email,
    telephone: taxi.telephone
  });

  this.modalService.open(content, {
    centered: true,
    backdrop: 'static'
  });
}
sendVerificationCode(modal: any) {
  if (this.verifyForm.invalid) return;

  const payload = {
    taxiId: this.passwordTaxiId,
    email: this.verifyForm.value.email,
    telephone: this.verifyForm.value.telephone
  };

  this.taxiService.sendPasswordResetCode(payload).subscribe({
    next: () => {
      modal.close();
      this.modalService.open(this.confirmationCodeModal, {
        centered: true,
        backdrop: 'static'
      });
    },
    error: err => console.error('Erreur envoi code', err)
  });
}

}
