// Chakra imports
import { Portal, Box, useDisclosure } from '@chakra-ui/react';
import Footer from 'components/footer/FooterAdmin.js';
// Layout components
import Navbar from 'components/navbar/NavbarAdmin.js';
import Sidebar from 'components/sidebar/Sidebar.js';
import { SidebarContext } from 'contexts/SidebarContext';
import React, { useState, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import routes from 'routes.js';

// Custom Chakra theme
export default function Dashboard(props) {
  const { ...rest } = props;
  // states and functions
  const [fixed] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [activeRoute, setActiveRoute] = useState('Default Brand Text');
  const [activeNavbar, setActiveNavbar] = useState(false);
  const [activeNavbarText, setActiveNavbarText] = useState(false);

  const location = useLocation();

  // Update active route dynamically
  useEffect(() => {
    const updateActiveRoute = () => {
      const getActiveRoute = (routes) => {
        for (let i = 0; i < routes.length; i++) {
          if (routes[i].collapse) {
            let collapseActiveRoute = getActiveRoute(routes[i].items);
            if (collapseActiveRoute) {
              return collapseActiveRoute;
            }
          } else if (routes[i].category) {
            let categoryActiveRoute = getActiveRoute(routes[i].items);
            if (categoryActiveRoute) {
              return categoryActiveRoute;
            }
          } else {
            if (
              location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1
            ) {
              return routes[i].name;
            }
          }
        }
        return 'Default Brand Text';
      };

      const getActiveNavbar = (routes) => {
        for (let i = 0; i < routes.length; i++) {
          if (routes[i].collapse) {
            let collapseActiveNavbar = getActiveNavbar(routes[i].items);
            if (collapseActiveNavbar) {
              return collapseActiveNavbar;
            }
          } else if (routes[i].category) {
            let categoryActiveNavbar = getActiveNavbar(routes[i].items);
            if (categoryActiveNavbar) {
              return categoryActiveNavbar;
            }
          } else {
            if (
              location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1
            ) {
              return routes[i].secondary;
            }
          }
        }
        return false;
      };

      const getActiveNavbarText = (routes) => {
        for (let i = 0; i < routes.length; i++) {
          if (routes[i].collapse) {
            let collapseActiveNavbar = getActiveNavbarText(routes[i].items);
            if (collapseActiveNavbar) {
              return collapseActiveNavbar;
            }
          } else if (routes[i].category) {
            let categoryActiveNavbar = getActiveNavbarText(routes[i].items);
            if (categoryActiveNavbar) {
              return categoryActiveNavbar;
            }
          } else {
            if (
              location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1
            ) {
              return routes[i].messageNavbar;
            }
          }
        }
        return false;
      };

      setActiveRoute(getActiveRoute(routes));
      setActiveNavbar(getActiveNavbar(routes));
      setActiveNavbarText(getActiveNavbarText(routes));
    };

    updateActiveRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, routes]);

  const getRoutes = (routes) => {
    return routes.map((route, key) => {
      if (route.layout === '/admin') {
        return (
          <Route path={`${route.path}`} element={route.component} key={key} />
        );
      }
      if (route.collapse) {
        return getRoutes(route.items);
      } else {
        return null;
      }
    });
  };

  document.documentElement.dir = 'ltr';
  const { onOpen } = useDisclosure();
  document.documentElement.dir = 'ltr';
  return (
    <Box>
      <Box>
        <SidebarContext.Provider
          value={{
            toggleSidebar,
            setToggleSidebar,
          }}
        >
          <Sidebar routes={routes} display="none" {...rest} />
          <Box
            float="right"
            minHeight="100vh"
            height="100%"
            overflow="auto"
            position="relative"
            maxHeight="100%"
            w={{ base: '100%', xl: 'calc( 100% - 290px )' }}
            maxWidth={{ base: '100%', xl: 'calc( 100% - 290px )' }}
            transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
            transitionDuration=".2s, .2s, .35s"
            transitionProperty="top, bottom, width"
            transitionTimingFunction="linear, linear, ease"
          >
            <Portal>
              <Box>
                <Navbar
                  onOpen={onOpen}
                  logoText={'Horizon UI Dashboard PRO'}
                  brandText={activeRoute}
                  secondary={activeNavbar}
                  message={activeNavbarText}
                  fixed={fixed}
                  {...rest}
                />
              </Box>
            </Portal>

            {location.pathname !== '/admin/full-screen-maps' ? (
              <Box
                mx="auto"
                p={{ base: '20px', md: '30px' }}
                pe="20px"
                minH="100vh"
                pt="50px"
              >
                <Routes>
                  {getRoutes(routes)}
                  <Route
                    path="/"
                    element={<Navigate to="/admin/default" replace />}
                  />
                </Routes>
              </Box>
            ) : null}
            <Box>
              <Footer />
            </Box>
          </Box>
        </SidebarContext.Provider>
      </Box>
    </Box>
  );
}
