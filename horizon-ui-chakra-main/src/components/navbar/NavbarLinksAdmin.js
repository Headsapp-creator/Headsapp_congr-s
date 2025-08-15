// Chakra Imports
import {
  Avatar,
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  useColorMode,
} from '@chakra-ui/react';
// Custom Components
import { SearchBar } from 'components/navbar/searchBar/SearchBar';
import { SidebarResponsive } from 'components/sidebar/Sidebar';
import PropTypes from 'prop-types';
import React from 'react';
// Assets
import { MdNotificationsNone,  } from 'react-icons/md';
import { IoMdMoon, IoMdSunny } from 'react-icons/io';
import { FaEthereum } from 'react-icons/fa';
import routes from 'routes';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function HeaderLinks(props) {
  const { secondary } = props;
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate(); // Initialize the navigate function

  // Chakra Color Mode
  const navbarIcon = useColorModeValue('gray.400', 'white');
  let menuBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorBrand = useColorModeValue('brand.700', 'brand.400');
  const ethColor = useColorModeValue('gray.700', 'white');
  const borderColor = useColorModeValue('#E6ECFA', 'rgba(135, 140, 189, 0.3)');
  const ethBg = useColorModeValue('secondaryGray.300', 'navy.900');
  const ethBox = useColorModeValue('white', 'navy.800');
  const shadow = useColorModeValue(
    '14px 17px 40px 4px rgba(112, 144, 176, 0.18)',
    '14px 17px 40px 4px rgba(112, 144, 176, 0.06)',
  );



  const [notifications, setNotifications] = React.useState([]);
// eslint-disable-next-line no-unused-vars
const [hasUnread, setHasUnread] = React.useState(false);
const unreadCount = notifications.filter(n => !n.isRead).length;

React.useEffect(() => {
  fetch("http://localhost:5000/communications/admin/notifications")
    .then(res => res.json())
    .then(data => {
      setNotifications(data);
      setHasUnread(data.some(n => !n.isRead));
    });

// Listen for real-time notifications
    socket.on("admin-notification", (notif) => {
      setNotifications(prev => [{ ...notif, id: Math.random().toString() }, ...prev]);
      setHasUnread(true);
    });

    // Cleanup on unmount
    return () => {
      socket.off("admin-notification");
    };

}, []);

const markAllRead = async () => {
  await fetch("http://localhost:5000/communications/admin/notifications/mark-all-read", { method: "POST" });
  // Refresh notifications
  fetch("http://localhost:5000/communications/admin/notifications")
    .then(res => res.json())
    .then(data => {
      setNotifications(data);
      setHasUnread(false);
    });
};

const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await fetch(`http://localhost:5000/communications/admin/notifications/${n.id}/read`, { 
        method: "POST" 
      });
      setNotifications(prev =>
        prev.map(x => x.id === n.id ? { ...x, isRead: true } : x)
      );
    }
    
    // Scroll to the referenced document if it exists
    if (n.documentId) {
      const element = document.getElementById(n.documentId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Optional: highlight the element temporarily
        element.style.transition = 'background-color 0.5s';
        element.style.backgroundColor = colorMode === 'light' ? '#E6FFFA' : '#2C5282';
        setTimeout(() => {
          element.style.backgroundColor = '';
        }, 2000);
      }
    }
  };

  return (
    <Flex
      w={{ sm: '100%', md: 'auto' }}
      alignItems="center"
      flexDirection="row"
      bg={menuBg}
      flexWrap={secondary ? { base: 'wrap', md: 'nowrap' } : 'unset'}
      p="10px"
      borderRadius="30px"
      boxShadow={shadow}
    >
      <SearchBar
        mb={() => {
          if (secondary) {
            return { base: '10px', md: 'unset' };
          }
          return 'unset';
        }}
        me="10px"
        borderRadius="30px"
      />
      <Flex
        bg={ethBg}
        display={secondary ? 'flex' : 'none'}
        borderRadius="30px"
        ms="auto"
        p="6px"
        align="center"
        me="6px"
      >
        <Flex
          align="center"
          justify="center"
          bg={ethBox}
          h="29px"
          w="29px"
          borderRadius="30px"
          me="7px"
        >
          <Icon color={ethColor} w="9px" h="14px" as={FaEthereum} />
        </Flex>
        <Text
          w="max-content"
          color={ethColor}
          fontSize="sm"
          fontWeight="700"
          me="6px"
        >
          1,924
          <Text as="span" display={{ base: 'none', md: 'unset' }}>
            {' '}
            ETH
          </Text>
        </Text>
      </Flex>
      <SidebarResponsive routes={routes} />
      <Menu>
        <MenuButton p="0px" position="relative">
      <Icon
        mt="6px"
        as={MdNotificationsNone}
        color={navbarIcon}
        w="18px"
        h="18px"
        me="10px"
      />
      {unreadCount > 0 && (
  <span
    style={{
      position: "absolute",
      top: 0,
      right: 0,
      minWidth: 18,
      height: 18,
      background: "red",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
      zIndex: 1,
      padding: "0 5px"
    }}
  >
    {unreadCount}
  </span>
)}
    </MenuButton>
        <MenuList
          boxShadow={shadow}
          p="20px"
          borderRadius="20px"
          bg={menuBg}
          border="none"
          mt="22px"
          me={{ base: '30px', md: 'unset' }}
          minW={{ base: 'unset', md: '400px', xl: '450px' }}
          maxW={{ base: '360px', md: 'unset' }}
        >
          <Flex w="100%" mb="20px">
            <Text fontSize="md" fontWeight="600" color={textColor}>
              Notifications
            </Text>
            <Text
  fontSize="sm"
  fontWeight="500"
  color={textColorBrand}
  ms="auto"
  cursor={unreadCount > 0 ? "pointer" : "not-allowed"}
  opacity={unreadCount > 0 ? 1 : 0.5}
  onClick={unreadCount > 0 ? markAllRead : undefined}
>
  Mark all read
</Text>
          </Flex>
          <Flex flexDirection="column" maxHeight="300px" overflowY="auto">
            {notifications.length === 0 && (
          <Text color="gray.400" fontSize="sm">No notifications</Text>
        )}
        {notifications.map(n => (
            <MenuItem
      key={n.id}
      _hover={{ bg: 'none' }}
      _focus={{ bg: 'none' }}
      px="0"
      borderRadius="8px"
      mb="10px"
      onClick={() => handleNotificationClick(n)}
    >
      <Text
        fontWeight={n.isRead ? "400" : "700"}
        color={n.isRead ? "gray.400" : textColor}
      >
        {n.message}
      </Text>
      <Text fontSize="xs" color="gray.500" ml={2}>
        {new Date(n.createdAt).toLocaleString()}
      </Text>
    </MenuItem>
            ))}
          </Flex>
        </MenuList>
      </Menu>

      

      <Button
        variant="no-hover"
        bg="transparent"
        p="0px"
        minW="unset"
        minH="unset"
        h="18px"
        w="max-content"
        onClick={toggleColorMode}
      >
        <Icon
          me="10px"
          h="18px"
          w="18px"
          color={navbarIcon}
          as={colorMode === 'light' ? IoMdMoon : IoMdSunny}
        />
      </Button>
      <Menu>
        <MenuButton p="0px">
          <Avatar
            _hover={{ cursor: 'pointer' }}
            color="white"
            name="Admin "
            bg="#11047A"
            size="sm"
            w="40px"
            h="40px"
          />
        </MenuButton>
        <MenuList
          boxShadow={shadow}
          p="0px"
          mt="10px"
          borderRadius="20px"
          bg={menuBg}
          border="none"
        >
          <Flex w="100%" mb="0px">
            <Text
              ps="20px"
              pt="16px"
              pb="10px"
              w="100%"
              borderBottom="1px solid"
              borderColor={borderColor}
              fontSize="sm"
              fontWeight="700"
              color={textColor}
            >
              👋&nbsp; Hey, Admin
            </Text>
          </Flex>
          <Flex flexDirection="column" p="10px">
            <MenuItem
              _hover={{ bg: 'none' }}
              _focus={{ bg: 'none' }}
              borderRadius="8px"
              px="14px"
              onClick={() => navigate('/admin/profile')} // Redirect to the "Users" route
            >
              <Text fontSize="sm">Profile Settings</Text>
            </MenuItem>
            <MenuItem
              _hover={{ bg: 'none' }}
              _focus={{ bg: 'none' }}
              borderRadius="8px"
              px="14px"
            >
              <Text fontSize="sm">Newsletter Settings</Text>
            </MenuItem>
            <MenuItem
              _hover={{ bg: 'none' }}
              _focus={{ bg: 'none' }}
              color="red.400"
              borderRadius="8px"
              px="14px"
            >
              <Text fontSize="sm">Log out</Text>
            </MenuItem>
          </Flex>
        </MenuList>
      </Menu>
    </Flex>
  );
}

HeaderLinks.propTypes = {
  variant: PropTypes.string,
  fixed: PropTypes.bool,
  secondary: PropTypes.bool,
  onOpen: PropTypes.func,
};
