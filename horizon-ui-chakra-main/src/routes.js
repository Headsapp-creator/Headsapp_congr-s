import React from 'react';

import { Icon } from '@chakra-ui/react';
import {
  MdBarChart,
  MdPerson,
  MdHome,
  MdCloudUpload
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/default';
import Document from 'views/admin/document';
import Profile from 'views/admin/profile';
import DataTables from 'views/admin/dataTables';

const routes = [
  {
    name: 'Main Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
    roles: ['ADMIN'], 
  },
  {
    name: 'Document',
    layout: '/admin',
    path: '/document',
    icon: (
      <Icon
        as={MdCloudUpload}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <Document />,
    roles: ['ADMIN'],
  },
  {
    name: 'Events',
    layout: '/admin',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    path: '/data-tables',
    component: <DataTables />,
    roles: ['ADMIN'], 
  },
  {
    name: 'Profile',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
    roles: ['ADMIN'], 
    hidden: true,
  },
/*{
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
  },
  {
    name: 'RTL Admin',
    layout: '/rtl',
    path: '/rtl-default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <RTL />,
  },*/
];

export default routes;
