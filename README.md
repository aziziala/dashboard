# SMS Taxi Admin Dashboard

A comprehensive admin dashboard for managing SMS Taxi operations, built with Angular 15 and Bootstrap 5.

## 🚀 Features

### 📊 Dashboard Overview
- Real-time statistics and metrics
- Interactive charts and graphs
- Quick action buttons
- Fleet location monitoring

### 🚗 Taxi Management
- Add, edit, and delete taxis
- Monitor taxi status and location
- Driver information management
- Status updates and notifications

### 📱 SMS Management
- SMS outbound/inbound tracking
- Bulk SMS sending capabilities
- Delivery reports and analytics
- Cost tracking and optimization

### 🗺️ Fleet Management
- Real-time GPS tracking
- Route optimization
- Performance analytics
- Maintenance scheduling

### 📈 Analytics & Reports
- Comprehensive reporting system
- Performance metrics
- Revenue analysis
- Customer insights

## 🏗️ Architecture

### Backend Services Integration
- **SMSout Service** (Port 8091) - SMS operations
- **FleetService** (Port 8080) - Fleet management
- **SMS-Taxi Service** (Port 8084) - Core taxi operations
- **Discovery Server** (Port 8761) - Service discovery
- **API Gateway** (Port 8444) - Central routing

### Frontend Technologies
- **Angular 15** - Frontend framework
- **Bootstrap 5** - UI components
- **Chart.js** - Data visualization
- **ApexCharts** - Advanced charts
- **Font Awesome** - Icons

## 🚀 Getting Started

### Prerequisites
- Node.js 14.x or higher
- npm 6.x or higher
- Angular CLI 15.x

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sms-taxi-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open browser**
   Navigate to `http://localhost:4200`

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Main application pages
│   ├── services/           # API services
│   ├── models/             # Data models and interfaces
│   └── shared/             # Shared utilities and components
├── assets/                 # Static assets
└── environments/           # Environment configurations
```

## 🔧 Configuration

### Environment Variables
- `SMS_TAXI_API_URL` - SMS Taxi service URL
- `SMSOUT_API_URL` - SMSout service URL
- `FLEET_API_URL` - Fleet service URL
- `API_GATEWAY_URL` - API Gateway URL

### API Endpoints
- **Taxi Management**: `/api/taxis/*`
- **SMS Operations**: `/api/sms/*`
- **Fleet Management**: `/api/fleet/*`
- **Analytics**: `/api/analytics/*`

## 🎨 UI/UX Features

### Design Principles
- Modern, clean interface
- Responsive design for all devices
- Intuitive navigation
- Consistent color scheme
- Accessibility compliance

### Color Scheme
- **Primary**: #3498db (Blue)
- **Secondary**: #2c3e50 (Dark Blue)
- **Success**: #27ae60 (Green)
- **Warning**: #f39c12 (Orange)
- **Danger**: #e74c3c (Red)

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interface
- Adaptive layouts

## 🔒 Security Features

- JWT authentication
- Role-based access control
- Secure API communication
- Input validation
- XSS protection

## 📊 Monitoring & Analytics

### Real-time Features
- Live taxi tracking
- SMS delivery status
- Fleet performance metrics
- System health monitoring

### Reporting
- Daily, weekly, monthly reports
- Export capabilities (PDF, Excel)
- Custom date ranges
- Performance comparisons

## 🚀 Deployment

### Docker Support
```bash
# Build Docker image
docker build -t sms-taxi-admin .

# Run container
docker run -p 4200:4200 sms-taxi-admin
```

### Production Build
```bash
# Build optimized version
npm run build:prod

# Deploy to web server
# Copy dist/sms-taxi-admin/* to web root
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added analytics and reporting
- **v1.2.0** - Enhanced fleet management
- **v1.3.0** - Real-time monitoring features

## 📞 Contact

- **Project Manager**: [Your Name]
- **Email**: [your.email@example.com]
- **Phone**: [Your Phone Number]

---

**Built with ❤️ for SMS Taxi Operations** 