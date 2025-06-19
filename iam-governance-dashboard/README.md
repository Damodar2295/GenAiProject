# My IAM Governance Dashboard

An interactive dashboard for the IAM Governance team to visualize and analyze service account data.

## Features

- Interactive data visualization using Recharts
- Real-time filtering and drill-down capabilities
- Responsive design using Material-UI
- State management with Zustand
- Excel data integration
- Loading states and error handling

## Tech Stack

- Next.js 14
- TypeScript
- Material-UI
- Recharts
- Zustand
- XLSX

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Place your Excel data file in the `/public/data` directory
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
  ├── app/                  # Next.js app directory
  ├── components/           # React components
  ├── store/               # Zustand store
  ├── types/               # TypeScript interfaces
  └── utils/               # Utility functions
```

## Data Requirements

The dashboard expects an Excel file with the following columns:
- rcd_added
- sa_active
- sa_isprivileged
- sa_platform
- sa_environment
- sa_requesttype
- sa_password_expiration_interval
- sa_primary_use
- sa_business_justification

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
