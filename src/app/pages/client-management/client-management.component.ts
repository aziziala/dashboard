import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import { Client, ClientRide, RideStatus,PhoneType } from '../../models/client.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { switchMap,tap,finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';




declare var require: any;

const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');

pdfMake.vfs = pdfFonts.vfs;
@Component({
  selector: 'app-client-management',
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.scss']
})
export class ClientManagementComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  paginatedClients: Client[] = [];
  selectedClient: Client | null = null;
  isLoading = false;
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  isEditing = false;
  editingClientId: number | null = null;
  pendingClientData!: Client;
  passwordForm: FormGroup;
  showNewPassword = false;
  showConfirmPassword = false;
  isSending = false;
  isSearching = false;
searchPhone?: string;
searchName?: string;
phoneTypeList = Object.values(PhoneType);
isDeleting = false;
deleteModalRef!: NgbModalRef;
private searchSubject = new Subject<string>();
clientPasswordModalRef?: NgbModalRef;
addClientModalRef?: NgbModalRef;
isUpdating = false;

  clientStats = {
    total: 0,
    online: 0,
    offline: 0
  };



  @ViewChild('changePasswordModal') changePasswordModal!: any;
  // Make Math available in template
  Math = Math;
  
clientForm!: FormGroup;

  constructor(
    private modalService: NgbModal,
    private clientService: ClientService,
    private toastr: ToastrService,
    private fb: FormBuilder,
  ) { 
       this.clientForm = this.fb.group({
             nomPrenom: ['', Validators.required],
             numTel: ['', Validators.required],
             type: [PhoneType.gsm, Validators.required],
             email: ['', [Validators.email]],           
           });
  }

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Initialises the component after Angular first displays the data-bound properties.
 * It initialises the client form with the required fields: nomPrenom, telephone and email.
 */
/*******  dd904800-324d-4d2f-b91e-e0974173e467  *******/
  ngOnInit(): void {
    this.loadClients();

    this.clientForm = this.fb.group({
    nomPrenom: ['', Validators.required],
    telephone: ['', Validators.required],
    type: [null, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    
  });
   this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { 
      validator: this.passwordMatchValidator 
    });

    this.searchSubject.pipe(
    debounceTime(400),          // ⭐ sweet spot
    distinctUntilChanged()      // prevents duplicate searches
  ).subscribe(term => {
    this.performSearch(term);
  });
  }

  loadClients(page: number = 1): void {
    this.isLoading = true;

    
    this.clientService.getAllClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.filteredClients = clients;
        this.totalItems = clients.length;
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.isLoading = false;
      }
    });
  }

  filterClients(): void {
    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !this.searchTerm || 
        client.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.prenom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.telephone?.includes(this.searchTerm) ||
        client.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || client.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    this.totalItems = this.filteredClients.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedClients = this.filteredClients.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= Math.ceil(this.totalItems / this.itemsPerPage)) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  openViewModal(modal: any, client: Client): void {
    this.selectedClient = client;
    this.modalService.open(modal, { size: 'lg' });
  }
/**
 * Called when the client is deleted successfully.
 * Reloads the clients list.
 */

  
  /*deleteClient(id: number): void {
    if (confirm('Are you sure you want to delete this client?')) {
      this.clientService.deleteClient(id).subscribe({
        next: () => {
          this.loadClients();
        },
        error: (error) => {
          console.error('Error deleting client:', error);
        }
      });
    }
  }
*/

  /*deleteClient(clientId: number): void {
    if (confirm('Are you sure you want to delete this client?')) {
      this.clientService.deleteClient(clientId).subscribe({
        next: () => this.loadClients(),
        error: (err) => console.error('Error deleting client:', err)
      });
    }
  }*/


/*getStatusBadgeClass(etat?: string): string {
  switch (etat) {
    case 'WAITING':
      return 'bg-warning';

    case 'IN_PROGRESS':
      return 'bg-primary';

    case 'EXPIRED':
      return 'bg-secondary';

    case 'CANCELLED':
      return 'bg-danger';

    case 'TERMINATED':
      return 'bg-dark';

    default:
      return 'bg-light text-dark';
  }
}


clientEtatList: string[] = ['WAITING', 'IN_PROGRESS', 'EXPIRED', 'CANCELLED'];
*/
/*getStatusLabel(etat?: string): string {
  switch (etat) {
    case 'WAITING':
      return 'En attente';

    case 'IN_PROGRESS':
      return 'En cours';

    case 'EXPIRED':
      return 'Expiré';

    case 'CANCELLED':
      return 'Annulé';

    case 'TERMINATED':
      return 'Terminé';

    default:
      return etat || '';
  }
}
*/

 saveClient() {

  if (this.clientForm.invalid) {
    this.clientForm.markAllAsTouched();
    return;
  }

  const clientData: Client = {
    id: this.editingClientId || 0,
    nom: this.clientForm.value.nomPrenom,
    email: this.clientForm.value.email,
    type: this.clientForm.value.type,
    telephone: this.clientForm.value.telephone,
  };

  // =======================
  // ✏️ UPDATE MODE
  // =======================
  if (this.isEditing && this.editingClientId) {
    this.updateClient(clientData);
    return;
  }

  // =======================
  // ➕ CREATE MODE
  // =======================
  this.pendingClientData = clientData;

  console.log('%cOpening password modal for client creation...',
    'color: orange; font-weight: bold;');

  this.clientPasswordModalRef = this.modalService.open(
    this.changePasswordModal,
    {
      centered: true,
      backdrop: 'static'
    }
  );
}

openAddModal(content: any) {
  this.isEditing = false;
  this.clientForm.reset();
  this.addClientModalRef = this.modalService.open(content, {
  size: 'lg',
  backdrop: 'static',
  centered: true
});

}

openEditModal(content: any, client: Client): void {
  if (!client || !client.id) return; // safety check

  this.isEditing = true;
  this.editingClientId = client.id;
  this.selectedClient = client;
  // Patch form values from selected client
  this.clientForm.patchValue({
    nomPrenom: client.nom,
    telephone: client.telephone,
    type: client.type,
    email: client.email,
    
  });

  // Open modal
  this.addClientModalRef = this.modalService.open(
  content,
  { size: 'lg', backdrop: 'static' }
);

}

isCreatingClient = false;

submitClientPassword(modal: any) {

  if (this.passwordForm.invalid || this.isCreatingClient) return;

  this.isCreatingClient = true;

  console.log('%cStarting client creation...',
    'color: orange; font-weight: bold;');

  console.log('Client data:', this.pendingClientData);

  const password = this.passwordForm.value.newPassword;

  this.clientService.addClientWithUser(
    this.pendingClientData,
    password
  ).pipe(

    finalize(() => {
      this.isCreatingClient = false;
      console.log('%cCreate request finished.',
        'color: gray; font-weight: bold;');
    })

  ).subscribe({

    // ✅ SUCCESS
    next: () => {

  this.toastr.success(
    'Le client a été ajouté avec succès.',
    'Création réussie'
  );

  // close password modal
  this.clientPasswordModalRef?.close();

  // ⭐ CLOSE ADD CLIENT MODAL
  this.addClientModalRef?.close();

  this.clientForm.reset();
  this.passwordForm.reset();

  this.loadClients(this.currentPage);
}
,

    // ❌ ERRORS
    error: (err) => {

      console.error('%c❌ CLIENT CREATION FAILED',
        'color: red; font-weight: bold;');
      console.error('Status:', err.status);
      console.error('Backend message:', err.error?.message);

      const message =
        err.error?.message || 'Une erreur inattendue est survenue.';

      switch (err.status) {

        case 400:
          this.toastr.warning(message, 'Requête invalide');
          break;

        case 409:
          this.toastr.error(
            message || 'Ce client existe déjà.',
            'Conflit'
          );
          break;

        case 500:
          this.toastr.error(
            'Erreur interne du serveur.',
            'Erreur serveur'
          );
          break;

        default:
          this.toastr.error(message, 'Création échouée');
      }
    }
  });
}

isInvalid(controlName: string): boolean {
  const control = this.clientForm.get(controlName);
  return !!(control && control.invalid && control.touched);
}


emailDomains = ['@sms.tn', '@gmail.com', '@hotmail.com', '@yahoo.com'];
filteredDomains: string[] = [];
showDropdown = false;

onEmailInput() {
  const emailControl = this.clientForm.get('email')!;
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

onBlur() {
  // Delay hiding to allow click event to register
  setTimeout(() => this.showDropdown = false, 100);
}

selectDomain(domain: string) {
  this.clientForm.get('email')!.setValue(this.getInputName() + domain);
  this.showDropdown = false;
}
getInputName(): string {
  const value = this.clientForm.get('email')!.value;
  const atIndex = value.indexOf('@');
  return atIndex === -1 ? value : value.slice(0, atIndex);
}

  get passwordLength(): number {
  return this.passwordForm.get('newPassword')?.value?.length || 0;
}

updateClient(clientData: Client) {

  if (this.isUpdating) return;

  this.isUpdating = true;

  console.log('%cStarting client + user update...',
    'color: orange; font-weight: bold;');
  console.log('Client ID:', clientData.id);

  this.clientService.updateClient(clientData).pipe(

    finalize(() => {
      this.isUpdating = false;
      console.log('%cUpdate request finished.',
        'color: gray; font-weight: bold;');
    })

  ).subscribe({

    // ✅ ===== SUCCESS =====
    next: ({ client, user }) => {

      console.log('%c✅ 200 - Client updated',
        'color: green; font-weight: bold;');
      console.log('Updated client:', client);

      console.log('%c✅ User updated',
        'color: green; font-weight: bold;');
      console.log('Updated user:', user);

      this.toastr.success(
        'Le client et le compte utilisateur ont été mis à jour.',
        'Modification réussie'
      );

      // ⭐ Close ONLY edit modal
      this.addClientModalRef?.close();

      this.loadClients(this.currentPage);

      this.isEditing = false;
      this.editingClientId = null;

      this.clientForm.reset();
    },

    // ❌ ===== ERRORS =====
    error: (err) => {

      console.error('%c❌ CLIENT UPDATE FAILED',
        'color: red; font-weight: bold;');
      console.error('Status:', err.status);
      console.error('Backend message:', err.error?.message);
      console.error('Full error:', err);

      const backendMessage =
        err.error?.message || 'Une erreur inattendue est survenue.';

      switch (err.status) {

        // ⭐ 404
        case 404:
          this.toastr.error(
            backendMessage || 'Client introuvable.',
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

        // ⭐ 409 (VERY important for updates)
        case 409:
          this.toastr.error(
            backendMessage || 'Conflit de données.',
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
            'Modification échouée'
          );
      }
    }
  });
}


  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

selectedClientId!: number;
  selectedClientPhone!: string;
  
  confirmDelete() {

  if (this.isDeleting) return;

  this.isDeleting = true;

  console.log('%cStarting client delete...', 'color: orange; font-weight: bold;');
  console.log('Client ID:', this.selectedClientId);

  this.clientService.deleteClient(this.selectedClientId).pipe(

    switchMap(() =>
      this.clientService.deleteAccount(this.selectedClientPhone)
    ),

    finalize(() => {
      this.isDeleting = false;
      console.log('%cDelete request finished.', 'color: gray; font-weight: bold;');
    })

  ).subscribe({

    // ✅ ===== 200 SUCCESS =====
    next: (res) => {

      console.log('%c✅ 200 - Client deleted', 'color: green; font-weight: bold;');
      console.log('Response:', res);

      this.toastr.success(
        'Le client a été supprimé.',
        'Suppression réussie'
      );

      this.loadClients();
      this.deleteModalRef.close();
    },

    // ❌ ===== ERRORS =====
    error: (err) => {

      console.error('%c❌ DELETE FAILED', 'color: red; font-weight: bold;');
      console.error('Status:', err.status);
      console.error('Backend message:', err.error?.message);
      console.error('Full error:', err);

      switch (err.status) {

        // ⭐ 400
        case 400:
          this.toastr.warning(
            err.error?.message || 'Requête invalide (ID incorrect).',
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
            err.error?.message || 'La suppression a échoué.',
            'Erreur'
          );
      }
    }
  });
}



openDeleteModal(modal: any, client: Client) {

  this.selectedClient = client;
  this.selectedClientId = client.id!;
  this.selectedClientPhone = client.telephone!;

  this.deleteModalRef = this.modalService.open(modal, {
    centered: true,
    backdrop: 'static' // optional but VERY professional
  });
}




 async exportData(type: string): Promise<void> {
  if (!this.clients.length) {
    alert('Aucune donnée à exporter.');
    return;
  }
  const data = this.clients.map(t => ({
    ID: t.id,
    Nom: t.nom || '',
    Téléphone: t.telephone || '',
    Email: t.email || '',
  }));

  switch (type) {
case 'excel': {
  const XLSX = require('xlsx');

  // Prepare worksheet, start data from row 7 to leave space for header
  const ws = XLSX.utils.json_to_sheet(data, { origin: 6 });

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');

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
  ws['A4'] = { v: 'Répertoire des Clients Inscrits', s: {
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
    { wch: 20 }, 
    { wch: 15 }, // Téléphone
    { wch: 12 }  // Statut
  ];

  // Save Excel file
  XLSX.writeFile(wb, 'clients.xlsx');
  break;
}


    case 'csv': {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'clients.csv';
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
doc.text('Répertoire des Clients Inscrits', pageWidth / 2, 45, { align: 'center' });

// underline
doc.setDrawColor(33, 31, 84); // same brand color
doc.setLineWidth(0.5);
doc.line(60, 48, pageWidth - 60, 48);


      // Prepare table data
      const tableBody = data.map(t => [
        t.ID, t.Nom,t.Email, t.Téléphone
      ]);

      // Add table using autoTable (your existing style)
      autoTable(doc, {
  head: [[
    'ID',
    'Nom et Prénom',
    'Email',
    'Téléphone',
  ]],
  body: tableBody,
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
      doc.save('clients.pdf');
      break;
    }

    default:
      console.error('Type d’export inconnu :', type);
  }
}

private async loadImageBase64(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

 


getTypeLabel(type: string): string {
  switch (type) {
    case PhoneType.gsm:
      return 'GSM (Téléphone classique)';
    case PhoneType.smartphone:
      return 'Smartphone';
    default:
      return type;
  }
}

searchClients(): void {
  this.searchSubject.next(this.searchTerm);
}


performSearch(term: string): void {

  const value = term.trim();

  this.currentPage = 1;
  this.isSearching = !!value;

  this.searchPhone = undefined;
  this.searchName = undefined;

  if (value) {
    if (/^\d+$/.test(value)) {
      this.searchPhone = value;
    } else {
      this.searchName = value;
    }
  }

  this.loadClients(1);
}

clearSearch(): void {
  this.searchTerm = '';
  this.isSearching = false;
  this.searchPhone = undefined;
  this.searchName = undefined;
  this.currentPage = 1;
  this.loadClients(this.currentPage);
}

}


