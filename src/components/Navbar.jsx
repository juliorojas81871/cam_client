import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          CAM Ventures
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<HomeIcon />}
          >
            Properties
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/map"
            startIcon={<MapIcon />}
          >
            Map
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/owned"
            startIcon={<BusinessIcon />}
          >
            Owned Properties
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/leased"
            startIcon={<AssignmentIcon />}
          >
            Leased Properties
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 