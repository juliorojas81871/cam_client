# CAM Database Client

## Description

This project requires building a full-stack web application to normalize and display GSA property data, featuring a relational database, data wrangling for building names, deployment with CI/CD, and a four-page frontend including a filterable building table, an interactive map with Google Maps API street-level views, and two distinct dashboards for owned and leased properties with various data visualizations and charts.
If anyone want see this code, [please click at this link](https://cam-client.vercel.app)
You will need to run the Client side at the same time to make the code fully work. [Here is the link] (https://github.com/juliorojas81871/cam_server)

**Note: This service is hosted on Render's free tier, which may introduce cold starts after periods of inactivity. When a cold start occurs, the server instance needs to spin up, which can take 60–120 seconds before it's ready to handle requests. You may experience a temporary delay during this initialization phase.**


## Features

- **Properties Table** - Filterable and sortable table of all properties
- **Interactive Map** - Google Maps with property markers and Street View
- **Owned Properties Dashboard** - Charts and analytics for owned buildings
- **Leased Properties Dashboard** - Lease analytics and metrics

## Technologies Used

- **React 18** - Frontend framework
- **Material-UI** - UI components and styling
- **Google Maps API** - Interactive mapping
- **Recharts** - Data visualization
- **Jest** - Testing framework
- **Vercel** - Deployment platform

## Steps to get code to run:

1. **Clone the repository:**
```bash
git clone https://github.com/juliorojas81871/cam_client.git
cd cam_client
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file in the project root:
```bash
# API Endpoints (replace with your backend URLs)
REACT_APP_OWNED_API_URL=https://cam-database.onrender.com/api/owned
REACT_APP_LEASES_API_URL=https://cam-database.onrender.com/api/leases

# Google Maps API Key (get from Google Cloud Console)
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

4. **Start the development server:**
```bash
npm start
```

5. **Open your browser:**
Navigate to `http://localhost:3000`

6. **Verify backend connection:**
Make sure your CAM Database Server is running and accessible at the URLs specified in your environment variables.


## Testing

The application includes comprehensive testing with Jest and React Testing Library:

# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

## Example Pic:
![Notes Example Pic](https://raw.githubusercontent.com/juliorojas81871/cam_server/main/public/main.png)