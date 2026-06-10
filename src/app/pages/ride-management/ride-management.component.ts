
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as L from 'leaflet';
import { RideService } from '../../services/ride.service';

@Component({
  selector: 'app-ride-management',
  templateUrl: './ride-management.component.html',
  styleUrls: ['./ride-management.component.scss']
})
export class RideManagementComponent implements OnInit {

  // ═════════════════════════════════════
  // FILTERS
  // ═════════════════════════════════════
Math = Math;
  searchTerm = '';

  statusFilter = '';

  dateFrom = '';

  dateTo = '';

  // ═════════════════════════════════════
  // DATA
  // ═════════════════════════════════════

  rideRequests: any[] = [];

  // ═════════════════════════════════════
  // PAGINATION
  // ═════════════════════════════════════

  currentPage = 1;

  itemsPerPage = 10;

  totalItems = 0;

  // ═════════════════════════════════════
  // LOADING
  // ═════════════════════════════════════

  isLoading = false;

  isTrajectoryLoading = false;

  // ═════════════════════════════════════
  // TRAJECTORIES
  // ═════════════════════════════════════

  selectedRide: any = null;

  trajectoryGeoJson: any = null;

  trajectorySummary: any = null;

  // ═════════════════════════════════════
  // STATISTICS
  // ═════════════════════════════════════

  rideStats: any = null;
map: any;
trajectoryError = '';
trajectoryLayer: any;

  constructor(
    private modalService: NgbModal,
    private rideService: RideService
  ) {}

  // ═════════════════════════════════════
  // INIT
  // ═════════════════════════════════════

  ngOnInit(): void {

    this.loadRides();

    this.loadStatistics();
  }

  // ═════════════════════════════════════
  // LOAD RIDES
  // ═════════════════════════════════════

  loadRides(): void {

    this.isLoading = true;

    this.rideService.getOffersPage(

      this.currentPage - 1,

      this.itemsPerPage,

      {
        status: this.statusFilter,
        search: this.searchTerm,
        dateFrom: this.dateFrom,
        dateTo: this.dateTo
      }

    ).subscribe({

      next: (response: any) => {

        console.log(
          'FULL OFFERS RESPONSE:',
          response
        );

        // BACKEND RESPONSE PARSING
        if (Array.isArray(response)) {

  this.rideRequests = response;

  this.totalItems = response.length;
} else if (
          response?.data &&
          Array.isArray(response.data)
        ) {

          this.rideRequests =
            response.data;

        } else if (
          response?.data?.content
        ) {

          this.rideRequests =
            response.data.content;

          this.totalItems =
            response.data.totalElements || 0;

        } else if (
          response?.content
        ) {

          this.rideRequests =
            response.content;

          this.totalItems =
            response.totalElements || 0;

        } else {

          this.rideRequests = [];
        }

        console.log(
          'Parsed rides:',
          this.rideRequests
        );

        this.isLoading = false;
      },

      error: (error) => {

        console.error(
          'Error loading offers page:',
          error
        );

        this.rideRequests = [];

        this.isLoading = false;
      }
    });
  }

  // ═════════════════════════════════════
  // STATISTICS
  // ═════════════════════════════════════

  loadStatistics(): void {

    this.rideService
      .getRideStatistics()
      .subscribe({

        next: (stats) => {

          this.rideStats = stats;
        },

        error: (error) => {

          console.error(
            'Error loading statistics:',
            error
          );
        }
      });
  }

  // ═════════════════════════════════════
  // FILTERS
  // ═════════════════════════════════════

  onFiltersChange(): void {

    this.currentPage = 1;

    this.loadRides();
  }

  // ═════════════════════════════════════
  // PAGINATION
  // ═════════════════════════════════════

onPageChange(page: number): void {

  const totalPages =
    Math.ceil(
      this.totalItems /
      this.itemsPerPage
    );

  if (
    page < 1 ||
    page > totalPages
  ) {
    return;
  }

  this.currentPage = page;

  this.loadRides();
}

  // ═════════════════════════════════════
  // COMPUTED UI DATA
  // ═════════════════════════════════════

  get rides(): any[] {

    return (this.rideRequests || []).map(
      (ride: any) => {

        const clientName =
          ride.client?.name ||
          'Client inconnu';

        const taxiName =
          ride.taxi?.name ||
          'Taxi inconnu';

        return {

          id: ride.id,

          raw: ride,

          date: ride.dateDepot
            ? new Date(ride.dateDepot)
                .toLocaleDateString()
            : '--',

          time: ride.dateDepot
            ? new Date(ride.dateDepot)
                .toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
            : '--',

          client: clientName,

          clientPhone:
            ride.client?.phoneNumber ||
            '--',

          clientInitials:
            this.getInitials(clientName),

          taxi: taxiName,

          plate:
            ride.taxi?.phoneNumber ||
            '--',

          depart:
            ride.locationHistory ||
            'Départ',

          destination:
            ride.destinationHistory ||
            'Destination',

          duration:
            ride.duration || '--',

          price:
            ride.realPrice ||
            ride.totalPrice ||
            0,

          taxiId:
            ride.taxiId ||
            ride.taxi?.id,

          status:
            this.mapRideStatus(
              ride.etat
            )
        };
      }
    );
  }

  // ═════════════════════════════════════
  // TRAJECTORIES
  // ═════════════════════════════════════

viewTrajectory(ride: any): void {

  // FORCE CLEANUP FIRST
  this.closeTrajectoryModal();

  // WAIT DOM DESTROY
  setTimeout(() => {

    this.selectedRide = ride;

    this.isTrajectoryLoading = true;

    this.trajectoryError = '';

    this.trajectoryGeoJson = null;

    this.trajectorySummary = null;

    this.rideService
      .getRideTrajectory(ride.id)
      .subscribe({

        next: (geoJson: any) => {

          console.log(
            'Trajectory GeoJSON:',
            geoJson
          );

          if (
            !geoJson ||
            !geoJson.features ||
            geoJson.features.length === 0
          ) {

            this.trajectoryError =
              'Aucune trajectoire disponible';

            this.isTrajectoryLoading =
              false;

            return;
          }

          this.trajectoryGeoJson =
            geoJson;

          this.isTrajectoryLoading =
            false;

          // WAIT MODAL RENDER
          setTimeout(() => {

            this.initTrajectoryMap(
              geoJson
            );

          }, 600);

          this.loadTrajectorySummary(
            ride.id
          );
        },

        error: (error) => {

          console.error(
            'Error loading trajectory:',
            error
          );

          this.trajectoryError =
            'Aucune trajectoire disponible';

          this.isTrajectoryLoading =
            false;
        }
      });

  }, 250);
}
  loadTrajectorySummary(
    offreId: number
  ): void {

    this.rideService
      .getRideTrajectorySummary(offreId)
      .subscribe({

        next: (summary) => {

          this.trajectorySummary = summary;

          this.isTrajectoryLoading = false;

          console.log(
            'Trajectory Summary:',
            summary
          );
        },

        error: (error) => {

          console.error(
            'Error loading summary:',
            error
          );

          this.isTrajectoryLoading = false;
        }
      });
  }

  viewLiveTrajectory(
    ride: any
  ): void {

    if (!ride.taxiId) {

      console.error(
        'Taxi ID not found'
      );

      return;
    }



    this.selectedRide = ride;

    this.isTrajectoryLoading = true;

    this.rideService
      .getActiveTaxiTrajectory(
        ride.taxiId
      )
      .subscribe({

        next: (geoJson) => {

          this.trajectoryGeoJson = geoJson;

          this.isTrajectoryLoading = false;

          console.log(
            'Live trajectory:',
            geoJson
          );
        },

        error: (error) => {

          console.error(
            'Error loading live trajectory:',
            error
          );

          this.isTrajectoryLoading = false;
        }
      });
  }



  // ═════════════════════════════════════
  // HELPERS
  // ═════════════════════════════════════

  getInitials(name: string): string {

    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  mapRideStatus(status: string): string {

    if (!status) {

      return '--';
    }

    switch (status.toUpperCase()) {

      case 'TERMINATED':
        return 'TERMINE';

      case 'WAITING':
        return 'EN_ATTENTE';

      case 'IN_PROGRESS':
        return 'EN_COURS';

      case 'STARTED':
        return 'DEMARRÉE';

      case 'CANCELLED':
      case 'CANCELLED_BY_CLIENT':
      case 'CANCELLED_BY_TAXI':
        return 'ANNULEE';

      case 'EXPIRED':
        return 'EXPIRÉE';

      default:
        return status;
    }
  }

  closeTrajectoryModal(): void {

  try {

    // REMOVE LAYER
    if (this.trajectoryLayer) {

      this.trajectoryLayer.remove();

      this.trajectoryLayer = null;
    }

    // REMOVE MAP
    if (this.map) {

      this.map.off();

      this.map.remove();

      this.map = null;
    }

  } catch (e) {

    console.error(
      'Cleanup error:',
      e
    );
  }

  // RESET
  this.selectedRide = null;

  this.trajectoryGeoJson = null;

  this.trajectorySummary = null;

  this.trajectoryError = '';

  this.isTrajectoryLoading = false;

  // RESET LEAFLET CONTAINER
  setTimeout(() => {

    const container =
      document.getElementById(
        'trajectoryMap'
      );

    if (container) {

      (container as any)._leaflet_id =
        null;

      container.innerHTML = '';
    }

  }, 50);
}

initTrajectoryMap(
  geoJson: any
): void {

  // GET CONTAINER
  const container =
    document.getElementById(
      'trajectoryMap'
    );

  // CONTAINER NOT FOUND
  if (!container) {

    console.error(
      'Map container not found'
    );

    return;
  }

  // REMOVE OLD MAP
  if (this.map) {

    try {

      this.map.off();

      this.map.remove();

    } catch (e) {

      console.error(
        'Error removing map:',
        e
      );
    }

    this.map = null;
  }

  // REMOVE OLD LAYER
  if (this.trajectoryLayer) {

    try {

      this.trajectoryLayer.remove();

    } catch (e) {

      console.error(
        'Layer remove error:',
        e
      );
    }

    this.trajectoryLayer = null;
  }

  // DESTROY LEAFLET CACHE
  container.innerHTML = '';

  (container as any)._leaflet_id =
    null;

  // FORCE REFLOW
  void container.offsetHeight;

  // CREATE MAP
  this.map = L.map(
    container,
    {
      zoomControl: true,
      preferCanvas: true
    }
  ).setView(
    [36.8065, 10.1815],
    13
  );

  // TILE LAYER
  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; OpenStreetMap'
    }
  ).addTo(this.map);

  // GEOJSON
// EXTRACT COORDINATES
const coordinates: any[] = [];

geoJson.features.forEach(
  (feature: any) => {

    if (
      feature.geometry?.type ===
      'Point'
    ) {

      const coords =
        feature.geometry.coordinates;

      coordinates.push([
        coords[1],
        coords[0]
      ]);
    }
  }
);

// START / END
const startPoint =
  coordinates[0];

const endPoint =
  coordinates[
    coordinates.length - 1
  ];

// MAIN TRAJECTORY
this.trajectoryLayer =
  L.geoJSON(
    geoJson,
    {

      style: {

        color: '#4B4BAF',

        weight: 6,

        opacity: 0.9,

        lineCap: 'round',

        lineJoin: 'round'
      },

      pointToLayer:
        (
          feature: any,
          latlng: any
        ) => {

          return L.circleMarker(
            latlng,
            {

              radius: 5,

              fillColor: '#ffffff',

              color: '#4B4BAF',

              weight: 3,

              opacity: 1,

              fillOpacity: 1
            }
          );
        }
    }
  ).addTo(this.map);

// START MARKER
if (startPoint) {

  const startIcon =
    L.divIcon({

      className:
        'custom-start-marker',

      html: `
        <div class="marker-pin start">
          <i class="fas fa-play"></i>
        </div>
      `,

      iconSize: [34, 34],

      iconAnchor: [17, 34]
    });

  const startMarker =
    L.marker(
      startPoint,
      {
        icon: startIcon
      }
    )
    .addTo(this.map)
    .bindPopup(
      '<b>Départ Client</b>',
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false
      }
    );

  // ALWAYS OPEN
  startMarker.openPopup();
}

// END MARKER
if (
  endPoint &&
  coordinates.length > 1
) {

  const endIcon =
    L.divIcon({

      className:
        'custom-end-marker',

      html: `
        <div class="marker-pin end">
          <i class="fas fa-flag-checkered"></i>
        </div>
      `,

      iconSize: [34, 34],

      iconAnchor: [17, 34]
    });

  const endMarker =
    L.marker(
      endPoint,
      {
        icon: endIcon
      }
    )
    .addTo(this.map)
    .bindPopup(
      '<b>Destination Client</b>',
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false
      }
    );

  // ALWAYS OPEN
  endMarker.openPopup();
}

  // REFRESH MAP
  setTimeout(() => {

    if (this.map) {

      this.map.invalidateSize(
        true
      );
    }

  }, 500);
}


}
