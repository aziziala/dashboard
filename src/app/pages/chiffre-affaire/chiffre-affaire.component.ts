import { Component } from '@angular/core';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-chiffre-affaire',
  templateUrl: './chiffre-affaire.component.html',
  styleUrls: ['./chiffre-affaire.component.scss']
})
export class ChiffreAffaireComponent {

  // ─────────────────────────────────────────────────────────────
  // DATA
  // ─────────────────────────────────────────────────────────────

  taxiEarnings = [
    {
      taxiId: 215594,
      telephone: '50992121',
      nom: 'Garfa Waliid',
      numeroMatricule: '200TU4416',
      numeroCin: '07061213',
      numeroTaxi: '1827 24/01',
      totalCourses: 27,
      totalCompteur: 157.745,
      totalExtrat: 134
    },
    {
      taxiId: 207678,
      telephone: '92007256',
      nom: 'sameh ferchichi',
      numeroMatricule: '123TU8754',
      numeroCin: '09629858',
      numeroTaxi: '1852',
      totalCourses: 13,
      totalCompteur: 73.27,
      totalExtrat: 26
    }
  ];

  sommesTotalCourses = 121;
  sommesTotalCompteur = 1288.772;
  sommesTotalExtrat = 475;
  sommeTotal = 1763.772;

  // ─────────────────────────────────────────────────────────────
  // EXPORT PDF
  // ─────────────────────────────────────────────────────────────

  exportPdf(): void {
    this.generatePdf(this.taxiEarnings);
  }

  private async generatePdf(rows: any[]): Promise<void> {

    const doc = new jsPDF('landscape');

    const pageWidth = doc.internal.pageSize.getWidth();

    // ─────────────────────────────────────────────────────────
    // HEADER
    // ─────────────────────────────────────────────────────────

    doc.setFont('helvetica', 'bold');

    doc.setFontSize(7);

    doc.setTextColor(33, 31, 84);

    doc.text(
      'TAXICHY – © SMS TAXI 2025, service autorisé et conforme à la législation tunisienne',
      10,
      8
    );

    // ─────────────────────────────────────────────────────────
    // LOGO
    // ─────────────────────────────────────────────────────────

    try {

      const logo = await this.loadImageBase64(
        'assets/logoY2.png'
      );

      doc.addImage(
        logo,
        'PNG',
        (pageWidth - 90) / 2,
        10,
        90,
        0
      );

    } catch {
      // logo optional
    }

    // ─────────────────────────────────────────────────────────
    // TITLE
    // ─────────────────────────────────────────────────────────

    doc.setFontSize(20);

    doc.setTextColor(33, 31, 84);

    doc.text(
      "Analyse de l'activité des taxis",
      pageWidth / 2,
      42,
      {
        align: 'center'
      }
    );

    doc.setDrawColor(33, 31, 84);

    doc.line(
      80,
      46,
      pageWidth - 80,
      46
    );

    // ─────────────────────────────────────────────────────────
    // META
    // ─────────────────────────────────────────────────────────

    doc.setFontSize(8);

    doc.setTextColor(100);

    doc.text(
      `Exporté le ${new Date().toLocaleDateString('fr-FR')} • ${rows.length} taxi(s)`,
      pageWidth / 2,
      52,
      {
        align: 'center'
      }
    );

    // ─────────────────────────────────────────────────────────
    // GLOBAL STATS
    // ─────────────────────────────────────────────────────────

    doc.setFontSize(10);

    doc.setTextColor(33, 31, 84);

    doc.text(
      `Total Courses : ${this.sommesTotalCourses}`,
      14,
      62
    );

    doc.text(
      `Compteur : ${this.sommesTotalCompteur.toFixed(3)} DT`,
      80,
      62
    );

    doc.text(
      `Extra : ${this.sommesTotalExtrat.toFixed(3)} DT`,
      150,
      62
    );

    doc.text(
      `Chiffre d'affaire : ${this.sommeTotal.toFixed(3)} DT`,
      220,
      62
    );

    // ─────────────────────────────────────────────────────────
    // TABLE
    // ─────────────────────────────────────────────────────────

    autoTable(doc, {

      startY: 68,

      head: [[
        'ID Taxi',
        'Nom',
        'Téléphone',
        'Matricule',
        'N° Taxi',
        'Courses',
        'Compteur',
        'Extra',
        'Total'
      ]],

      body: rows.map((r: any) => [

        r.taxiId,

        r.nom,

        r.telephone,

        r.numeroMatricule,

        r.numeroTaxi,

        r.totalCourses,

        `${Number(r.totalCompteur).toFixed(3)} DT`,

        `${Number(r.totalExtrat).toFixed(3)} DT`,

        `${(
          Number(r.totalCompteur) +
          Number(r.totalExtrat)
        ).toFixed(3)} DT`

      ]),

      theme: 'grid',

      headStyles: {
        fillColor: [33, 31, 84],
        textColor: 255,
        halign: 'center',
        fontStyle: 'bold'
      },

      alternateRowStyles: {
        fillColor: [245, 245, 255]
      },

      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle'
      },

      columnStyles: {

        0: {
          halign: 'center'
        },

        5: {
          halign: 'center'
        },

        6: {
          halign: 'right'
        },

        7: {
          halign: 'right'
        },

        8: {
          halign: 'right',
          fontStyle: 'bold'
        }

      }

    });

    // ─────────────────────────────────────────────────────────
    // FOOTER
    // ─────────────────────────────────────────────────────────

    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {

      doc.setPage(i);

      const h = doc.internal.pageSize.getHeight();

      doc.setFontSize(8);

      doc.setTextColor(150);

      doc.text(
        `TAXICHY – Analyse de l'activité`,
        14,
        h - 10
      );

      doc.text(
        `Page ${i} / ${pageCount}`,
        pageWidth - 14,
        h - 10,
        {
          align: 'right'
        }
      );
    }

    // ─────────────────────────────────────────────────────────
    // SAVE
    // ─────────────────────────────────────────────────────────

    doc.save(
      `analyse_activite_${this.todaySlug()}.pdf`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  private todaySlug(): string {
    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  private loadImageBase64(path: string): Promise<string> {

    return fetch(path)

      .then(r => r.blob())

      .then(blob =>
        new Promise<string>((resolve, reject) => {

          const reader = new FileReader();

          reader.onload = () =>
            resolve(reader.result as string);

          reader.onerror = reject;

          reader.readAsDataURL(blob);

        })
      );
  }

}