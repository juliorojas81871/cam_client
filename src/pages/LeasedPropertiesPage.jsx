import { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Stack,
  Tooltip as MuiTooltip,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useData } from '../contexts/DataContext';
import { format, parseISO, isValid } from 'date-fns';

const ITEMS_PER_PAGE = 50;

// Helper function to parse Excel serial date
const parseExcelDate = (serial) => {
  if (!serial || isNaN(serial)) return null;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info;
};

// Helper function to format dates consistently
const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  
  let date;
  if (typeof dateValue === 'string') {
    date = parseISO(dateValue);
  } else if (typeof dateValue === 'number') {
    date = parseExcelDate(dateValue);
  } else {
    date = new Date(dateValue);
  }
  
  if (!isValid(date)) return 'N/A';
  return format(date, 'MMM dd, yyyy');
};

// Helper function to get date for calculations
const getDateValue = (dateValue) => {
  if (!dateValue) return null;
  
  let date;
  if (typeof dateValue === 'string') {
    date = parseISO(dateValue);
  } else if (typeof dateValue === 'number') {
    date = parseExcelDate(dateValue);
  } else {
    date = new Date(dateValue);
  }
  
  return isValid(date) ? date : null;
};

const LeasedPropertiesPage = () => {
  const { leases, loading, error } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredLease, setHoveredLease] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter and process lease data
  const processedLeases = useMemo(() => {
    
    // First, let's see what we have without filtering
    const beforeFilter = leases.length;
    
    const filtered = leases.filter(lease => {
      // More flexible filtering - check for any lease identifier and dates
      const hasLeaseId = lease.leaseNumber || lease.id || lease.realPropertyAssetName;
      const hasEffectiveDate = lease.leaseEffectiveDate || lease.effectiveDate || lease.startDate;
      const hasExpirationDate = lease.leaseExpirationDate || lease.expirationDate || lease.endDate;
      
      const result = hasLeaseId && hasEffectiveDate && hasExpirationDate;
      
      return result;
    });
        
    return filtered
      .map((lease, index) => {
        // Use flexible field names
        const effectiveDateField = lease.leaseEffectiveDate || lease.effectiveDate || lease.startDate;
        const expirationDateField = lease.leaseExpirationDate || lease.expirationDate || lease.endDate;
        
        const effectiveDate = getDateValue(effectiveDateField);
        const expirationDate = getDateValue(expirationDateField);
        
        if (!effectiveDate || !expirationDate) {
          // Return a basic lease record even without valid dates
          return {
            id: lease.id || index,
            leaseNumber: lease.leaseNumber || `LEASE-${index}`,
            buildingName: lease.cleanedBuildingName || lease.realPropertyAssetName || lease.buildingName || lease.propertyName || 'Unknown Building',
            city: lease.city || lease.cityName || 'Unknown',
            state: lease.state || lease.stateName || lease.stateCode || 'Unknown',
            effectiveDate: null,
            expirationDate: null,
            effectiveDateFormatted: 'Invalid Date',
            expirationDateFormatted: 'Invalid Date',
            duration: 0,
            daysRemaining: 0,
            isExpired: false,
            isExpiringSoon: false,
            address: `${lease.streetAddress || ''}, ${lease.city || lease.cityName || ''}, ${lease.state || lease.stateName || lease.stateCode || ''} ${lease.zipCode || ''}`.trim(),
            startX: 0,
            endX: 0,
            y: index % 100,
            status: 'No Dates'
          };
        }
        
        const duration = (expirationDate - effectiveDate) / (1000 * 60 * 60 * 24);
        const today = new Date();
        const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
        const isExpired = expirationDate < today;
        const isExpiringSoon = daysRemaining <= 365 && daysRemaining > 0;

        return {
          id: lease.id || index,
          leaseNumber: lease.leaseNumber || `LEASE-${index}`,
          buildingName: lease.cleanedBuildingName || lease.realPropertyAssetName || lease.buildingName || lease.propertyName || 'Unknown Building',
          city: lease.city || lease.cityName || 'Unknown',
          state: lease.state || lease.stateName || lease.stateCode || 'Unknown',
          effectiveDate,
          expirationDate,
          effectiveDateFormatted: formatDate(effectiveDateField),
          expirationDateFormatted: formatDate(expirationDateField),
          duration,
          daysRemaining,
          isExpired,
          isExpiringSoon,
          address: `${lease.streetAddress || ''}, ${lease.city || ''}, ${lease.state || ''} ${lease.zipCode || ''}`.trim(),
          // For Gantt chart positioning
          startX: effectiveDate.getTime(),
          endX: expirationDate.getTime(),
          y: index % 100, // Group in batches for better visualization
          status: isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.effectiveDate - b.effectiveDate); // Sort by start date
  }, [leases]);

  // Filter leases based on search term and status
  const filteredLeases = useMemo(() => {
    let filtered = processedLeases;
    
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lease =>
        lease.buildingName.toLowerCase().includes(term) ||
        lease.city.toLowerCase().includes(term) ||
        lease.state.toLowerCase().includes(term) ||
        lease.leaseNumber.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lease => lease.status === statusFilter);
    }
    
    return filtered;
  }, [processedLeases, searchTerm, statusFilter]);

  // Paginated data for table
  const paginatedLeases = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLeases, currentPage]);

  // Gantt chart data - show same leases as table
  const ganttData = useMemo(() => {
    const displayLeases = paginatedLeases
      .filter(lease => lease.effectiveDate && lease.expirationDate); // Only show leases with valid dates in chart
    
    return displayLeases.map((lease, index) => ({
      id: lease.id,
      x: lease.startX,
      y: index,
      width: lease.endX - lease.startX,
      lease: lease,
      status: lease.status
    }));
  }, [paginatedLeases]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = processedLeases.length;
    const expired = processedLeases.filter(l => l.isExpired).length;
    const expiringSoon = processedLeases.filter(l => l.isExpiringSoon).length;
    const active = total - expired - expiringSoon;

    return { total, expired, expiringSoon, active };
  }, [processedLeases]);

  const totalPages = Math.ceil(filteredLeases.length / ITEMS_PER_PAGE);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Custom Gantt chart component
  const GanttChart = () => {
    // Calculate dynamic date range based on current page data, but fall back to all filtered data for context
    const validPaginatedLeases = paginatedLeases.filter(lease => lease.effectiveDate && lease.expirationDate);
    const validAllLeases = filteredLeases.filter(lease => lease.effectiveDate && lease.expirationDate);
    
    if (validPaginatedLeases.length === 0) {
      return (
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No lease data available for the current page
          </Typography>
        </Box>
      );
    }

    // Use all filtered data for date range to maintain consistent scale across pages
    const allStartDates = validAllLeases.map(lease => lease.effectiveDate.getTime());
    const allEndDates = validAllLeases.map(lease => lease.expirationDate.getTime());
    
    const minDate = Math.min(...allStartDates);
    const maxDate = Math.max(...allEndDates);
    
    // Add some padding to the date range (5% on each side)
    const dateRange = maxDate - minDate;
    const padding = dateRange * 0.05;
    const chartMinDate = minDate - padding;
    const chartMaxDate = maxDate + padding;

    // Generate tick marks every 5 years
    const generateYearTicks = (minDate, maxDate) => {
      const startYear = new Date(minDate).getFullYear();
      const endYear = new Date(maxDate).getFullYear();
      
      // Round start year down to nearest 5, end year up to nearest 5
      const firstTick = Math.floor(startYear / 5) * 5;
      const lastTick = Math.ceil(endYear / 5) * 5;
      
      const ticks = [];
      for (let year = firstTick; year <= lastTick; year += 5) {
        ticks.push(new Date(year, 0, 1).getTime());
      }
      return ticks;
    };

    const customTicks = generateYearTicks(minDate, maxDate);

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          onMouseLeave={() => setHoveredLease(null)}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number"
            dataKey="x"
            scale="time"
            domain={[chartMinDate, chartMaxDate]}
            ticks={customTicks}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            tickFormatter={(timestamp) => {
              return format(new Date(timestamp), 'yyyy');
            }}
          />
          <YAxis 
            type="number"
            dataKey="y"
            hide
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const lease = payload[0].payload.lease;
                return (
                  <Paper sx={{ p: 2, maxWidth: 300 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {lease.buildingName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Location:</strong> {lease.city}, {lease.state}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Lease #:</strong> {lease.leaseNumber}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Start:</strong> {lease.effectiveDateFormatted}
                    </Typography>
                    <Typography variant="body2">
                      <strong>End:</strong> {lease.expirationDateFormatted}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> 
                      <Chip 
                        size="small" 
                        label={lease.status}
                        color={lease.status === 'Expired' ? 'error' : 
                               lease.status === 'Expiring Soon' ? 'warning' : 'success'}
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Paper>
                );
              }
              return null;
            }}
          />
          <Scatter 
            data={ganttData}
            shape={(props) => {
              const { cx, cy, payload } = props;
              const width = Math.max(2, (payload.width / (chartMaxDate - chartMinDate)) * 800);
              const height = 4;
              
              let color = '#4CAF50';
              if (payload.status === 'Expired') color = '#f44336';
              if (payload.status === 'Expiring Soon') color = '#ff9800';

              return (
                <rect
                  x={cx - width/2}
                  y={cy - height/2}
                  width={width}
                  height={height}
                  fill={color}
                  stroke={color}
                  strokeWidth={0.5}
                  opacity={0.8}
                  onMouseEnter={() => setHoveredLease(payload.lease)}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Leased Properties Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Comprehensive lease management and timeline visualization
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Leases
              </Typography>
              <Typography variant="h4" component="div">
                {summaryStats.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Leases
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {summaryStats.active.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Expiring Soon
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {summaryStats.expiringSoon.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Expired
              </Typography>
              <Typography variant="h4" component="div" color="error.main">
                {summaryStats.expired.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Gantt Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lease Terms Timeline (Gantt Chart)
            </Typography>
            
            {/* Timeline Filters */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Expiring Soon">Expiring Soon</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="body2" color="text.secondary">
                {filteredLeases.filter(l => l.effectiveDate && l.expirationDate).length} leases with valid dates
              </Typography>
              
              {/* Date Range Display */}
              {(() => {
                const validLeases = filteredLeases.filter(lease => lease.effectiveDate && lease.expirationDate);
                if (validLeases.length > 0) {
                  const allStartDates = validLeases.map(lease => lease.effectiveDate);
                  const allEndDates = validLeases.map(lease => lease.expirationDate);
                  const earliestStart = new Date(Math.min(...allStartDates));
                  const latestEnd = new Date(Math.max(...allEndDates));
                  
                  return (
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
                      Overall Timeline: {format(earliestStart, 'MMM yyyy')} - {format(latestEnd, 'MMM yyyy')}
                    </Typography>
                  );
                }
                return null;
              })()}
            </Box>
            
            {/* Legend */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 4, bgcolor: '#4CAF50', borderRadius: 1 }} />
                <Typography variant="body2">Active</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 4, bgcolor: '#ff9800', borderRadius: 1 }} />
                <Typography variant="body2">Expiring Soon (≤1 year)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 4, bgcolor: '#f44336', borderRadius: 1 }} />
                <Typography variant="body2">Expired</Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Hover over timeline bars to see building details. Showing the same {paginatedLeases.filter(l => l.effectiveDate && l.expirationDate).length} leases as the table below (Page {currentPage} of {totalPages}).
            </Typography>

            <GanttChart />
          </Paper>
        </Grid>

        {/* Search and Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lease Details Table
            </Typography>
            
            {/* Search */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Search by building name, city, state, or lease number"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </Box>

            {/* Results Summary */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {paginatedLeases.length} of {filteredLeases.length} leases
                (Page {currentPage} of {totalPages})
              </Typography>
            </Box>

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Building Name</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Lease Number</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLeases.map((lease) => (
                    <TableRow key={lease.id} hover>
                      <TableCell>
                        <MuiTooltip title={lease.address}>
                          <Typography variant="body2" fontWeight="medium">
                            {lease.buildingName}
                          </Typography>
                        </MuiTooltip>
                      </TableCell>
                      <TableCell>{lease.city}</TableCell>
                      <TableCell>{lease.state}</TableCell>
                      <TableCell>{lease.leaseNumber}</TableCell>
                      <TableCell>{lease.effectiveDateFormatted}</TableCell>
                      <TableCell>{lease.expirationDateFormatted}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={lease.status}
                          color={lease.status === 'Expired' ? 'error' : 
                                 lease.status === 'Expiring Soon' ? 'warning' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Stack spacing={2} alignItems="center" sx={{ mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {processedLeases.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No valid lease data found. Leases must have lease number, effective date, expiration date, and federal lease code.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LeasedPropertiesPage; 