import { Component, OnInit,ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TaxiService } from '../../services/taxi.service';
import { Taxi, TaxiStatus, PhoneType } from '../../models/taxi.model';
import { PagedTaxisResponse } from '../../models/paged-taxis-response';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import { switchMap, tap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';


declare var require: any;

const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');

pdfMake.vfs = pdfFonts.vfs;


@Component({
  selector: 'app-taxi-management',
  templateUrl: './taxi-management.component.html',
  styleUrls: ['./taxi-management.component.scss']
})
export class TaxiManagementComponent implements OnInit {
currentApp = 'SMSselect'; // par default el select


resetToken!: string;

pendingTaxiData!: Taxi;
isSending = false;
isUpdating = false;

  TaxiStatus = TaxiStatus;
  PhoneType = PhoneType;
  page = 0;
  size = 10;
  taxis: Taxi[] = [];
  filteredTaxis: Taxi[] = [];
  selectedTaxi: Taxi | null = null;

  
  isLoading = false;
  searchTerm = '';
  statusFilter: TaxiStatus | '' = '';
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;
  itemsPerPage = 25;
  pages: number[] = []; // 👈 Added for pagination display
isSearching = false;
searchPhone?: string;
searchName?: string;
noResults = false;


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
  isDeletingTaxi = false;

  editingTaxiId: number | null = null;
  verifyForm!: FormGroup;
  passwordTaxiId!: number;
@ViewChild('confirmationCodeModal') confirmationCodeModal!: any;
@ViewChild('changePasswordModal1') changePasswordModal1!: any;
@ViewChild('changePasswordModal2') changePasswordModal2!: any;

  token!: string; // the reset token you must set before opening modal
showNewPassword = false;
showConfirmPassword = false;
showToast = false;
toastMessage = '';
deleteTaxiModalRef!: NgbModalRef;
addEditModalRef!: NgbModalRef;
passwordModalRef!: NgbModalRef;

toastType: 'success' | 'danger' | 'warning' = 'warning';
  constructor(
    private modalService: NgbModal,
    private taxiService: TaxiService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private router: Router
    
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
  code1: ['', Validators.required],
  code2: ['', Validators.required],
  code3: ['', Validators.required],
  code4: ['', Validators.required]
});


    this.verifyForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  numTel: ['', Validators.required]
});

  }
  // Open the password change modal
  /*openChangePasswordModal(content: any) {
    this.modalService.open(content, { size: 'lg' });
  }*/
    // Password match validator
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }




    // This method will be triggered when the password form is submitted
submitPasswordChange() {
  if (this.passwordForm.invalid || !this.resetToken) return;

  const payload = {
    password: this.passwordForm.value.newPassword
  };

  this.taxiService.resetPassword(this.resetToken, payload).subscribe({
    next: () => {
      this.modalService.dismissAll();
      this.passwordForm.reset();
      this.confirmationForm.reset();
      alert('Mot de passe changé avec succès');
    },
    error: err => {
      console.error('Erreur reset mot de passe', err);
      alert('Erreur lors du changement du mot de passe');
    }
  });
}



ngOnInit(): void {

  const savedApp = localStorage.getItem('currentApp');

  if (savedApp) {
    this.currentApp = savedApp as any;

    const url = this.currentApp === 'SMSTaxi'
      ? 'http://41.225.11.231:8777/taxi-client/api'
      : 'http://41.225.11.231:8444/taxi-client/api';

    this.taxiService.setBaseUrl(url);
  }

 
  this.taxiService.appChanged$.subscribe(() => {
    this.currentPage = 1;
    this.searchTerm = '';
    this.isSearching = false;

    this.loadTaxis(1);
  });

  // initial load
  this.loadTaxis(this.currentPage);

  // form init (keep as is)
  this.passwordForm = this.fb.group({
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(40)
      ]
    ],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

}

  /** ✅ Loads taxis and regenerates pagination pages */
  /*loadTaxis(page: number): void {
    this.isLoading = true;
    this.taxiService.getTaxis(page - 1, this.itemsPerPage).subscribe({
      next: (response: PagedTaxisResponse) => {
        this.taxis = response.content;
        this.totalItems = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = page;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1); // 👈 Generate page numbers
        //this.filterTaxis();
        this.updateStatistics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading taxis:', error);
        this.isLoading = false;
      }
    });
  }*/


loadTaxis(page: number = this.currentPage || 1): void {

  this.isLoading = true;

  const pageIndex = page - 1;

  const request$ = this.isSearching
    ? this.taxiService.searchTaxis(
        pageIndex,
        this.itemsPerPage,
        this.searchPhone,
        this.searchName
      )
    : this.taxiService.getTaxis(pageIndex, this.itemsPerPage);

  request$
    .pipe(
      finalize(() => this.isLoading = false) // ⭐ CLEAN
    )
    .subscribe({

      next: (response: PagedTaxisResponse) => {

        console.log('%cTaxis loaded successfully', 'color: green; font-weight:bold;');

        this.taxis = response.content;
        this.totalItems = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = page;

        this.pages = Array.from(
          { length: this.totalPages },
          (_, i) => i + 1
        );

        this.updateStatistics();
      },

      error: err => {
        console.error('Error loading taxis', err);
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

  // ⭐ STORE THE MODAL REF
  this.addEditModalRef = this.modalService.open(content, {
    size: 'lg',
    backdrop: 'static',
    centered: true
  });
}

 openEditModal(content: any, taxi: Taxi): void {
  if (!taxi || !taxi.id) return; // safety check

  this.isEditing = true;
  this.editingTaxiId = taxi.id;
  this.selectedTaxi = taxi;
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
 this.addEditModalRef = this.modalService.open(content, {
  size: 'lg',
  backdrop: 'static',
  centered: true
});

}


/*saveTaxi() {
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
    error: (err) => console.error('Error adding taxi:', err.error)
  });
}*/

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
    contenu: ''
  };

  // =======================
  // ✏️ UPDATE MODE
  // =======================
  if (this.isEditing && this.editingTaxiId) {
    this.updateTaxiAndUser(taxiData);
    return;
  }

  // =======================
  // ➕ CREATE MODE
  // =======================
  this.pendingTaxiData = taxiData;

this.passwordModalRef = this.modalService.open(this.changePasswordModal1, {
  centered: true,
  backdrop: 'static'
});

}

updateTaxiAndUser(taxiData: Taxi) {

  if (this.isUpdating) return;

  this.isUpdating = true;

  console.log('%cStarting taxi + user update...', 'color: orange; font-weight: bold;');
  console.log('Taxi ID:', taxiData.id);

  this.taxiService.updateTaxiAndUser(taxiData).pipe(

    finalize(() => {
      this.isUpdating = false;
      console.log('%cUpdate request finished.', 'color: gray; font-weight: bold;');
    })

  ).subscribe({

    // ✅ ===== SUCCESS (200) =====
    next: ({ taxi, user }) => {

      console.log('%c✅ 200 - Taxi updated', 'color: green; font-weight: bold;');
      console.log('Updated taxi:', taxi);

      console.log('%c✅ User updated', 'color: green; font-weight: bold;');
      console.log('Updated user:', user);

      this.toastr.success(
        'Le taxi et le compte utilisateur ont été mis à jour.',
        'Modification réussie'
      );

      // ⭐ Close ONLY edit modal
      this.addEditModalRef?.close();

      this.loadTaxis(this.currentPage);

      this.isEditing = false;
      this.editingTaxiId = null;
      this.taxiForm.reset();
    },

    // ❌ ===== ERRORS =====
    error: (err) => {

      console.error('%c❌ UPDATE FAILED', 'color: red; font-weight: bold;');
      console.error('Status:', err.status);
      console.error('Backend message:', err.error?.message);
      console.error('Full error:', err);

      const backendMessage =
        err.error?.message || 'Une erreur inattendue est survenue.';

      switch (err.status) {

        // ⭐ 404
        case 404:
          this.toastr.error(
            backendMessage || 'Taxi introuvable.',
            'Introuvable'
          );
          break;

        // ⭐ 400
        case 400:
          this.toastr.warning(
            backendMessage,
            'Requête invalide'
          );
          break;

        // ⭐ 500
        case 500:
          this.toastr.error(
            'Erreur interne du serveur. Veuillez réessayer.',
            'Erreur serveur'
          );
          break;

        default:
          this.toastr.error(
            backendMessage,
            'Modification échouée'
          );
      }
    }
  });
}

  /*deleteTaxi(taxiId: number): void {
    if (confirm('Are you sure you want to delete this taxi?')) {
      this.taxiService.deleteTaxi(taxiId).subscribe({
        next: () => this.loadTaxis(this.currentPage),
        error: (err) => console.error('Error deleting taxi:', err)
      });
    }
  }
*/
confirmDelete() {

  if (this.isDeletingTaxi) return;

  this.isDeletingTaxi = true;

  console.log('%cStarting taxi delete...', 'color: orange; font-weight: bold;');
  console.log('Taxi ID:', this.selectedTaxiId);

  this.taxiService.deleteTaxi(this.selectedTaxiId).pipe(

    switchMap(() =>
      this.taxiService.deleteAccount(this.selectedTaxiPhone)
    ),

    finalize(() => {
      this.isDeletingTaxi = false;
      console.log('%cDelete request finished.', 'color: gray; font-weight: bold;');
    })

  ).subscribe({

    // ✅ ===== 200 SUCCESS =====
    next: (res) => {

      console.log('%c✅ 200 - Taxi deleted', 'color: green; font-weight: bold;');
      console.log('Response:', res);

      // 🔴 Red toast is correct for destructive action
      this.toastr.error(
        'Le taxi a été supprimé.',
        'Suppression réussie'
      );

      this.loadTaxis(this.currentPage);
      this.deleteTaxiModalRef.close();
    },

    // ❌ ===== ERRORS =====
    error: (err) => {

      console.error('%c❌ TAXI DELETE FAILED', 'color: red; font-weight: bold;');
      console.error('Status:', err.status);
      console.error('Backend message:', err.error?.message);
      console.error('Full error:', err);

      const backendMessage =
        err.error?.message || 'Une erreur inattendue est survenue.';

      switch (err.status) {

        // ⭐ 400
        case 400:
          this.toastr.warning(
            backendMessage,
            'Requête invalide'
          );
          break;

        // ⭐ 500
        case 500:
          this.toastr.error(
            'Erreur interne du serveur. Veuillez réessayer.',
            'Erreur serveur'
          );
          break;

        default:
          this.toastr.error(
            backendMessage,
            'Suppression échouée'
          );
      }
    }
  });
}

 selectedTaxiId!: number;
  selectedTaxiPhone!: string;

openDeleteModal(content: any, taxiId: number, telephone: string) {

  if (!taxiId) {
    console.error('Taxi ID invalid');
    return;
  }

  this.selectedTaxiId = taxiId;
  this.selectedTaxiPhone = telephone;

  this.deleteTaxiModalRef = this.modalService.open(content, {
    centered: true,
    backdrop: 'static' // prevents closing while deleting
  });
}



isInvalid(controlName: string): boolean {
  const control = this.taxiForm.get(controlName);
  return !!(control && control.invalid && control.touched);
}

taxiStatusList = Object.values(TaxiStatus);
phoneTypeList = Object.values(PhoneType);


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


getStatusBadgeClass(status: TaxiStatus): string {
  switch (status) {
    case TaxiStatus.APPROVED:
      return 'bg-success';
    case TaxiStatus.PENDING:
      return 'bg-warning text-dark';
    case TaxiStatus.REJECTED:
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
}


  getOnlineStatusClass(isOnline: boolean): string {
    return isOnline ? 'text-success' : 'text-secondary';
  }

  async exportData(type: string): Promise<void> {
  if (!this.taxis.length) {
    alert('Aucune donnée à exporter.');
    return;
  }
function translateStatus(status: string): string {
  switch (status) {
    case 'APPROVED': return 'Approuvé';
    case 'REJECTED': return 'Refusé';
    case 'PENDING': return 'En attente';
    default: return status || '';
  }
}
  const data = this.taxis.map(t => ({
    ID: t.id,
    Nom: t.nom || '',
    CIN: t.numeroCin || '',
    Immatriculation: t.numeroMatricule || '',
    'Plaque Taxi': t.numeroTaxi || '',
    Modèle: t.constructeur || '',
    Téléphone: t.telephone || '',
    Statut: translateStatus(t.taxiStatus)
  }));

  switch (type) {
case 'excel': {
  const XLSX = require('xlsx');

  // Prepare worksheet, start data from row 7 to leave space for header
  const ws = XLSX.utils.json_to_sheet(data, { origin: 6 });

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Taxis');

  // ===== Add top-left TAXICHY + legal text =====
  ws['A1'] = { v: 'TAXICHY', s: {
    font: { name: 'Helvetica', sz: 12, bold: true, color: { rgb: '211F54' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  }};
  ws['A2'] = { v: '© SMS TAXI 2025 – service autorisé et conforme à la législation tunisienne', s: {
    font: { name: 'Helvetica', sz: 7, color: { rgb: '211F54' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  }};

  // ===== Centered title "Répertoire des Taxistes Inscrits" =====
  ws['A4'] = { v: 'Répertoire des Taxistes Inscrits', s: {
    font: { name: 'Helvetica', sz: 20, bold: true, color: { rgb: '211F54' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  }};

  // Merge title across all 8 columns (A–H)
  ws['!merges'] = [
    { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } } // row 4 (index 3), columns A-H
  ];

  // ===== Table header styling =====
  const headerRow = 6; // Excel row 7 (0-based index 6)
  const columns = ['A','B','C','D','E','F','G','H'];
  columns.forEach((col, i) => {
    const cellRef = `${col}${headerRow + 1}`;
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '211F54' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
  });

  // ===== Optional: Column widths =====
  ws['!cols'] = [
    { wch: 5 },  // ID
    { wch: 20 }, // Nom et Prénom
    { wch: 15 }, // C.I.N
    { wch: 15 }, // Immatriculation
    { wch: 12 }, // Plaque
    { wch: 15 }, // Modèle
    { wch: 15 }, // Téléphone
    { wch: 12 }  // Statut
  ];

  // Save Excel file
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
      const user = 'Admin'; // replace with dynamic user if needed
      const today = new Date();
      const formattedDate = today.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      const logo = await this.loadImageBase64('assets/logoY2.png');

      const doc = new jsPDF();

      const logoWidth = 80;
const logoHeight = 30;
const pageWidth = doc.internal.pageSize.getWidth();
const logoX = (pageWidth - logoWidth) / 2;

doc.setFont('helvetica', 'bold');
doc.setFontSize(7);         // smaller font for tight spacing
doc.setTextColor(33, 31, 84);
doc.text('TAXICHY – © SMS TAXI 2025, service autorisé et conforme à la législation tunisienne', 10, 8); // X=10, Y=8 (close to top)

      // Add logo
      doc.addImage(logo, 'PNG', logoX, 10, 90, 0);
// X, Y, width, height

      // Add title
doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
doc.text('Répertoire des Taxistes Inscrits', pageWidth / 2, 45, { align: 'center' });

// underline
doc.setDrawColor(33, 31, 84); // same brand color
doc.setLineWidth(0.5);
doc.line(60, 48, pageWidth - 60, 48);


      // Prepare table data
      const tableBody = data.map(t => [
        t.ID, t.Nom, t.CIN, t.Immatriculation, t['Plaque Taxi'], t.Modèle, t.Téléphone, t.Statut
      ]);

      // Add table using autoTable (your existing style)
      autoTable(doc, {
  head: [[
    'ID',
    'Nom et Prénom',
    'C.I.N',
    'Immatriculation',
    'Plaque',
    'Modèle',
    'Téléphone',
    'Statut'
  ]],
body: tableBody as any,
  startY: 50,
  theme: 'grid',
  headStyles: {
    fillColor: [33, 31, 84], // #211F54
    textColor: 255,
    halign: 'center',   // horizontal center
    valign: 'middle',  // vertical center (optional)
    fontStyle: 'bold'  // optional, looks nicer for headers
  }
});


const pageCount = doc.getNumberOfPages();

for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(120);

  // Left footer: exported page info
  doc.text(
    `Pages : ${this.currentPage} / ${this.totalPages}`,
    14,
    pageHeight - 10
  );

  // Right footer: PDF page number
  doc.text(
    `Page ${i} / ${pageCount}`,
    pageWidth - 14,
    pageHeight - 10,
    { align: 'right' }
  );
}
      doc.save('taxis.pdf');
      break;
    }

    default:
      console.error('Type d’export inconnu :', type);
  }
}

// Reuse your helper to load logo as Base64



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
/*
async printDetails() {
  if (!this.selectedTaxi) return;
  const taxi = this.selectedTaxi;
  const user = 'Admin';
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const logo = await this.loadImageBase64('assets/logoY2.png');

  const statusText = this.getStatusFrench(taxi.taxiStatus);
  const statusColor = this.getStatusColor(taxi.taxiStatus);

  const docDefinition: any = {
    pageMargins: [40, 60, 40, 60],
    content: [
      { image: logo, width: 180, alignment: 'center', margin: [0, 0, 0, 20] },

      // Title + badge on same line
      {
        columns: [
          { text: 'Détails du Taxi', style: 'title', alignment: 'left' },
          {
            table: {
              widths: ['auto'],
              body: [[{ text: statusText, style: 'badgeText' }]]
            },
            layout: {
              fillColor: statusColor,
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingTop: () => 2,
              paddingBottom: () => 2,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              hLineColor: () => statusColor,
              vLineColor: () => statusColor
            },
            alignment: 'right',
            margin: [0, 4, 0, 0]
          }
        ],
        columnGap: 10,
        margin: [0, 0, 0, 15]
      },

      { text: `Identifiant : ${taxi.id}`, bold: true, margin: [0, 0, 0, 10] },

      // Table with details
      {
        table: {
          widths: ['35%', '65%'],
          body: [
            [
              { text: 'Nom et Prénom :', bold: true }, 
              {
                columns: [
                  { text: taxi.nom, width: '*', style: 'value' },
                  {
                    stack: [{ text: statusText, style: 'badgeText', alignment: 'center', margin: [0,2,0,2] }],
                    width: 'auto',
                    alignment: 'right',
                    canvas: [{ type: 'rect', x:0, y:-2, w:70, h:16, r:8, color: statusColor }]
                  }
                ]
              }
            ],
            [{ text: 'Carte d\'identité :', bold: true }, taxi.numeroCin],
            [{ text: 'Immatriculation :', bold: true }, taxi.numeroMatricule],
            [{ text: 'Plaque taxi :', bold: true }, taxi.numeroTaxi],
            [{ text: 'Modèle de fabrication :', bold: true }, taxi.constructeur],
            [{ text: 'Téléphone :', bold: true }, taxi.telephone],
            [{ text: 'Adresse Email :', bold: true }, taxi.email]
          ]
        },
        layout: {
          fillColor: (rowIndex: number) => rowIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FA',
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 12,
          paddingRight: () => 12,
          paddingTop: () => 10,
          paddingBottom: () => 10,
        },
        margin: [0, 0, 0, 20],
        fillColor: '#f8f9fa'
      }
    ],

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `${formattedDate}`, alignment: 'left', margin: [40, 0] },
        { text: `${user} | Page ${currentPage} / ${pageCount}`, alignment: 'right', margin: [0,0,40,0] }
      ],
      fontSize: 9,
      color: '#6C757D'
    }),

    styles: {
      title: { fontSize: 18, bold: true, color: '#212529' },
      badgeText: { fontSize: 10, bold: true, color: '#FFFFFF' },
      label: { bold: true, color: '#495057' },
      value: { color: '#212529' }
    },

    defaultStyle: { fontSize: 11 }
  };

  // <-- Change here from download() to print()
  pdfMake.createPdf(docDefinition).print();
}
*/

async downloadDetailsPDF() {
  if (!this.selectedTaxi) return;
  const taxi = this.selectedTaxi;
  const user = 'Admin';
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const logo = await this.loadImageBase64('assets/logoY2.png');

  const statusText = this.getStatusFrench(taxi.taxiStatus);
  const statusColor = this.getStatusColor(taxi.taxiStatus); // background color
  const statusTextColor = this.getStatusTextColor(taxi.taxiStatus); // text color

  const docDefinition: any = {
    pageMargins: [40, 60, 40, 60],

    content: [
      // Centered Logo
      { image: logo, width: 180, alignment: 'center', margin: [0, 0, 0, 20] },

      // Title
      { text: 'Détails du Taxi', style: 'title', margin: [0, 0, 0, 15] },

      // Identifiant at top-left
      { text: `Identifiant : ${taxi.id}`, bold: true, margin: [0, 0, 0, 10] },

      // Rounded card table with improved style
      {
        table: {
          widths: ['35%', '65%'],
          body: [
            [
              { text: 'Nom et Prénom :', bold: true },
              {
                columns: [
                  { text: taxi.nom, style: 'value', width: '*', alignment: 'left' },
                  {
                    text: statusText,
                    alignment: 'right',
                    style: 'badgeText',
                    color: statusTextColor,
                    fillColor: statusColor,
                    margin: [0, 2, 0, 2],
                    bold: true,
                    fontSize: 10,
                    borderRadius: 8,
                    padding: [4, 2, 4, 2]
                  }
                ]
              }
            ],
            [{ text: 'Carte d\'identité :', bold: true }, taxi.numeroCin],
            [{ text: 'Immatriculation :', bold: true }, taxi.numeroMatricule],
            [{ text: 'Plaque taxi :', bold: true }, taxi.numeroTaxi],
            [{ text: 'Modèle de fabrication :', bold: true }, taxi.constructeur],
            [{ text: 'Téléphone :', bold: true }, taxi.telephone],
            [{ text: 'Adresse Email :', bold: true }, taxi.email]
          ]
        },
        layout: {
          fillColor: (rowIndex: number) => rowIndex === 0 ? '#F8F9FA' : rowIndex % 2 === 0 ? '#FFFFFF' : '#F1F3F5',
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 14,
          paddingRight: () => 14,
          paddingTop: () => 10,
          paddingBottom: () => 10
        },
        margin: [0, 0, 0, 20],
        style: { borderRadius: 8 }
      }
    ],

    // Footer
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `${formattedDate}`, alignment: 'left', margin: [40, 0] },
        { text: `${user} | Page ${currentPage} / ${pageCount}`, alignment: 'right', margin: [0, 0, 40, 0] }
      ],
      fontSize: 9,
      color: '#6C757D'
    }),

    styles: {
      title: { fontSize: 18, bold: true, color: '#212529' },
      badgeText: { bold: true },
      label: { bold: true, color: '#495057' },
      value: { color: '#212529' }
    },

    defaultStyle: { fontSize: 11 }
  };

  pdfMake.createPdf(docDefinition).download(`taxi-${taxi.id}.pdf`);
}

// Map status to French
private getStatusFrench(status: string): string {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return 'Approuvé';
    case 'REJECTED': return 'Rejeté';
    case 'PENDING': return 'En attente';
    default: return 'Inconnu';
  }
}

// Background color for badge
private getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return '#198754';
    case 'REJECTED': return '#DC3545';
    case 'PENDING': return '#FFC107';
    default: return '#000000';
  }
}

// Text color for badge
private getStatusTextColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return '#198754';
    case 'REJECTED': return '#DC3545';
    case 'PENDING': return '#FFC107';
    default: return '#000000';
  }
}

// Load image as Base64
private async loadImageBase64(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/*submitConfirmationCode(modal: any) {
  if (this.confirmationForm.invalid) return;

  const code = Object.values(this.confirmationForm.value).join('');

  this.taxiService.verifyResetCode({
    taxiId: this.passwordTaxiId,
    code
  }).subscribe({
    next: (res) => {
      this.resetToken = res.token; // 🔑 IMPORTANT
      modal.close();
      this.modalService.open(this.changePasswordModal, {
        centered: true,
        backdrop: 'static'
      });
    },
    error: () => alert('Code incorrect')
  });
}
*/

submitConfirmationCode(modal: any) {
  if (this.confirmationForm.invalid) return;

  const token =
    this.confirmationForm.value.code1 +
    this.confirmationForm.value.code2 +
    this.confirmationForm.value.code3 +
    this.confirmationForm.value.code4;

  this.isSending = true;

  this.taxiService.verifyResetCode(token).subscribe({
    next: () => {
      this.isSending = false;

      // ✅ SET TOKEN HERE
      this.token = token;

      modal.close();

      // Open reset password modal
      this.modalService.open(this.changePasswordModal1, {
        centered: true,
        backdrop: 'static'
      });
    },
    error: err => {
      this.isSending = false;
      this.toastMessage = 'Code incorrect ou expiré';
      this.toastType = 'danger';
      this.showToast = true;
    }
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

  if (!taxi.email || !taxi.telephone) {
    this.toastMessage = 'Email ou téléphone manquant';
    this.toastType = 'warning';
    this.showToast = true;
    return;
  }

  this.verifyForm.reset();

  this.passwordTaxiId = taxi.id!;

  this.verifyForm.patchValue({
    email: taxi.email,
    numTel: taxi.telephone
  });

  this.modalService.open(content, {
    centered: true,
    backdrop: 'static'
  });
}


/*sendVerificationCode(modal: any) {
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
}*/
sendVerificationCode(modal: any) {
  if (this.verifyForm.invalid) return;

  const payload = {
    email: this.verifyForm.get('email')?.value,
    phone: this.verifyForm.get('numTel')?.value // 👈 mapping here
  };

  this.taxiService.sendPasswordResetCode(payload).subscribe({
    next: () => {
      modal.close();
      this.modalService.open(this.confirmationCodeModal, {
        centered: true,
        backdrop: 'static'
      });
    },
    error: err => {
      console.error('Erreur envoi code', err);
    }
  });
}


thetaxiStatusList = ['pending', 'approved', 'refused'];
getStatusLabel(status: TaxiStatus): string {
  switch (status) {
    case TaxiStatus.APPROVED: return 'Approuvé';
    case TaxiStatus.PENDING: return 'En attente';
    case TaxiStatus.REJECTED: return 'Rejeté';
    default: return status;
  }
}

getTypeLabel(typeTel: PhoneType): string {
  switch (typeTel) {
    case PhoneType.gsm:
      return 'Téléphone classique';
    case PhoneType.smartphone:
      return 'Smartphone';
    default:
      return 'Inconnu';
  }
}
getStatusIconClass(status: TaxiStatus | null): string {
  switch (status) {
    case TaxiStatus.APPROVED:
      return 'text-success';   // bg-success color
    case TaxiStatus.PENDING:
      return 'text-warning';   // bg-warning color
    case TaxiStatus.REJECTED:
      return 'text-danger';    // bg-danger color
    default:
      return 'text-secondary';
  }
}

emailDomains = ['@sms.tn', '@gmail.com', '@hotmail.com', '@yahoo.com'];
filteredDomains: string[] = [];
showDropdown = false;

onEmailInput() {
  const emailControl = this.taxiForm.get('email')!;
  const value = emailControl.value;
  const atIndex = value.indexOf('@');

  if (atIndex === -1) {
    // show all domains if '@' not typed yet
    this.filteredDomains = this.emailDomains;
  } else {
    const typedDomain = value.slice(atIndex);
    this.filteredDomains = this.emailDomains.filter(d => d.startsWith(typedDomain));
  }
}

getInputName(): string {
  const value = this.taxiForm.get('email')!.value;
  const atIndex = value.indexOf('@');
  return atIndex === -1 ? value : value.slice(0, atIndex);
}

selectDomain(domain: string) {
  this.taxiForm.get('email')!.setValue(this.getInputName() + domain);
  this.showDropdown = false;
}

onBlur() {
  // Delay hiding to allow click event to register
  setTimeout(() => this.showDropdown = false, 100);
}

  /*searchTaxis(): void {
    const term = this.searchTerm.trim();

    let phone: string | undefined;
    let name: string | undefined;

    // If only numbers → phone search
    if (/^\d+$/.test(term)) {
      phone = term;
    } else {
      name = term;
    }

    this.taxiService
      .searchTaxis(this.page, this.size, phone, name)
      .subscribe({
        next: (res) => {
          this.taxis = res.content || res; // depends on backend response
        },
        error: (err) => {
          console.error('Search error', err);
        }
      });
  }
*/
clearSearch(): void {
  this.searchTerm = '';
  this.isSearching = false;
  this.searchPhone = undefined;
  this.searchName = undefined;
  this.currentPage = 1;
  this.loadTaxis(this.currentPage);
}

searchTaxis(): void {
  const term = this.searchTerm.trim();

  this.currentPage = 1;
  this.isSearching = !!term;

  this.searchPhone = undefined;
  this.searchName = undefined;

  if (term) {
    if (/^\d+$/.test(term)) {
      this.searchPhone = term;
    } else {
      this.searchName = term;
    }
  }

  this.loadTaxis(1);
}
 

  

  /*passwordMatchValidator(group: FormGroup) {
    const pass = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }*/

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Submit the new password to reset the password
 * @param {any} modal The modal to close when the operation is done
 */
/*******  0d8e3ce2-ff05-451d-aeae-fc44f93daa09  *******/
  submitNewPassword2(modal: any) {
  if (this.passwordForm.invalid) return;

  const payload = {
    password: this.passwordForm.value.newPassword
  };

  this.isSending = true;

  this.taxiService.resetPassword(this.token, payload).subscribe({
    next: () => {
      this.isSending = false;
      modal.close();

      this.toastMessage = 'Mot de passe réinitialisé avec succès !';
      this.toastType = 'success';
      this.showToast = true;

      // ✅ Redirect to login page
      this.router.navigate(['/taxis']); // change '/login' to your actual login route
    },
    error: err => {
      this.isSending = false;
      console.error('Erreur réinitialisation', err);

      this.toastMessage = 'Impossible de réinitialiser le mot de passe';
      this.toastType = 'danger';
      this.showToast = true;
    }
  });
}
submitNewPassword(modal: any) {

  if (this.passwordForm.invalid || this.isSending) return;

  this.isSending = true;

  console.log('%cStarting taxi creation...', 'color: orange; font-weight: bold;');
  console.log('Taxi Data:', this.pendingTaxiData);

  const password = this.passwordForm.value.newPassword;

  this.taxiService.addTaxiWithUser(
    this.pendingTaxiData,
    password
  ).pipe(

    finalize(() => {
      this.isSending = false;
      console.log('%cCreate request finished.', 'color: gray; font-weight: bold;');
    })

  ).subscribe({

    // ✅ ===== 200 SUCCESS =====
    next: (res) => {

      console.log('%c✅ 200 - Taxi created successfully', 'color: green; font-weight: bold;');
      console.log('Response:', res);

      this.toastr.success(
        'Le taxi a été ajouté avec succès.',
        'Création réussie'
      );

       this.passwordModalRef.close();

  // ✅ Close add/edit modal
  this.addEditModalRef.close();

      this.taxiForm.reset();
      this.passwordForm.reset();
      
      this.loadTaxis(this.currentPage);
    },
    

    // ❌ ===== ERRORS =====
    error: (err) => {

      console.error('%c❌ TAXI CREATION FAILED', 'color: red; font-weight: bold;');
      console.error('Status:', err.status);
      console.error('Backend message:', err.error?.message);
      console.error('Full error:', err);

      const backendMessage =
        err.error?.message || 'Une erreur inattendue est survenue.';

      switch (err.status) {

        // ⭐ 400
        case 400:
          this.toastr.warning(
            backendMessage,
            'Requête invalide'
          );
          break;

        // ⭐ 409 (VERY COMMON for create!)
        case 409:
          this.toastr.error(
            backendMessage || 'Ce taxi existe déjà.',
            'Conflit'
          );
          break;

        // ⭐ 500
        case 500:
          this.toastr.error(
            'Erreur interne du serveur. Veuillez réessayer.',
            'Erreur serveur'
          );
          break;

        default:
          this.toastr.error(
            backendMessage,
            'Création échouée'
          );
      }
    }
  });
}

  // Example: open modal after getting token
  openChangePasswordModal(token: string) {
    this.token = token; // set the reset token
    this.passwordForm.reset();
    this.modalService.open(this.changePasswordModal1, {
      centered: true,
      backdrop: 'static'
    });
  }
  
  get passwordLength(): number {
  return this.passwordForm.get('newPassword')?.value?.length || 0;
}
useDefaultEmail() {
  this.verifyForm.get('email')?.setValue('kais.fahem@smstaxi.tn');
}


/*toggleApp(event: any) {

  const isChecked = event.target.checked;

  this.currentApp = isChecked ? 'SMSTaxi' : 'SMSselect';

  const url = isChecked
    ? 'http://41.225.11.231:2000/taxi-client/api'
    : 'http://41.225.11.231:1000/taxi-client/api';


  this.taxiService.setBaseUrl(url);

  
  localStorage.setItem('currentApp', this.currentApp);

  this.currentPage = 1;
  this.isSearching = false;
  this.searchTerm = '';

 
  this.loadTaxis(1);

  console.log('%cSwitched to: ' + this.currentApp, 'color: blue; font-weight:bold;');
}
*/
}



  


